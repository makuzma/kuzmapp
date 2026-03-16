import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { metalHolding } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const [existing] = await db.select().from(metalHolding).where(eq(metalHolding.id, id))
  if (!existing) throw createError({ statusCode: 404 })
  if (existing.userId !== session.user.id) throw createError({ statusCode: 403 })

  await db.delete(metalHolding).where(eq(metalHolding.id, id))
  return { ok: true }
})
