import { auth } from '../../lib/auth'

const METAL_SYMBOLS: Record<string, string> = {
  gold: 'GC=F',
  silver: 'SI=F',
  platinum: 'PL=F',
  palladium: 'PA=F',
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { metalKey, date, currency } = getQuery(event) as { metalKey: string; date: string; currency: string }
  if (!metalKey || !date) throw createError({ statusCode: 400 })

  const symbol = METAL_SYMBOLS[metalKey]
  if (!symbol) throw createError({ statusCode: 400, message: 'Unbekanntes Metall' })

  const start = Math.floor(new Date(date).getTime() / 1000)
  const end = start + 86400 * 7 // +7 days buffer for weekends/holidays

  try {
    const [priceData, fxData] = await Promise.all([
      $fetch<any>(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${start}&period2=${end}&interval=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; watchlist-app/1.0)' },
      }),
      currency && currency !== 'USD'
        ? $fetch<any>(`https://query1.finance.yahoo.com/v8/finance/chart/USD${currency}=X?interval=1d&range=1d`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; watchlist-app/1.0)' },
          })
        : Promise.resolve(null),
    ])

    const closes: number[] = priceData?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
    const priceUsd = closes.find((c) => c != null) ?? null

    const fxRate = fxData?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 1
    const price = priceUsd != null ? priceUsd * fxRate : null

    return { price, currency: currency || 'USD' }
  } catch {
    return { price: null }
  }
})
