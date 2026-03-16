import { auth } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { symbol, date } = getQuery(event) as { symbol: string; date: string }
  if (!symbol || !date) throw createError({ statusCode: 400, message: 'symbol und date erforderlich' })

  // Convert date string (YYYY-MM-DD) to unix timestamps
  const start = Math.floor(new Date(date).getTime() / 1000)
  const end = start + 86400 * 5 // +5 days buffer for weekends/holidays

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${start}&period2=${end}&interval=1d`

  try {
    const data = await $fetch<any>(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; watchlist-app/1.0)' },
    })

    const closes: number[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
    const price = closes.find((c: number | null) => c != null) ?? null

    return { price }
  } catch {
    return { price: null }
  }
})
