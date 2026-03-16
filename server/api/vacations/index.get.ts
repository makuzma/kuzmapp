import { eq, inArray } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { vacation, user, userRole, role } from '../../../drizzle/schema'
import { hasApprovalPermission } from '../../utils/hasApprovalPermission'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const canApprove = await hasApprovalPermission(session.user.id, session.user.email)

  const approverUser = alias(user, 'approver_user')

  const rows = await db
    .select({
      id: vacation.id,
      userId: vacation.userId,
      userName: user.name,
      title: vacation.title,
      startDate: vacation.startDate,
      endDate: vacation.endDate,
      description: vacation.description,
      approved: vacation.approved,
      approvedBy: vacation.approvedBy,
      approvedByName: approverUser.name,
      isCompensation: vacation.isCompensation,
      compensationDays: vacation.compensationDays,
      halfDay: vacation.halfDay,
      halfDayPart: vacation.halfDayPart,
      halfDayDate: vacation.halfDayDate,
      createdAt: vacation.createdAt,
    })
    .from(vacation)
    .innerJoin(user, eq(vacation.userId, user.id))
    .leftJoin(approverUser, eq(vacation.approvedBy, approverUser.id))
    .orderBy(vacation.startDate)

  // Build a map of userId -> max vacationDays across all their roles
  const allUserRoles = await db.select({ userId: userRole.userId, roleId: userRole.roleId }).from(userRole)
  const allRoleIds = [...new Set(allUserRoles.map(r => r.roleId))]
  const roleVacDays: Record<string, number> = {}
  if (allRoleIds.length > 0) {
    const allRoles = await db.select({ id: role.id, vacationDays: role.vacationDays }).from(role).where(inArray(role.id, allRoleIds))
    for (const r of allRoles) roleVacDays[r.id] = r.vacationDays
  }
  const userVacationDays: Record<string, number> = {}
  for (const ur of allUserRoles) {
    const days = roleVacDays[ur.roleId] ?? 0
    userVacationDays[ur.userId] = Math.max(userVacationDays[ur.userId] ?? 0, days)
  }

  // Return users list for approvers (for compensation day assignment)
  let users: { id: string; name: string }[] = []
  if (canApprove) {
    users = await db.select({ id: user.id, name: user.name }).from(user).orderBy(user.name)
  }

  return { vacations: rows, canApprove, userVacationDays, users }
})
