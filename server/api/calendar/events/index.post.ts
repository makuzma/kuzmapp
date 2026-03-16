import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { calendarEvent, user } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { title, date, time } = await readBody(event)
  if (!title?.trim() || !date) throw createError({ statusCode: 400, message: 'Titel und Datum sind erforderlich' })

  const [me] = await db.select({ calendarColor: user.calendarColor }).from(user).where(eq(user.id, session.user.id))

  const [created] = await db.insert(calendarEvent).values({
    id: randomUUID(),
    userId: session.user.id,
    title: title.trim(),
    date,
    time: time ?? '',
    color: me?.calendarColor ?? '#3b82f6',
  }).returning()

  return created
})
