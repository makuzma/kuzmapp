import { eq, inArray } from 'drizzle-orm'
import { auth } from '../lib/auth'
import { db } from '../lib/db'
import { userRole, role } from '../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  if (!url.pathname.startsWith('/api/settings/')) return

  // GET requests are allowed for all authenticated users (needed to display data in projects)
  if (event.method === 'GET') return

  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  if (isSuperAdmin(session.user.email)) return

  const roleMappings = await db.select({ roleId: userRole.roleId })
    .from(userRole).where(eq(userRole.userId, session.user.id))
  const roleIds = roleMappings.map(r => r.roleId)

  if (roleIds.length > 0) {
    const roles = await db.select({ pages: role.pages }).from(role).where(inArray(role.id, roleIds))
    if (roles.some(r => (r.pages ?? []).includes('settings'))) return
  }

  throw createError({ statusCode: 403, message: 'Kein Zugriff auf Einstellungen' })
})
