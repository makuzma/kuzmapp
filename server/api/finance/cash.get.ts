import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { cashBalance } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })
  return db.select().from(cashBalance).where(eq(cashBalance.userId, session.user.id))
})
