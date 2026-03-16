import { eq, and, isNull } from 'drizzle-orm'
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

  const withPrices = await Promise.all(
    rows.map(async (row) => {
      const { price, changePercent, currency } = await fetchPrice(row.symbol)
      return {
        id: row.id,
        symbol: row.symbol,
        name: row.name,
        exchange: row.exchange,
        currency: currency || row.currency,
        price,
        changePercent,
        shares: row.shares,
        purchasePrice: row.purchasePrice,
        purchaseDate: row.purchaseDate,
        portfolioId: row.portfolioId,
        createdAt: row.createdAt,
      }
    })
  )

  return withPrices
})
