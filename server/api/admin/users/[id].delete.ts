import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { user } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })
  if (!isSuperAdmin(session.user.email)) throw createError({ statusCode: 403 })

  const id = getRouterParam(event, 'id')!

  if (id === session.user.id) throw createError({ statusCode: 400, message: 'Du kannst dich nicht selbst löschen.' })

  await db.delete(user).where(eq(user.id, id))
  await logActivity(session.user.id, 'user.delete', { target: id })
  return { success: true }
})
