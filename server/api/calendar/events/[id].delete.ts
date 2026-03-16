import { and, eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { calendarEvent } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!

  const deleted = await db
    .delete(calendarEvent)
    .where(and(eq(calendarEvent.id, id), eq(calendarEvent.userId, session.user.id)))
    .returning()

  if (deleted.length === 0) throw createError({ statusCode: 404 })
  return { success: true }
})
