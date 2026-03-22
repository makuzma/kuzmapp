import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { stockWatchlist } from '../../../../drizzle/schema'
import { KNOWN_SECTORS } from '../../../utils/finance/sectorMap'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { symbol, name, exchange, currency, portfolioId } = await readBody(event)
  if (!symbol?.trim()) throw createError({ statusCode: 400, message: 'Symbol fehlt' })

  const trimmed = symbol.trim()
  const id = crypto.randomUUID()
  await db.insert(stockWatchlist).values({
    id,
    userId: session.user.id,
    symbol: trimmed,
    name: name?.trim() ?? trimmed,
    exchange: exchange?.trim() ?? '',
    currency: currency?.trim() ?? '',
    portfolioId: portfolioId ?? null,
    sector: KNOWN_SECTORS[trimmed] ?? null,
  })

  return { id }
})
