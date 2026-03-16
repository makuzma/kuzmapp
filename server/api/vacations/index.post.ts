import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { vacation } from '../../../drizzle/schema'
import { hasApprovalPermission } from '../../utils/hasApprovalPermission'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { title, startDate, endDate, description, isCompensation, forUserId, halfDay, halfDayPart, halfDayDate } = await readBody(event)

  const canApprove = await hasApprovalPermission(session.user.id, session.user.email)

  if (isCompensation && !canApprove) throw createError({ statusCode: 403, message: 'Keine Berechtigung für Kompensationstage.' })
  if (forUserId && forUserId !== session.user.id && !canApprove) throw createError({ statusCode: 403 })

  if (!startDate || !endDate) throw createError({ statusCode: 400, message: 'Pflichtfelder fehlen' })
  if (startDate > endDate) throw createError({ statusCode: 400, message: 'Startdatum muss vor Enddatum liegen' })

  const targetUserId = (forUserId && canApprove) ? forUserId : session.user.id
  const finalTitle = title?.trim() || (isCompensation ? 'Kompensation' : '')

  const id = crypto.randomUUID()
  await db.insert(vacation).values({
    id,
    userId: targetUserId,
    title: finalTitle,
    startDate,
    endDate,
    description: description?.trim() ?? '',
    isCompensation: !!isCompensation,
    halfDay: !!halfDay,
    halfDayPart: halfDayPart ?? null,
    halfDayDate: halfDayDate ?? null,
    approved: !!isCompensation && canApprove,
    approvedBy: (!!isCompensation && canApprove) ? session.user.id : null,
  })

  return { id }
})
