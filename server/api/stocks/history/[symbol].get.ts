import { auth } from '../../../lib/auth'

const rangeMap: Record<string, { range: string; interval: string }> = {
  '1W': { range: '5d',  interval: '1d'  },
  '1M': { range: '1mo', interval: '1d'  },
  '3M': { range: '3mo', interval: '1d'  },
  '1J': { range: '1y',  interval: '1d'  },
  '5J': { range: '5y',  interval: '1wk' },
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const symbol = getRouterParam(event, 'symbol')!
  const { range: rangeKey = '1M' } = getQuery(event) as { range?: string }

  const { range, interval } = rangeMap[rangeKey] ?? rangeMap['1M']

  const empty = { symbol, name: symbol, currency: '', currentPrice: null as number | null, changePercent: null as number | null, history: [] as { time: string; close: number }[] }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`
    const data = await $fetch<any>(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; watchlist-app/1.0)' },
    })

    const result = data?.chart?.result?.[0]
    if (!result) return empty

    const meta = result.meta
    const timestamps: number[] = result.timestamp ?? []
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? []

    const currentPrice: number | null = meta.regularMarketPrice ?? null
    const prevClose: number | null = meta.chartPreviousClose ?? null
    const changePercent = currentPrice != null && prevClose != null && prevClose !== 0
      ? ((currentPrice - prevClose) / prevClose) * 100
      : null

    const history = timestamps
      .map((ts, i) => {
        const close = closes[i]
        if (close == null) return null
        const d = new Date(ts * 1000)
        const time = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
        return { time, close }
      })
      .filter((p): p is { time: string; close: number } => p !== null)

    return {
      symbol,
      name: meta.longName ?? meta.shortName ?? symbol,
      currency: meta.currency ?? '',
      currentPrice,
      changePercent,
      history,
    }
  } catch {
    return empty
  }
})
