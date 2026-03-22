import { eq } from 'drizzle-orm'
import { db } from '../../lib/db'
import {
  portfolio, stockWatchlist, metalHolding, cashBalance, companyInfo,
} from '../../../drizzle/schema'

const METAL_SYMBOLS: Record<string, string> = {
  gold: 'GC=F', silver: 'SI=F', platinum: 'PL=F', palladium: 'PA=F',
}
const G_PER_OZ = 31.1035

function toOz(quantity: number, unit: string) {
  if (unit === 'g') return quantity / G_PER_OZ
  if (unit === 'kg') return (quantity * 1000) / G_PER_OZ
  return quantity
}

async function fetchYahoo(symbol: string): Promise<number | null> {
  try {
    const data = await $fetch<any>(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    )
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null
  } catch { return null }
}

async function fetchFx(): Promise<Record<string, number>> {
  const [usd, eur, gbp] = await Promise.all([
    fetchYahoo('USDCHF=X'),
    fetchYahoo('EURCHF=X'),
    fetchYahoo('GBPCHF=X'),
  ])
  return { USD: usd ?? 0.9, EUR: eur ?? 0.95, GBP: gbp ?? 1.12, CHF: 1 }
}


export interface SnapshotGroup {
  type: string
  value: number
  changePct?: number
}

export interface SnapshotData {
  date: string
  currency: string
  totalValue: number
  totalChangePct: number
  groups: SnapshotGroup[]
}

export async function computePortfolioSnapshot(userId: string): Promise<SnapshotData> {
  const [portfolios, stocks, metalRows, cashRows, companyRow, fx] = await Promise.all([
    db.select().from(portfolio).where(eq(portfolio.userId, userId)),
    db.select().from(stockWatchlist).where(eq(stockWatchlist.userId, userId)),
    db.select().from(metalHolding).where(eq(metalHolding.userId, userId)),
    db.select().from(cashBalance).where(eq(cashBalance.userId, userId)),
    db.select().from(companyInfo).limit(1),
    fetchFx(),
  ])

  const companyCurrency = companyRow[0]?.currency ?? 'CHF'
  const fxRates: Record<string, number> = { CHF: 1, ...fx }

  function convertTo(amount: number, fromCurrency: string): number {
    const inChf = amount * (fxRates[fromCurrency] ?? 1)
    return inChf / (fxRates[companyCurrency] ?? 1)
  }

  // Fetch stock prices from Yahoo
  const uniqueSymbols = [...new Set(stocks.map(s => s.symbol))]
  const stockPrices: Record<string, { price: number | null; changePct: number | null; currency: string }> = {}
  await Promise.all(uniqueSymbols.map(async (symbol) => {
    const row = stocks.find(s => s.symbol === symbol)
    try {
      const data = await $fetch<any>(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      )
      const meta = data?.chart?.result?.[0]?.meta
      stockPrices[symbol] = {
        price: meta?.regularMarketPrice ?? null,
        changePct: meta?.regularMarketChangePercent ?? null,
        currency: row?.currency ?? 'CHF',
      }
    } catch {
      stockPrices[symbol] = { price: null, changePct: null, currency: row?.currency ?? 'CHF' }
    }
  }))

  // Fetch metal spot prices
  const uniqueMetalKeys = [...new Set(metalRows.map(r => r.metalKey))]
  const spotMap: Record<string, number | null> = {}
  await Promise.all(uniqueMetalKeys.map(async key => {
    spotMap[key] = await fetchYahoo(METAL_SYMBOLS[key] ?? '')
  }))

  // Accumulate value + weighted change per portfolioId
  const byPortfolio: Record<string, { value: number; changeWeightedSum: number; changeWeight: number }> = {}
  const ensure = (id: string) => {
    if (!byPortfolio[id]) byPortfolio[id] = { value: 0, changeWeightedSum: 0, changeWeight: 0 }
  }

  // Stocks
  for (const stock of stocks) {
    if (!stock.portfolioId || !stock.shares) continue
    const sp = stockPrices[stock.symbol]
    if (!sp?.price) continue
    const val = convertTo(sp.price * stock.shares, sp.currency)
    const changePct = sp.changePct ?? 0
    ensure(stock.portfolioId)
    byPortfolio[stock.portfolioId].value += val
    byPortfolio[stock.portfolioId].changeWeightedSum += changePct * val
    byPortfolio[stock.portfolioId].changeWeight += val
  }

  const METAL_NAMES: Record<string, string> = {
    gold: 'Gold', silver: 'Silber', platinum: 'Platin', palladium: 'Palladium',
  }

  // Metals — Spot-Preis × Unzen (identisch zur Finance-Seite, gold.ch nur Referenz)
  const byMetal: Record<string, number> = {}
  for (const m of metalRows) {
    const spotUsd = spotMap[m.metalKey]
    if (spotUsd == null) continue
    const val = convertTo(spotUsd * toOz(m.quantity, m.unit), 'USD')
    byMetal[m.metalKey] = (byMetal[m.metalKey] ?? 0) + val
  }

  // Nur 'Aktien'-Portfolios, Cash pro Portfolio dazuaddieren (identisch zu aktienPortfolioStacks)
  const aktienPortfolios = portfolios.filter(p => p.portfolioType === 'Aktien')

  const result: SnapshotGroup[] = []

  for (const p of aktienPortfolios) {
    const pv = byPortfolio[p.id]
    let value = pv?.value ?? 0
    // Cash dieses Portfolios dazurechnen
    for (const c of cashRows) {
      if (c.portfolioId === p.id) value += convertTo(c.amount, c.currency)
    }
    if (value === 0) continue
    result.push({
      type: p.name,
      value: Math.round(value),
      changePct: pv && pv.changeWeight > 0 ? parseFloat((pv.changeWeightedSum / pv.changeWeight).toFixed(2)) : 0,
    })
  }

  result.sort((a, b) => b.value - a.value)

  // Metalle einzeln hinzufügen (nur vorhandene, nach Wert sortiert)
  for (const [key, val] of Object.entries(byMetal).sort((a, b) => b[1] - a[1])) {
    if (val > 0) result.push({ type: METAL_NAMES[key] ?? key, value: Math.round(val) })
  }

  const totalValue = result.reduce((s, g) => s + g.value, 0)
  const stockMetalGroups = result.filter(g => g.changePct !== undefined)
  const totalChangePct = totalValue > 0
    ? parseFloat((stockMetalGroups.reduce((s, g) => s + (g.changePct ?? 0) * g.value, 0) / totalValue).toFixed(2))
    : 0

  const date = new Date().toISOString().slice(0, 10)

  return { date, currency: companyCurrency, totalValue, totalChangePct, groups: result }
}
