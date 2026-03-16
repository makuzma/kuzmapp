import { eq, inArray } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { user, userRole, userGroup, role } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const [me] = await db.select({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name,
    email: user.email,
    image: user.image,
    calendarColor: user.calendarColor,
    notificationPages: user.notificationPages,
  }).from(user).where(eq(user.id, session.user.id))

  const [roleMappings, groupMappings] = await Promise.all([
    db.select().from(userRole).where(eq(userRole.userId, session.user.id)),
    db.select().from(userGroup).where(eq(userGroup.userId, session.user.id)),
  ])

  const roleIds = roleMappings.map(r => r.roleId)

  let allowedPages: string[] = []
  if (roleIds.length > 0) {
    const roles = await db.select({ pages: role.pages }).from(role).where(inArray(role.id, roleIds))
    allowedPages = [...new Set(roles.flatMap(r => r.pages ?? []))]
  }

  return {
    ...me,
    roleIds,
    groupIds: groupMappings.map(g => g.groupId),
    allowedPages,
  }
})
