import { gt, eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { session, user } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const s = await auth.api.getSession({ headers: event.headers })
  if (!s) throw createError({ statusCode: 401 })

  const now = new Date()

  const rows = await db
    .select({
      userId: user.id,
      name: user.name,
      email: user.email,
      sessionId: session.id,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      userAgent: session.userAgent,
    })
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(gt(session.expiresAt, now))
    .orderBy(session.createdAt)

  // Deduplicate: one entry per user (take latest session)
  const map = new Map<string, typeof rows[0]>()
  for (const row of rows) {
    const existing = map.get(row.userId)
    if (!existing || row.createdAt > existing.createdAt) {
      map.set(row.userId, row)
    }
  }

  return [...map.values()]
})
