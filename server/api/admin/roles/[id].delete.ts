import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { role } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })
  if (!isSuperAdmin(session.user.email)) throw createError({ statusCode: 403 })

  const id = getRouterParam(event, 'id')!
  await db.delete(role).where(eq(role.id, id))
  await logActivity(session.user.id, 'role.delete', { target: id })
  return { success: true }
})
