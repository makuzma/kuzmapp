import { and, eq } from 'drizzle-orm'
import { generateId } from 'better-auth'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { portfolioSnapshot, saule3a } from '../../../../drizzle/schema'

const METAL_NAMES: Record<string, string> = {
  gold: 'Gold', silver: 'Silber', platinum: 'Platin', palladium: 'Palladium',
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const [portfolios, watchlist, cashBalances, metalHoldings, companySettings, fx, saule3aRows] = await Promise.all([
    $fetch<any[]>('/api/portfolios', { headers: event.headers }),
    $fetch<any[]>('/api/stocks/watchlist', { headers: event.headers }),
    $fetch<any[]>('/api/finance/cash', { headers: event.headers }),
    $fetch<any[]>('/api/metals/holdings', { headers: event.headers }),
    $fetch<any>('/api/settings/company', { headers: event.headers }).catch(() => ({ currency: 'CHF' })),
    $fetch<Record<string, number>>('/api/stocks/fx', { headers: event.headers }).catch(() => ({ USD: 0.9, EUR: 0.95, GBP: 1.12, CHF: 1 })),
    db.select().from(saule3a).where(eq(saule3a.userId, session.user.id)),
  ])

  const companyCurrency: string = companySettings.currency ?? 'CHF'
  const fxRates: Record<string, number> = { CHF: 1, ...fx }

  function convert(amount: number, fromCurrency: string): number {
    const inChf = amount * (fxRates[fromCurrency] ?? 1)
    return inChf / (fxRates[companyCurrency] ?? 1)
  }

  // ── Aktien — gruppiert nach Portfolio, mit einzelnen Positionen ──
  const aktienPortfolios = portfolios.filter((p: any) => p.portfolioType === 'Aktien')

  const brokerMap = new Map<string, {
    name: string
    value: number
    changeWeightedSum: number
    changeWeight: number
    cashValue: number
    positions: Map<string, { symbol: string; name: string; value: number; changePct: number; changeWeightSum: number; changeWeight: number }>
  }>()

  for (const p of aktienPortfolios) {
    brokerMap.set(p.id, {
      name: p.name, value: 0, changeWeightedSum: 0, changeWeight: 0, cashValue: 0,
      positions: new Map(),
    })
  }

  for (const stock of watchlist) {
    const price = stock.price ?? 0
    const changePct = stock.changePercent ?? 0
    for (const t of stock.tranches ?? []) {
      const entry = brokerMap.get(t.portfolioId)
      if (!entry) continue
      const val = convert(price * (t.shares ?? 0), stock.currency)
      entry.value += val
      entry.changeWeightedSum += changePct * val
      entry.changeWeight += val

      const existing = entry.positions.get(stock.symbol)
      if (existing) {
        existing.value += val
        existing.changeWeightSum += changePct * val
        existing.changeWeight += val
      }
      else {
        entry.positions.set(stock.symbol, {
          symbol: stock.symbol,
          name: stock.name ?? stock.symbol,
          value: val,
          changePct,
          changeWeightSum: changePct * val,
          changeWeight: val,
        })
      }
    }
  }

  for (const c of cashBalances) {
    const entry = brokerMap.get(c.portfolioId)
    if (!entry) continue
    const val = convert(c.amount, c.currency)
    // cashValue nur zur Info; Wert geht in Bargeld-Gruppe (nicht doppelt zählen)
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
          symbol: p.symbol,
          name: p.name,
          value: Math.round(p.value),
          changePct: p.changeWeight > 0 ? parseFloat((p.changeWeightSum / p.changeWeight).toFixed(2)) : 0,
        })),
    }))

  // ── Edelmetalle — gruppiert nach Metall, mit Münzentypen ──
  const metalMap = new Map<string, {
    value: number
    coinTypes: Map<string, { name: string; quantity: number; unit: string; value: number }>
  }>()

  for (const h of metalHoldings) {
    const key = h.metalKey
    // currentTotal kommt in CHF (API ohne currency-Param) → in Firmenwährung umrechnen
    const val = convert(h.currentTotal ?? 0, 'CHF')
    if (!metalMap.has(key)) metalMap.set(key, { value: 0, coinTypes: new Map() })
    const entry = metalMap.get(key)!
    entry.value += val

    const coinKey = h.coinType ?? '—'
    if (entry.coinTypes.has(coinKey)) {
      const ct = entry.coinTypes.get(coinKey)!
      ct.quantity += h.quantity ?? 0
      ct.value += val
    }
    else {
      entry.coinTypes.set(coinKey, {
        name: coinKey,
        quantity: h.quantity ?? 0,
        unit: h.unit ?? 'oz',
        value: val,
      })
    }
  }

  const metalOrder = ['gold', 'silver', 'platinum', 'palladium']
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

  // ── Bargeld / Schulden / Vorsorge / Lending — Fix-Rate aus cashBalance + saule3a ──
  const TYPE_MAP: Record<string, string> = { 'Säule 3A': 'Vorsorge', 'Bankkonto': 'Bargeld', 'Cash': 'Bargeld', 'Aktien': 'Bargeld' }
  const DEBT_TYPES = new Set(['Schulden'])
  const CURRENT_YEAR = new Date().getFullYear()
  const fixGroups: Record<string, { value: number; positions: { name: string; value: number }[] }> = {
    Bargeld:  { value: 0, positions: [] },
    Schulden: { value: 0, positions: [] },
    Vorsorge: { value: 0, positions: [] },
    Lending:  { value: 0, positions: [] },
  }

  // saule3a → Vorsorge: nur neusten Eintrag pro Label, Labels vormerken
  const latestSaule3a = Object.values(
    saule3aRows.reduce((acc: Record<string, any>, row) => {
      if (!acc[row.label] || new Date(row.updatedAt) > new Date(acc[row.label].updatedAt))
        acc[row.label] = row
      return acc
    }, {}),
  )
  const saule3aLabels = new Set(latestSaule3a.map((s: any) => s.label))
  for (const s of latestSaule3a) {
    const val = Math.round(convert(s.amount, 'CHF'))
    fixGroups.Vorsorge.value += val
    fixGroups.Vorsorge.positions.push({ name: s.label || 'Säule 3A', value: val })
  }

  for (const c of cashBalances) {
    const portfolio = portfolios.find((p: any) => p.id === c.portfolioId)
    if (!portfolio) continue // standalone Einträge ohne Portfolio überspringen
    const rawType = portfolio.portfolioType?.trim()
    const mapped = TYPE_MAP[rawType] ?? rawType
    if (mapped === 'Bargeld') {
      const val = Math.round(convert(c.amount, c.currency))
      fixGroups.Bargeld.value += val
      fixGroups.Bargeld.positions.push({ name: c.label || portfolio.name, value: val })
    }
    else if (DEBT_TYPES.has(rawType)) {
      const val = Math.round(convert(c.amount, c.currency))
      fixGroups.Schulden.value += val
      fixGroups.Schulden.positions.push({ name: c.label || portfolio.name, value: -val })
    }
    else if (mapped === 'Vorsorge' && !saule3aLabels.has(c.label)) {
      // Nur aufnehmen wenn nicht bereits via saule3a erfasst
      const val = Math.round(convert(c.amount, c.currency))
      fixGroups.Vorsorge.value += val
      fixGroups.Vorsorge.positions.push({ name: c.label || portfolio.name, value: val })
    }
    else if (rawType === 'Lending' && c.lendingJahr === CURRENT_YEAR) {
      const val = Math.round(convert(c.lendingKapitalTotal ?? c.lendingKapital ?? c.amount, c.currency))
      fixGroups.Lending.value += val
      fixGroups.Lending.positions.push({ name: c.label || portfolio.name, value: val })
    }
  }

  const fixGroupsList = Object.entries(fixGroups)
    .filter(([, g]) => g.value !== 0 || g.positions.length > 0)
    .map(([type, g]) => ({
      type,
      value: type === 'Schulden' ? -Math.abs(g.value) : g.value,
      positions: g.positions,
    }))

  const groups = [...brokerGroups, ...metalGroupsList, ...fixGroupsList]
  const totalValue = groups.reduce((s, g) => s + g.value, 0)
  const totalChangePct = totalValue > 0
    ? parseFloat((brokerGroups.reduce((s, g) => s + (g.changePct ?? 0) * g.value, 0) / totalValue).toFixed(2))
    : 0

  const date = new Date().toISOString().slice(0, 10)
  const data = { date, currency: companyCurrency, totalValue, totalChangePct, groups }

  const existing = await db
    .select({ id: portfolioSnapshot.id })
    .from(portfolioSnapshot)
    .where(and(eq(portfolioSnapshot.userId, session.user.id), eq(portfolioSnapshot.date, date)))
    .limit(1)

  if (existing[0]) {
    await db.update(portfolioSnapshot)
      .set({ data, createdAt: new Date() })
      .where(eq(portfolioSnapshot.id, existing[0].id))
    return { id: existing[0].id, date, data }
  }

  const id = generateId()
  await db.insert(portfolioSnapshot).values({ id, userId: session.user.id, date, data, createdAt: new Date() })
  return { id, date, data }
})
