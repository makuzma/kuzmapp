import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { role } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })
  if (!isSuperAdmin(session.user.email)) throw createError({ statusCode: 403 })

  const id = getRouterParam(event, 'id')!
  const { name, color, pages, vacationDays } = await readBody(event)

  const [updated] = await db.update(role).set({
    ...(name?.trim() ? { name: name.trim() } : {}),
    ...(color ? { color } : {}),
    ...(Array.isArray(pages) ? { pages } : {}),
    ...(typeof vacationDays === 'number' ? { vacationDays } : {}),
  }).where(eq(role.id, id)).returning()

  await logActivity(session.user.id, 'role.update', { target: id })
  return updated
})
