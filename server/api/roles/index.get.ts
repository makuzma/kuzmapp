import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { role } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  return db.select().from(role)
})
