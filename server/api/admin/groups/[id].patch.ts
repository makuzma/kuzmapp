import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { group } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })
  if (!isSuperAdmin(session.user.email)) throw createError({ statusCode: 403 })

  const id = getRouterParam(event, 'id')!
  const { name, color } = await readBody(event)

  const [updated] = await db.update(group).set({
    ...(name?.trim() ? { name: name.trim() } : {}),
    ...(color ? { color } : {}),
  }).where(eq(group.id, id)).returning()

  await logActivity(session.user.id, 'group.update', { target: id })
  return updated
})
