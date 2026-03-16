import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { customer } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!

  const [result] = await db
    .select({ id: customer.id, name: customer.name, currency: customer.currency })
    .from(customer)
    .where(eq(customer.id, id))

  if (!result) throw createError({ statusCode: 404, message: 'Kunde nicht gefunden' })
  return result
})
