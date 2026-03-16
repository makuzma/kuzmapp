import { eq, max } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { timeEntry, user } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const rows = await db.select({
    projectId: timeEntry.projectId,
    userId: timeEntry.userId,
    userName: user.name,
    lastActivity: max(timeEntry.createdAt),
  })
    .from(timeEntry)
    .leftJoin(user, eq(timeEntry.userId, user.id))
    .groupBy(timeEntry.projectId, timeEntry.userId, user.name)

  const map: Record<string, { userId: string; userName: string; lastActivity: Date | null }[]> = {}
  for (const row of rows) {
    if (!map[row.projectId]) map[row.projectId] = []
    map[row.projectId]!.push({
      userId: row.userId,
      userName: row.userName ?? row.userId,
      lastActivity: row.lastActivity,
    })
  }

  // Sort each project's contributors by most recent activity first
  for (const projectId in map) {
    map[projectId].sort((a, b) => {
      if (!a.lastActivity && !b.lastActivity) return 0
      if (!a.lastActivity) return 1
      if (!b.lastActivity) return -1
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    })
  }

  return map
})
