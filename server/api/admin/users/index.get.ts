import { inArray } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { user, userRole, userGroup } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })
  if (!isSuperAdmin(session.user.email)) throw createError({ statusCode: 403 })

  const users = await db.select({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  }).from(user).orderBy(user.createdAt)

  if (users.length === 0) return []

  const ids = users.map(u => u.id)
  const [roleMappings, groupMappings] = await Promise.all([
    db.select().from(userRole).where(inArray(userRole.userId, ids)),
    db.select().from(userGroup).where(inArray(userGroup.userId, ids)),
  ])

  return users.map(u => ({
    ...u,
    roleIds: roleMappings.filter(r => r.userId === u.id).map(r => r.roleId),
    groupIds: groupMappings.filter(g => g.userId === u.id).map(g => g.groupId),
  }))
})
