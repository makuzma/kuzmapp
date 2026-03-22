import { desc, eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { portfolioSnapshot } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const rows = await db
    .select()
    .from(portfolioSnapshot)
    .where(eq(portfolioSnapshot.userId, session.user.id))
    .orderBy(desc(portfolioSnapshot.date))

  return rows
})
