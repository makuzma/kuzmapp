import { and, eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { portfolioSnapshot } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  await db.delete(portfolioSnapshot).where(
    and(eq(portfolioSnapshot.id, id), eq(portfolioSnapshot.userId, session.user.id)),
  )
  return { ok: true }
})
