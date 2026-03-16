import { eq, inArray } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { calendarEvent, userRole, role, user } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  // Alle Rollen mit "kalender" in pages finden
  const allRoles = await db.select({ id: role.id, pages: role.pages }).from(role)
  const kalenderRoleIds = allRoles.filter(r => (r.pages ?? []).includes('kalender')).map(r => r.id)
  if (kalenderRoleIds.length === 0) return []

  // Alle User mit diesen Rollen
  const userRoleRows = await db
    .select({ userId: userRole.userId })
    .from(userRole)
    .where(inArray(userRole.roleId, kalenderRoleIds))
  const kalenderUserIds = [...new Set(userRoleRows.map(r => r.userId))]
  if (kalenderUserIds.length === 0) return []

  // Events dieser User laden
  return db
    .select({
      id: calendarEvent.id,
      title: calendarEvent.title,
      date: calendarEvent.date,
      time: calendarEvent.time,
      color: calendarEvent.color,
      userId: calendarEvent.userId,
      userName: user.name,
    })
    .from(calendarEvent)
    .innerJoin(user, eq(calendarEvent.userId, user.id))
    .where(inArray(calendarEvent.userId, kalenderUserIds))
})
