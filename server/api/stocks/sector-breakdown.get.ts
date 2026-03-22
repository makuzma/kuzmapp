import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { stockWatchlist } from '../../../drizzle/schema'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const rows = await db.select().from(stockWatchlist).where(eq(stockWatchlist.userId, session.user.id))
  if (!rows.length) return []

  const symbols = [...new Set(rows.map(r => r.symbol))]

  // Prices from chart API (no auth needed)
  const priceMap: Record<string, { price: number | null; currency: string }> = {}
  await Promise.all(symbols.map(async (symbol) => {
    try {
      const data = await $fetch<any>(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
        { headers: { 'User-Agent': UA } },
      )
      const meta = data?.chart?.result?.[0]?.meta
      priceMap[symbol] = { price: meta?.regularMarketPrice ?? null, currency: meta?.currency ?? 'CHF' }
    } catch {
      priceMap[symbol] = { price: null, currency: 'CHF' }
    }
  }))

  const fx = await $fetch<Record<string, number>>('/api/stocks/fx', { headers: event.headers }).catch(() => ({} as Record<string, number>))
  const fxRates: Record<string, number> = { CHF: 1, ...fx }

  const sectorValues: Record<string, number> = {}
  let total = 0

  for (const row of rows) {
    if (!row.shares) continue
    const p = priceMap[row.symbol]
    const sector = row.sector
    if (!p?.price || !sector) continue
    const valChf = p.price * row.shares * (fxRates[p.currency] ?? 1)
    sectorValues[sector] = (sectorValues[sector] ?? 0) + valChf
    total += valChf
  }

  return Object.entries(sectorValues)
    .sort((a, b) => b[1] - a[1])
    .map(([sector, val]) => ({
      sector,
      pct: total > 0 ? parseFloat(((val / total) * 100).toFixed(1)) : 0,
    }))
})
