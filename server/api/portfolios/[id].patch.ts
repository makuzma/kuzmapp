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

  const { name, color, portfolioType, groupId } = await readBody(event)
  await db.update(portfolio).set({
    ...(name != null ? { name: name.trim() } : {}),
    ...(color != null ? { color } : {}),
    ...(portfolioType != null ? { portfolioType } : {}),
    ...(groupId !== undefined ? { groupId: groupId || null } : {}),
  }).where(eq(portfolio.id, id))

  return { ok: true }
})
