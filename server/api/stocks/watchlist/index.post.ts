import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { stockWatchlist } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { symbol, name, exchange, currency, portfolioId } = await readBody(event)
  if (!symbol?.trim()) throw createError({ statusCode: 400, message: 'Symbol fehlt' })

  const id = crypto.randomUUID()
  try {
    await db.insert(stockWatchlist).values({
      id,
      userId: session.user.id,
      symbol: symbol.trim(),
      name: name?.trim() ?? symbol.trim(),
      exchange: exchange?.trim() ?? '',
      currency: currency?.trim() ?? '',
      portfolioId: portfolioId ?? null,
    })
  } catch (err: any) {
    if (err?.message?.includes('unique')) {
      throw createError({ statusCode: 400, message: 'Bereits in der Watchlist' })
    }
    throw err
  }

  return { id }
})
