import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { calendarFerien, user } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { startDate, endDate, halfDay, halfDayPart } = await readBody(event)
  if (!startDate || !endDate) throw createError({ statusCode: 400, message: 'Start- und Enddatum sind erforderlich' })

  const [me] = await db.select({ calendarColor: user.calendarColor }).from(user).where(eq(user.id, session.user.id))
  const isSingleDay = startDate === endDate
  const isHalf = isSingleDay && !!halfDay

  const [created] = await db.insert(calendarFerien).values({
    id: randomUUID(),
    userId: session.user.id,
    startDate,
    endDate,
    halfDay: isHalf,
    halfDayPart: isHalf ? (halfDayPart ?? 'morning') : null,
    color: me?.calendarColor ?? '#3b82f6',
  }).returning()

  return created
})
