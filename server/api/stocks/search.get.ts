import { auth } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const q = getQuery(event).q as string
  if (!q?.trim()) return []

  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&lang=en-US&region=CH&quotesCount=15`
  const data = await $fetch<any>(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; watchlist-app/1.0)' },
  })

  const quotes = (data?.quotes ?? []) as any[]
  const exchangeNames: Record<string, string> = {
    EBS: 'SIX Swiss Exchange',
    NMS: 'NASDAQ',
    NYQ: 'NYSE',
    MEX: 'BMV Mexico',
    CXE: 'CBOE Europe',
    FRA: 'Frankfurt',
    LSE: 'London',
    PAR: 'Paris',
    AMS: 'Amsterdam',
    MIL: 'Milano',
  }

  return quotes
    .filter((q: any) => ['equity', 'etf'].includes(q.typeDisp?.toLowerCase()))
    .map((q: any) => ({
      symbol: q.symbol as string,
      name: (q.longname ?? q.shortname ?? q.symbol) as string,
      exchange: exchangeNames[q.exchange] ?? (q.exchDisp ?? q.exchange ?? '') as string,
      type: q.typeDisp?.toLowerCase() === 'etf' ? 'ETF' : 'Aktie',
    }))
})
