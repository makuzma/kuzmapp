import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { portfolio } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const [existing] = await db.select().from(portfolio).where(eq(portfolio.id, id))
  if (!existing) throw createError({ statusCode: 404 })
  if (existing.userId !== session.user.id) throw createError({ statusCode: 403 })

  await db.delete(portfolio).where(eq(portfolio.id, id))
  return { ok: true }
})
