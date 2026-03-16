import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { stockWatchlist } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!

  const [existing] = await db.select().from(stockWatchlist).where(eq(stockWatchlist.id, id))
  if (!existing) throw createError({ statusCode: 404 })
  if (existing.userId !== session.user.id) throw createError({ statusCode: 403 })

  await db.delete(stockWatchlist).where(eq(stockWatchlist.id, id))

  return { ok: true }
})
