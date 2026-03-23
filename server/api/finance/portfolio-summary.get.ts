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

  const [portfolios, stocks, metalRows, cashRows, fx, companySettings] = await Promise.all([
    $fetch<PortfolioItem[]>('/api/portfolios', { headers: event.headers }),
    $fetch<StockItem[]>('/api/stocks/watchlist', { headers: event.headers }),
    db.select().from(metalHolding).where(eq(metalHolding.userId, session.user.id)),
    $fetch<any[]>('/api/finance/cash', { headers: event.headers }).catch(() => [] as any[]),
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

  // Cash: pro Portfolio dazurechnen (kein changePct)
  // Schulden-Portfolios werden negativ gewertet
  // Lending-Portfolios: nur aktuelles Jahr, Wert = lendingKapitalTotal
  // Aktien-Portfolio-Cash → wird separat zur Cash-Gruppe gezählt (damit Cash-Minicard = Bargeld-Sektion)
  const DEBT_TYPES = new Set(['Schulden'])
  const CURRENT_YEAR = new Date().getFullYear()
  let aktienCashTotal = 0
  for (const c of cashRows) {
    if (!c.portfolioId) continue
    const portfolio = portfolios.find(p => p.id === c.portfolioId)
    const portfolioType = portfolio?.portfolioType?.trim() ?? ''
    const isDebt = DEBT_TYPES.has(portfolioType)
    const isLending = portfolioType === 'Lending'
    const isAktien = portfolioType === 'Aktien'
    if (isLending) {
      if (c.lendingJahr !== CURRENT_YEAR) continue
      const val = convertTo(c.lendingKapitalTotal ?? c.lendingKapital ?? c.amount, c.currency)
      ensure(c.portfolioId)
      byPortfolio[c.portfolioId].value += val
    } else if (isAktien) {
      // Broker-Cash gehört zur Cash-Gruppe, nicht zu Aktien
      aktienCashTotal += convertTo(c.amount, c.currency)
    } else {
      const val = convertTo(c.amount, c.currency)
      ensure(c.portfolioId)
      // Schulden: Vorzeichen beibehalten (Mischung aus pos./neg. Einträgen möglich)
      // Negierung erfolgt beim finalen Mapping (wie auf der Seite via Math.abs)
      byPortfolio[c.portfolioId].value += val
    }
  }

  // Group portfolios by type, sum values
  const groups: Record<string, {
    type: string; value: number; changeWeightedSum: number; changeWeight: number; color: string; count: number
  }> = {}

  // Normalize portfolio types to display categories
  const TYPE_MAP: Record<string, string> = {
    'Säule 3A': 'Vorsorge',
    'Bankkonto': 'Cash',
  }
  const CATEGORY_ORDER = ['Aktien', 'Vorsorge', 'Lending', 'Schulden', 'Cash', 'Edelmetalle']
  const CATEGORY_COLORS: Record<string, string> = {
    'Aktien':     '#3b82f6',
    'Vorsorge':   '#22c55e',
    'Lending':    '#f97316',
    'Schulden':   '#ef4444',
    'Cash':       '#6b7280',
    'Edelmetalle':'#eab308',
  }

  for (const p of portfolios) {
    const rawType = p.portfolioType?.trim() || p.name
    // TYPE_MAP-Typen (z.B. 'Säule 3A' → 'Vorsorge') mit trim auflösen.
    // Für nicht gemappte Typen den Originalnamen (ohne trim) verwenden,
    // damit ' Schulden' o.ä. mit Whitespace nicht versehentlich unter 'Schulden' landet.
    const type = TYPE_MAP[rawType] ?? p.portfolioType ?? rawType
    const pv = byPortfolio[p.id]
    if (!groups[type]) {
      groups[type] = { type, value: 0, changeWeightedSum: 0, changeWeight: 0, color: CATEGORY_COLORS[type] ?? COLOR_HEX[p.color] ?? '#6b7280', count: 0 }
    }
    groups[type].value += pv?.value ?? 0
    groups[type].changeWeightedSum += pv?.changeWeightedSum ?? 0
    groups[type].changeWeight += pv?.changeWeight ?? 0
    groups[type].count++
  }

  // Aktien-Broker-Cash zur Cash-Gruppe addieren
  if (!groups['Cash']) {
    groups['Cash'] = { type: 'Cash', value: 0, changeWeightedSum: 0, changeWeight: 0, color: CATEGORY_COLORS['Cash'], count: 0 }
  }
  groups['Cash'].value += aktienCashTotal

  // Ensure all 6 categories always appear, in fixed order
  for (const cat of CATEGORY_ORDER) {
    if (!groups[cat]) {
      groups[cat] = { type: cat, value: 0, changeWeightedSum: 0, changeWeight: 0, color: CATEGORY_COLORS[cat], count: 0 }
    }
  }

  const result = Object.values(groups)
    .filter(g => CATEGORY_ORDER.includes(g.type))
    .map(g => ({
      type:      g.type,
      // Schulden: Netto-Summe negieren (wie auf der Seite via -Math.abs)
      value:     g.type === 'Schulden' ? -Math.abs(Math.round(g.value)) : Math.round(g.value),
      changePct: g.changeWeight > 0 ? parseFloat((g.changeWeightedSum / g.changeWeight).toFixed(2)) : 0,
      color:     g.color,
      count:     g.count,
    }))
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.type) - CATEGORY_ORDER.indexOf(b.type))

  const totalValue = result.reduce((s, g) => s + g.value, 0)
  const totalChangePct = totalValue > 0
    ? parseFloat((result.reduce((s, g) => s + g.changePct * g.value, 0) / totalValue).toFixed(2))
    : 0

  return { groups: result, totalValue, totalChangePct }
})
