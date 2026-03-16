import { auth } from '../../lib/auth'

async function fetchRate(pair: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(pair)}?interval=1d&range=1d`
    const data = await $fetch<any>(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; watchlist-app/1.0)' },
    })
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const [usd, eur, gbp] = await Promise.all([
    fetchRate('USDCHF=X'),
    fetchRate('EURCHF=X'),
    fetchRate('GBPCHF=X'),
  ])

  return {
    USD: usd ?? 0.9,
    EUR: eur ?? 0.95,
    GBP: gbp ?? 1.12,
    CHF: 1,
  }
})
