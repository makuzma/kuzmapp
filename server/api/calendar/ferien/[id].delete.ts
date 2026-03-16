import { and, eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { calendarFerien } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!

  const deleted = await db
    .delete(calendarFerien)
    .where(and(eq(calendarFerien.id, id), eq(calendarFerien.userId, session.user.id)))
    .returning()

  if (deleted.length === 0) throw createError({ statusCode: 404 })
  return { success: true }
})
