import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { stockWatchlist } from '../../../drizzle/schema'

async function fetchAnnualDividend(symbol: string): Promise<{ dividendRate: number | null; exDividendDate: string | null; currentPrice: number | null }> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2y&events=div`
    const data = await $fetch<any>(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; watchlist-app/1.0)' },
    })

    const result = data?.chart?.result?.[0]
    if (!result) return { dividendRate: null, exDividendDate: null, currentPrice: null }

    const currentPrice: number | null = result.meta?.regularMarketPrice ?? null

    const dividendEvents = result.events?.dividends as Record<string, { amount: number; date: number }> | undefined
    if (!dividendEvents) return { dividendRate: null, exDividendDate: null, currentPrice }

    const allDivs = Object.values(dividendEvents).sort((a, b) => b.date - a.date)
    if (!allDivs.length) return { dividendRate: null, exDividendDate: null, currentPrice }

    // Sum dividends from the last 365 days
    const oneYearAgo = Date.now() / 1000 - 365 * 24 * 3600
    const annualRate = allDivs
      .filter(d => d.date >= oneYearAgo)
      .reduce((s, d) => s + d.amount, 0)

    // ex-dividend date from meta
    const exTs = result.meta?.exDividendDate
    const exDividendDate = exTs ? new Date(exTs * 1000).toISOString().slice(0, 10) : null

    return { dividendRate: annualRate > 0 ? annualRate : null, exDividendDate, currentPrice }
  } catch {
    return { dividendRate: null, exDividendDate: null, currentPrice: null }
  }
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const query = getQuery(event)
  const portfolioId = query.portfolioId as string | undefined

  const rows = await db.select().from(stockWatchlist)
    .where(eq(stockWatchlist.userId, session.user.id))

  const withShares = rows.filter(r =>
    r.shares && r.shares > 0 &&
    (!portfolioId || r.portfolioId === portfolioId)
  )

  // Group by symbol, sum shares
  const symbolMap = new Map<string, { firstRow: typeof rows[0]; totalShares: number }>()
  for (const r of withShares) {
    if (!symbolMap.has(r.symbol)) {
      symbolMap.set(r.symbol, { firstRow: r, totalShares: r.shares! })
    } else {
      symbolMap.get(r.symbol)!.totalShares += r.shares!
    }
  }

  const results = await Promise.all(
    Array.from(symbolMap.entries()).map(async ([symbol, { firstRow, totalShares }]) => {
      const { dividendRate, exDividendDate, currentPrice } = await fetchAnnualDividend(symbol)
      const yieldPct = dividendRate != null && currentPrice != null && currentPrice > 0
        ? (dividendRate / currentPrice) * 100
        : null
      return {
        id: firstRow.id,
        symbol,
        name: firstRow.name,
        currency: firstRow.currency,
        shares: totalShares,
        dividendRate,
        annualDividend: dividendRate != null ? dividendRate * totalShares : null,
        exDividendDate,
        yield: yieldPct,
        portfolioId: firstRow.portfolioId,
      }
    })
  )

  return results.filter(r => r.dividendRate != null)
})
