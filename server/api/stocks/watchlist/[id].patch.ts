import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { stockWatchlist } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const { shares, purchasePrice, purchaseDate, portfolioId, sector } = await readBody(event)

  const [existing] = await db.select().from(stockWatchlist).where(eq(stockWatchlist.id, id))
  if (!existing) throw createError({ statusCode: 404 })
  if (existing.userId !== session.user.id) throw createError({ statusCode: 403 })

  await db.update(stockWatchlist)
    .set({
      ...(shares !== undefined ? { shares: shares ?? null } : {}),
      ...(purchasePrice !== undefined ? { purchasePrice: purchasePrice ?? null } : {}),
      ...(purchaseDate !== undefined ? { purchaseDate: purchaseDate ?? null } : {}),
      ...(portfolioId !== undefined ? { portfolioId: portfolioId ?? null } : {}),
      ...(sector !== undefined ? { sector: sector || null } : {}),
    })
    .where(eq(stockWatchlist.id, id))

  return { ok: true }
})
