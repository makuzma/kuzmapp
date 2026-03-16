import { auth } from '../../lib/auth'

const METALS = [
  { key: 'gold',      symbol: 'GC=F',  name: 'Gold',      unit: 'oz' },
  { key: 'silver',    symbol: 'SI=F',  name: 'Silber',    unit: 'oz' },
  { key: 'platinum',  symbol: 'PL=F',  name: 'Platin',    unit: 'oz' },
  { key: 'palladium', symbol: 'PA=F',  name: 'Palladium', unit: 'oz' },
]

const TROY_OZ_TO_GRAM = 1 / 31.1035

async function fetchMeta(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
  const data = await $fetch<any>(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; watchlist-app/1.0)' },
  })
  return data?.chart?.result?.[0]?.meta ?? null
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const currency = (getQuery(event).currency as string) || 'USD'

  // Fetch FX rate USD → target currency
  let fxRate = 1
  if (currency !== 'USD') {
    try {
      const fxMeta = await fetchMeta(`USD${currency}=X`)
      fxRate = fxMeta?.regularMarketPrice ?? 1
    } catch { /* fallback to 1 */ }
  }

  // Fetch all metals in parallel
  const results = await Promise.all(
    METALS.map(async (metal) => {
      try {
        const meta = await fetchMeta(metal.symbol)
        if (!meta) return null
        const priceUsd: number = meta.regularMarketPrice
        const prevUsd: number = meta.chartPreviousClose ?? priceUsd
        const price = priceUsd * fxRate
        const prev = prevUsd * fxRate
        const changePercent = prevUsd !== 0 ? ((priceUsd - prevUsd) / prevUsd) * 100 : 0
        return {
          key: metal.key,
          name: metal.name,
          pricePerOz: price,
          pricePerGram: price * TROY_OZ_TO_GRAM,
          changePercent,
          currency,
        }
      } catch {
        return null
      }
    })
  )

  return results.filter(Boolean)
})
