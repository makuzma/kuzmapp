import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { saule3a } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  return db.select().from(saule3a).where(eq(saule3a.userId, session.user.id)).orderBy(saule3a.createdAt)
})
