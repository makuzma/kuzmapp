import { auth } from '../../lib/auth'

interface StockTranche {
  shares: number | null
  portfolioId: string | null
}
interface StockItem {
  price: number | null
  tranches: StockTranche[]
}
interface MetalItem {
  portfolioId: string | null
  currentTotal: number | null
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const [stocks, metals] = await Promise.all([
    $fetch<StockItem[]>('/api/stocks/watchlist', { headers: event.headers }),
    $fetch<MetalItem[]>('/api/metals/holdings', { headers: event.headers, query: { currency: 'CHF' } }),
  ])

  const values: Record<string, number> = {}

  for (const stock of stocks) {
    const price = stock.price ?? 0
    for (const t of stock.tranches) {
      if (!t.portfolioId) continue
      values[t.portfolioId] = (values[t.portfolioId] ?? 0) + price * (t.shares ?? 0)
    }
  }

  for (const m of metals) {
    if (!m.portfolioId) continue
    values[m.portfolioId] = (values[m.portfolioId] ?? 0) + (m.currentTotal ?? 0)
  }

  return values // { [portfolioId]: value }
})
