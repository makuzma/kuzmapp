import { eq } from 'drizzle-orm'
import { auth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { customerContact } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const customerId = getRouterParam(event, 'id')!

  return db.select({
    id: customerContact.id,
    name: customerContact.name,
    position: customerContact.position,
    email: customerContact.email,
    phone: customerContact.phone,
  }).from(customerContact).where(eq(customerContact.customerId, customerId))
})
