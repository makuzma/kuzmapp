import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { metalHolding } from '../../../drizzle/schema'

interface PortfolioItem {
  id: string
  name: string
  color: string
  portfolioType: string
  stockCount: number
  metalCount: number
}

interface StockTranche {
  id: string
  shares: number | null
  purchasePrice: number | null
  purchaseDate: string | null
  portfolioId: string | null
  createdAt: string
}

interface StockItem {
  symbol: string
  name: string
  price: number | null
  changePercent: number | null
  currency: string
  totalShares: number | null
  tranches: StockTranche[]
}

const METAL_SYMBOLS: Record<string, string> = {
  gold: 'GC=F', silver: 'SI=F', platinum: 'PL=F', palladium: 'PA=F',
}
const G_PER_OZ = 31.1035
function toOz(quantity: number, unit: string) {
  if (unit === 'g') return quantity / G_PER_OZ
  if (unit === 'kg') return (quantity * 1000) / G_PER_OZ
  return quantity
}
async function fetchSpotUsd(symbol: string): Promise<number | null> {
  try {
    const data = await $fetch<any>(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null
  } catch { return null }
}

const COLOR_HEX: Record<string, string> = {
  blue:   '#3b82f6',
  green:  '#22c55e',
  yellow: '#f59e0b',
  red:    '#ef4444',
  purple: '#8b5cf6',
  pink:   '#ec4899',
  cyan:   '#06b6d4',
  orange: '#f97316',
  gray:   '#6b7280',
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const [portfolios, stocks, metalRows, fx, companySettings] = await Promise.all([
    $fetch<PortfolioItem[]>('/api/portfolios', { headers: event.headers }),
    $fetch<StockItem[]>('/api/stocks/watchlist', { headers: event.headers }),
    db.select().from(metalHolding).where(eq(metalHolding.userId, session.user.id)),
    $fetch<Record<string, number>>('/api/stocks/fx', { headers: event.headers }).catch(() => ({} as Record<string, number>)),
    $fetch<{ currency: string }>('/api/settings/company', { headers: event.headers }).catch(() => ({ currency: 'CHF' })),
  ])

  const companyCurrency = companySettings.currency ?? 'CHF'
  const fxRates: Record<string, number> = { CHF: 1, ...fx }
  function convertTo(amount: number, fromCurrency: string): number {
    const inChf = amount * (fxRates[fromCurrency] ?? 1)
    return inChf / (fxRates[companyCurrency] ?? 1)
  }

  // Fetch metal spot prices + gold.ch data in parallel
  const uniqueMetalKeys = [...new Set(metalRows.map(r => r.metalKey))]
  const [spotResults, goldchData] = await Promise.all([
    Promise.all(uniqueMetalKeys.map(async key => ({ key, price: await fetchSpotUsd(METAL_SYMBOLS[key] ?? '') }))),
    $fetch<any[]>('/api/metals/goldch', { headers: event.headers }).catch(() => [] as any[]),
  ])
  const spotMap: Record<string, number | null> = {}
  for (const s of spotResults) spotMap[s.key] = s.price

  function norm(s: string) {
    return s.toLowerCase().replace(/krügerrand/g, 'krugerrand').replace(/[^a-z0-9]/g, '')
  }
  function matchGoldch(coinType: string, metalKey: string): number | null {
    if (!coinType) return null
    const n = norm(coinType)
    const item = (goldchData as any[])
      .filter(i => i.metal === metalKey)
      .find(i => norm(i.label).includes(n) || n.includes(norm(i.label).replace(/^\d+[a-z]*/, '').trim()))
    return item?.expensive ?? null // Ankaufspreis
  }

  // Accumulate value + weighted 1D change per portfolioId
  const byPortfolio: Record<string, { value: number; changeWeightedSum: number; changeWeight: number }> = {}
  const ensure = (id: string) => {
    if (!byPortfolio[id]) byPortfolio[id] = { value: 0, changeWeightedSum: 0, changeWeight: 0 }
  }

  // Stocks: convert to company currency using FX rates
  for (const stock of stocks) {
    const price = stock.price ?? 0
    const changePct = stock.changePercent ?? 0
    for (const t of stock.tranches) {
      if (!t.portfolioId) continue
      const val = convertTo(price * (t.shares ?? 0), stock.currency)
      ensure(t.portfolioId)
      byPortfolio[t.portfolioId].value += val
      byPortfolio[t.portfolioId].changeWeightedSum += changePct * val
      byPortfolio[t.portfolioId].changeWeight += val
    }
  }

  // Metals: gold.ch Ankaufspreis wenn verfügbar, sonst Spot × oz
  for (const m of metalRows) {
    if (!m.portfolioId) continue
    const goldchAnkauf = matchGoldch(m.coinType ?? '', m.metalKey)
    let val: number
    if (goldchAnkauf != null) {
      // gold.ch Preis ist in CHF pro Stück (Ankaufspreis)
      val = convertTo(goldchAnkauf * m.quantity, 'CHF')
    } else {
      const spotUsd = spotMap[m.metalKey]
      if (spotUsd == null) continue
      const oz = toOz(m.quantity, m.unit)
      val = convertTo(spotUsd * oz, 'USD')
    }
    ensure(m.portfolioId)
    byPortfolio[m.portfolioId].value += val
    byPortfolio[m.portfolioId].changeWeight += val
  }

  // Group portfolios by type, sum values
  const groups: Record<string, {
    type: string; value: number; changeWeightedSum: number; changeWeight: number; color: string; count: number
  }> = {}

  for (const p of portfolios) {
    const type = p.portfolioType?.trim() || p.name
    const pv = byPortfolio[p.id]
    if (!groups[type]) {
      groups[type] = { type, value: 0, changeWeightedSum: 0, changeWeight: 0, color: COLOR_HEX[p.color] ?? '#6b7280', count: 0 }
    }
    groups[type].value += pv?.value ?? 0
    groups[type].changeWeightedSum += pv?.changeWeightedSum ?? 0
    groups[type].changeWeight += pv?.changeWeight ?? 0
    groups[type].count++
  }

  const result = Object.values(groups)
    .map(g => ({
      type:      g.type,
      value:     Math.round(g.value),
      changePct: g.changeWeight > 0 ? parseFloat((g.changeWeightedSum / g.changeWeight).toFixed(2)) : 0,
      color:     g.color,
      count:     g.count,
    }))
    .sort((a, b) => b.value - a.value)

  const totalValue = result.reduce((s, g) => s + g.value, 0)
  const totalChangePct = totalValue > 0
    ? parseFloat((result.reduce((s, g) => s + g.changePct * g.value, 0) / totalValue).toFixed(2))
    : 0

  return { groups: result, totalValue, totalChangePct }
})
