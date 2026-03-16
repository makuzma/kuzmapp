import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { projectBilling } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!

  const [billing] = await db
    .select()
    .from(projectBilling)
    .where(eq(projectBilling.id, id))

  if (!billing) throw createError({ statusCode: 404 })

  return billing.data
})
