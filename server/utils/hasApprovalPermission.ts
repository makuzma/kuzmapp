import { eq, inArray } from 'drizzle-orm'
import { db } from '../lib/db'
import { userRole, role } from '../../drizzle/schema'
import { isSuperAdmin } from './superadmin'

export async function hasApprovalPermission(userId: string, email: string): Promise<boolean> {
  if (isSuperAdmin(email)) return true

  const roleMappings = await db.select({ roleId: userRole.roleId })
    .from(userRole).where(eq(userRole.userId, userId))
  const roleIds = roleMappings.map(r => r.roleId)

  if (roleIds.length === 0) return false

  const roles = await db.select({ pages: role.pages }).from(role).where(inArray(role.id, roleIds))
  return roles.some(r => (r.pages ?? []).includes('ferien.approval'))
}
