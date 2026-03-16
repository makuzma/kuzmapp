import { eq, inArray } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { customer, customerProjectType, customerAddress, customerContact, customerProduct } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const customers = await db
    .select()
    .from(customer)
    .where(eq(customer.userId, session.user.id))
    .orderBy(customer.createdAt)

  if (customers.length === 0) return []

  const ids = customers.map(c => c.id)

  const [typeMappings, addresses, contacts, productMappings] = await Promise.all([
    db.select().from(customerProjectType).where(inArray(customerProjectType.customerId, ids)),
    db.select().from(customerAddress).where(inArray(customerAddress.customerId, ids)),
    db.select().from(customerContact).where(inArray(customerContact.customerId, ids)),
    db.select().from(customerProduct).where(inArray(customerProduct.customerId, ids)),
  ])

  return customers.map(c => ({
    ...c,
    typeIds: typeMappings.filter(t => t.customerId === c.id).map(t => t.typeId),
    address: addresses.find(a => a.customerId === c.id) ?? null,
    contacts: contacts.filter(ct => ct.customerId === c.id),
    productIds: productMappings.filter(p => p.customerId === c.id).map(p => p.productId),
  }))
})
