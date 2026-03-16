import { and, eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { vacation } from '../../../drizzle/schema'
import { hasApprovalPermission } from '../../utils/hasApprovalPermission'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const [existing] = await db.select().from(vacation).where(eq(vacation.id, id))
  if (!existing) throw createError({ statusCode: 404 })

  const canApprove = await hasApprovalPermission(session.user.id, session.user.email)
  const isOwner = existing.userId === session.user.id

  // Only owner or approver can modify
  if (!isOwner && !canApprove) {
    throw createError({ statusCode: 403 })
  }

  // Approve/unapprove: only approvers
  if ('approved' in body && !canApprove) {
    throw createError({ statusCode: 403, message: 'Keine Berechtigung zum Genehmigen.' })
  }

  const update: Record<string, any> = {}

  if ('approved' in body) {
    update.approved = body.approved
    update.approvedBy = body.approved ? session.user.id : null
  } else {
    if (body.title !== undefined) update.title = body.title
    if (body.startDate !== undefined) update.startDate = body.startDate
    if (body.endDate !== undefined) update.endDate = body.endDate
    if (body.description !== undefined) update.description = body.description ?? ''
    if (body.compensationDays !== undefined) update.compensationDays = body.compensationDays
    if (body.halfDay !== undefined) update.halfDay = body.halfDay
    if (body.halfDayPart !== undefined) update.halfDayPart = body.halfDayPart ?? null
    if (body.halfDayDate !== undefined) update.halfDayDate = body.halfDayDate ?? null
    // If a non-approver edits content of an approved vacation, reset approval
    if (existing.approved && !canApprove) {
      update.approved = false
      update.approvedBy = null
    }
  }

  await db.update(vacation).set(update).where(eq(vacation.id, id))

  return { ok: true }
})
