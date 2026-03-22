import { eq } from 'drizzle-orm'
import { generateId } from 'better-auth'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { portfolioSnapshot } from '../../../../drizzle/schema'

const METAL_NAMES: Record<string, string> = {
  gold: 'Gold', silver: 'Silber', platinum: 'Platin', palladium: 'Palladium',
}
const METAL_SYMBOLS: Record<string, string> = {
  gold: 'GC=F', silver: 'SI=F', platinum: 'PL=F', palladium: 'PA=F',
}
const G_PER_OZ = 31.1035
const UA = 'Mozilla/5.0 (compatible; finance-backfill/1.0)'

function toOz(quantity: number, unit: string): number {
  if (unit === 'g') return quantity / G_PER_OZ
  if (unit === 'kg') return (quantity * 1000) / G_PER_OZ
  return quantity
}

async function fetchHistory(symbol: string): Promise<Map<string, number>> {
  try {
    const data = await $fetch<any>(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`,
      { headers: { 'User-Agent': UA } },
    )
    const result = data?.chart?.result?.[0]
    if (!result) return new Map()
    const timestamps: number[] = result.timestamp ?? []
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? []
    const map = new Map<string, number>()
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i]
      if (close != null) {
        const date = new Date(timestamps[i] * 1000).toISOString().slice(0, 10)
        map.set(date, close)
      }
    }
    return map
  }
  catch { return new Map() }
}

/** Returns the closing price on or before the given date */
function getPriceOn(history: Map<string, number>, date: string): number | null {
  if (history.has(date)) return history.get(date)!
  const sorted = [...history.keys()].sort()
  const before = sorted.filter(d => d < date)
  if (!before.length) return null
  return history.get(before[before.length - 1]) ?? null
}

/** Returns the closing price of the previous trading day before date */
function getPrevPrice(history: Map<string, number>, date: string): number | null {
  const sorted = [...history.keys()].sort()
  const before = sorted.filter(d => d < date)
  if (!before.length) return null
  return history.get(before[before.length - 1]) ?? null
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const [portfolios, watchlist, cashBalances, metalHoldings, companySettings, fx] = await Promise.all([
    $fetch<any[]>('/api/portfolios', { headers: event.headers }),
    $fetch<any[]>('/api/stocks/watchlist', { headers: event.headers }),
    $fetch<any[]>('/api/finance/cash', { headers: event.headers }),
    $fetch<any[]>('/api/metals/holdings', { headers: event.headers }),
    $fetch<any>('/api/settings/company', { headers: event.headers }).catch(() => ({ currency: 'CHF' })),
    $fetch<Record<string, number>>('/api/stocks/fx', { headers: event.headers }).catch(() => ({ USD: 0.9, EUR: 0.95, GBP: 1.12, CHF: 1 })),
  ])

  const companyCurrency: string = companySettings.currency ?? 'CHF'
  const fxRates: Record<string, number> = { CHF: 1, ...fx }
  function convert(amount: number, fromCurrency: string): number {
    const inChf = amount * (fxRates[fromCurrency] ?? 1)
    return inChf / (fxRates[companyCurrency] ?? 1)
  }

  // Fetch historical prices for all symbols in parallel
  const stockSymbols = [...new Set(watchlist.map((s: any) => s.symbol as string))]
  const metalKeys = [...new Set(metalHoldings.map((h: any) => h.metalKey as string))]

  const [stockHistories, metalHistories] = await Promise.all([
    Promise.all(stockSymbols.map(async sym => ({ sym, history: await fetchHistory(sym) }))),
    Promise.all(metalKeys.map(async key => ({ key, history: await fetchHistory(METAL_SYMBOLS[key] ?? '') }))),
  ])

  const stockHistoryMap = new Map(stockHistories.map(({ sym, history }) => [sym, history]))
  const metalHistoryMap = new Map(metalHistories.map(({ key, history }) => [key, history]))

  // Build last 7 trading days (excluding today)
  const tradingDates: string[] = []
  for (let i = 1; i <= 21 && tradingDates.length < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue
    tradingDates.push(d.toISOString().slice(0, 10))
  }

  // Load existing snapshot dates
  const existingRows = await db
    .select({ date: portfolioSnapshot.date })
    .from(portfolioSnapshot)
    .where(eq(portfolioSnapshot.userId, session.user.id))
  const existingDates = new Set(existingRows.map(r => r.date))

  const aktienPortfolios = portfolios.filter((p: any) => p.portfolioType === 'Aktien')
  const metalOrder = ['gold', 'silver', 'platinum', 'palladium']

  const created: string[] = []
  const skipped: string[] = []

  for (const date of tradingDates) {
    if (existingDates.has(date)) {
      skipped.push(date)
      continue
    }

    // ── Aktien ──
    const brokerMap = new Map<string, {
      name: string; value: number; changeWeightedSum: number; changeWeight: number; cashValue: number
      positions: Map<string, { symbol: string; name: string; value: number; changeWeightSum: number; changeWeight: number; changePct: number }>
    }>()
    for (const p of aktienPortfolios) {
      brokerMap.set(p.id, { name: p.name, value: 0, changeWeightedSum: 0, changeWeight: 0, cashValue: 0, positions: new Map() })
    }

    for (const stock of watchlist) {
      const history = stockHistoryMap.get(stock.symbol)
      if (!history) continue
      const price = getPriceOn(history, date)
      if (price == null) continue
      const prevPrice = getPrevPrice(history, date)
      const changePct = prevPrice != null && prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0

      for (const t of stock.tranches ?? []) {
        const entry = brokerMap.get(t.portfolioId)
        if (!entry) continue
        const val = convert(price * (t.shares ?? 0), stock.currency)
        entry.value += val
        entry.changeWeightedSum += changePct * val
        entry.changeWeight += val

        const pos = entry.positions.get(stock.symbol)
        if (pos) {
          pos.value += val
          pos.changeWeightSum += changePct * val
          pos.changeWeight += val
        }
        else {
          entry.positions.set(stock.symbol, {
            symbol: stock.symbol, name: stock.name ?? stock.symbol,
            value: val, changePct, changeWeightSum: changePct * val, changeWeight: val,
          })
        }
      }
    }

    for (const c of cashBalances) {
      const entry = brokerMap.get(c.portfolioId)
      if (!entry) continue
      const val = convert(c.amount, c.currency)
      entry.value += val
      entry.cashValue += val
    }

    const brokerGroups = Array.from(brokerMap.values())
      .filter(e => e.value > 0)
      .sort((a, b) => b.value - a.value)
      .map(e => ({
        type: e.name,
        value: Math.round(e.value),
        changePct: e.changeWeight > 0 ? parseFloat((e.changeWeightedSum / e.changeWeight).toFixed(2)) : 0,
        cashValue: Math.round(e.cashValue),
        positions: Array.from(e.positions.values())
          .sort((a, b) => b.value - a.value)
          .map(p => ({
            symbol: p.symbol, name: p.name,
            value: Math.round(p.value),
            changePct: p.changeWeight > 0 ? parseFloat((p.changeWeightSum / p.changeWeight).toFixed(2)) : 0,
          })),
      }))

    // ── Edelmetalle ──
    const metalMap = new Map<string, { value: number; coinTypes: Map<string, any> }>()

    for (const h of metalHoldings) {
      const key = h.metalKey
      const history = metalHistoryMap.get(key)
      if (!history) continue
      const priceUsd = getPriceOn(history, date)
      if (priceUsd == null) continue
      const oz = toOz(h.quantity ?? 0, h.unit ?? 'oz')
      const val = convert(priceUsd * oz, 'USD')

      if (!metalMap.has(key)) metalMap.set(key, { value: 0, coinTypes: new Map() })
      const entry = metalMap.get(key)!
      entry.value += val

      const coinKey = h.coinType ?? '—'
      const ct = entry.coinTypes.get(coinKey)
      if (ct) {
        ct.quantity += h.quantity ?? 0
        ct.value += val
      }
      else {
        entry.coinTypes.set(coinKey, { name: coinKey, quantity: h.quantity ?? 0, unit: h.unit ?? 'oz', value: val })
      }
    }

    const metalGroupsList = Array.from(metalMap.entries())
      .filter(([, e]) => e.value > 0)
      .sort((a, b) => metalOrder.indexOf(a[0]) - metalOrder.indexOf(b[0]))
      .map(([key, e]) => ({
        type: METAL_NAMES[key] ?? key,
        value: Math.round(e.value),
        positions: Array.from(e.coinTypes.values())
          .sort((a, b) => b.value - a.value)
          .map(ct => ({
            name: ct.name,
            quantity: Math.round(ct.quantity * 10000) / 10000,
            unit: ct.unit,
            value: Math.round(ct.value),
          })),
      }))

    const groups = [...brokerGroups, ...metalGroupsList]
    const totalValue = groups.reduce((s, g) => s + g.value, 0)
    const totalChangePct = totalValue > 0
      ? parseFloat((brokerGroups.reduce((s, g) => s + (g.changePct ?? 0) * g.value, 0) / totalValue).toFixed(2))
      : 0

    const data = { date, currency: companyCurrency, totalValue, totalChangePct, groups }
    await db.insert(portfolioSnapshot).values({
      id: generateId(),
      userId: session.user.id,
      date,
      data,
      createdAt: new Date(),
    })
    created.push(date)
  }

  return { created, skipped }
})
