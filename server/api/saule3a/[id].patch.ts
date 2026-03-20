import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { saule3a } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const { label, amount } = await readBody(event)

  const [existing] = await db.select().from(saule3a).where(eq(saule3a.id, id))
  if (!existing) throw createError({ statusCode: 404 })
  if (existing.userId !== session.user.id) throw createError({ statusCode: 403 })

  await db.update(saule3a).set({
    ...(label !== undefined ? { label } : {}),
    ...(amount !== undefined ? { amount: Number(amount) } : {}),
    updatedAt: new Date(),
  }).where(eq(saule3a.id, id))

  return { ok: true }
})
