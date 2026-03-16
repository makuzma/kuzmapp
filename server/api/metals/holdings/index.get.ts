import { eq, and } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { metalHolding } from '../../../../drizzle/schema'

const METAL_SYMBOLS: Record<string, string> = {
  gold: 'GC=F',
  silver: 'SI=F',
  platinum: 'PL=F',
  palladium: 'PA=F',
}

const G_PER_OZ = 31.1035

function toOz(quantity: number, unit: string): number {
  if (unit === 'g') return quantity / G_PER_OZ
  if (unit === 'kg') return (quantity * 1000) / G_PER_OZ
  return quantity
}

async function fetchSpotUsd(symbol: string): Promise<number | null> {
  try {
    const data = await $fetch<any>(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; watchlist-app/1.0)' },
    })
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null
  } catch { return null }
}

// Normalise strings for fuzzy coin matching
function norm(s: string) {
  return s.toLowerCase()
    .replace(/krügerrand/g, 'krugerrand')
    .replace(/philharmoniker/g, 'philharmoniker')
    .replace(/[^a-z0-9]/g, '')
}

function matchGoldch(coinType: string, metalKey: string, goldchItems: any[]): any | null {
  if (!coinType) return null
  const n = norm(coinType)
  const metalItems = goldchItems.filter(i => i.metal === metalKey)
  return metalItems.find(i => norm(i.label).includes(n) || n.includes(norm(i.label).replace(/^\d+[a-z]*/, '').trim())) ?? null
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { currency: currencyParam, portfolioId } = getQuery(event)
  const currency = (currencyParam as string) || 'CHF'

  const where = portfolioId
    ? and(eq(metalHolding.userId, session.user.id), eq(metalHolding.portfolioId, portfolioId as string))
    : eq(metalHolding.userId, session.user.id)

  const rows = await db
    .select()
    .from(metalHolding)
    .where(where)
    .orderBy(metalHolding.createdAt)

  if (!rows.length) return []

  // Fetch spot prices, FX rate, and gold.ch data in parallel
  const uniqueMetals = [...new Set(rows.map(r => r.metalKey))]
  const [spotPrices, fxRate, goldchData] = await Promise.all([
    Promise.all(uniqueMetals.map(async (key) => ({
      key,
      price: await fetchSpotUsd(METAL_SYMBOLS[key] ?? ''),
    }))),
    currency !== 'USD'
      ? $fetch<any>(`https://query1.finance.yahoo.com/v8/finance/chart/USD${currency}=X?interval=1d&range=1d`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; watchlist-app/1.0)' },
        }).then(d => d?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 1).catch(() => 1)
      : Promise.resolve(1),
    // Reuse goldch cache via internal fetch — only available for gold/silver
    $fetch('/api/metals/goldch', {
      headers: event.headers,
    }).catch(() => [] as any[]),
  ])

  const spotMap: Record<string, number | null> = {}
  for (const s of spotPrices) spotMap[s.key] = s.price

  return rows.map((row) => {
    const oz = toOz(row.quantity, row.unit)

    // Try to find gold.ch dealer price for this coin
    const goldchMatch = matchGoldch(row.coinType, row.metalKey, goldchData as any[])
    // gold.ch "expensive" = Ankaufspreis (what dealer pays you) — best valuation reference
    const goldchAnkaufPerItem = goldchMatch?.expensive ?? null
    // gold.ch "cheapest" = Kaufpreis (what you pay dealer)
    const goldchKaufPerItem = goldchMatch?.cheapest ?? null

    // Spot price in target currency
    const spotUsd = spotMap[row.metalKey]
    const spotPerOz = spotUsd != null ? spotUsd * (fxRate as number) : null

    // Prefer gold.ch Ankauf for valuation (only for 1oz items — convert if needed)
    // For simplicity: goldch prices are per listed unit (mostly 1oz or per gram/bar)
    // We use spot price as the base, goldch as reference display
    const currentTotal = spotPerOz != null ? spotPerOz * oz : null

    const canCalcPnl = row.purchasePricePerOz != null && spotPerOz != null && row.purchaseCurrency === currency
    const pnl = canCalcPnl ? (spotPerOz! - row.purchasePricePerOz!) * oz : null
    const pnlPct = canCalcPnl && row.purchasePricePerOz !== 0
      ? ((spotPerOz! - row.purchasePricePerOz!) / row.purchasePricePerOz!) * 100
      : null

    return {
      id: row.id,
      metalKey: row.metalKey,
      coinType: row.coinType,
      quantity: row.quantity,
      unit: row.unit,
      purchaseDate: row.purchaseDate,
      purchasePricePerOz: row.purchasePricePerOz,
      purchaseCurrency: row.purchaseCurrency,
      spotPerOz,
      currentTotal,
      pnl,
      pnlPct,
      currency,
      portfolioId: row.portfolioId,
      // Gold.ch dealer prices for this specific coin/bar
      goldch: goldchMatch ? {
        label: goldchMatch.label,
        kaufpreis: goldchKaufPerItem,   // was du kaufen müsstest
        ankauf: goldchAnkaufPerItem,    // was Händler zahlen würden
        kaufChange: goldchMatch.cheapestChange,
        ankaufChange: goldchMatch.expensiveChange,
      } : null,
    }
  })
})
