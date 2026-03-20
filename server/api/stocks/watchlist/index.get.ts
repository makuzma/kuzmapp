import { eq, and } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { stockWatchlist } from '../../../../drizzle/schema'

async function fetchPrice(symbol: string): Promise<{ price: number | null; changePercent: number | null; currency: string }> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
    const data = await $fetch<any>(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; watchlist-app/1.0)' },
    })
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) return { price: null, changePercent: null, currency: '' }
    const price = meta.regularMarketPrice ?? null
    const prev = meta.chartPreviousClose ?? null
    const changePercent = price != null && prev != null && prev !== 0
      ? ((price - prev) / prev) * 100
      : null
    return { price, changePercent, currency: meta.currency ?? '' }
  } catch {
    return { price: null, changePercent: null, currency: '' }
  }
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { portfolioId } = getQuery(event)

  const where = portfolioId
    ? and(eq(stockWatchlist.userId, session.user.id), eq(stockWatchlist.portfolioId, portfolioId as string))
    : eq(stockWatchlist.userId, session.user.id)

  const rows = await db
    .select()
    .from(stockWatchlist)
    .where(where)
    .orderBy(stockWatchlist.createdAt)

  // Fetch prices for unique symbols in parallel
  const symbols = [...new Set(rows.map(r => r.symbol))]
  const priceMap = new Map<string, { price: number | null; changePercent: number | null; currency: string }>()
  await Promise.all(symbols.map(async (sym) => {
    priceMap.set(sym, await fetchPrice(sym))
  }))

  // Group rows by symbol
  const groupMap = new Map<string, { firstRow: typeof rows[0]; rows: typeof rows }>()
  for (const row of rows) {
    if (!groupMap.has(row.symbol)) {
      groupMap.set(row.symbol, { firstRow: row, rows: [] })
    }
    groupMap.get(row.symbol)!.rows.push(row)
  }

  return Array.from(groupMap.values()).map(({ firstRow, rows: groupRows }) => {
    const { price, changePercent, currency } = priceMap.get(firstRow.symbol)!

    // Weighted average purchase price (only tranches with both shares and purchasePrice)
    const tranchesWithData = groupRows.filter(r => r.shares && r.purchasePrice)
    const totalSharesForAvg = tranchesWithData.reduce((s, r) => s + r.shares!, 0)
    const avgPurchasePrice = totalSharesForAvg > 0
      ? tranchesWithData.reduce((s, r) => s + r.shares! * r.purchasePrice!, 0) / totalSharesForAvg
      : null

    const totalSharesRaw = groupRows.reduce((s, r) => s + (r.shares ?? 0), 0)
    const totalShares = totalSharesRaw > 0 ? totalSharesRaw : null

    return {
      symbol: firstRow.symbol,
      name: firstRow.name,
      exchange: firstRow.exchange,
      currency: currency || firstRow.currency,
      price,
      changePercent,
      totalShares,
      avgPurchasePrice,
      tranches: groupRows.map(r => ({
        id: r.id,
        shares: r.shares,
        purchasePrice: r.purchasePrice,
        purchaseDate: r.purchaseDate,
        portfolioId: r.portfolioId,
        createdAt: r.createdAt,
      })),
    }
  })
})
