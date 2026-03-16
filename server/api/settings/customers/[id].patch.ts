import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { customer, customerProjectType, customerAddress, customerContact, customerProduct } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const { name, currency, typeIds, address, contacts, productIds } = await readBody(event)

  if (name?.trim()) {
    await db.update(customer).set({ name: name.trim() }).where(eq(customer.id, id))
  }

  if (currency === 'EUR' || currency === 'CHF') {
    await db.update(customer).set({ currency }).where(eq(customer.id, id))
  }

  if (typeIds !== undefined) {
    await db.delete(customerProjectType).where(eq(customerProjectType.customerId, id))
    if (typeIds.length > 0) {
      await db.insert(customerProjectType).values(
        typeIds.map((typeId: string) => ({ customerId: id, typeId }))
      )
    }
  }

  if (address !== undefined) {
    const existing = await db.select({ id: customerAddress.id }).from(customerAddress).where(eq(customerAddress.customerId, id))
    if (existing.length > 0) {
      await db.update(customerAddress).set({
        street: address.street || null,
        city: address.city || null,
        zip: address.zip || null,
        country: address.country || null,
      }).where(eq(customerAddress.customerId, id))
    } else {
      await db.insert(customerAddress).values({
        id: crypto.randomUUID(),
        customerId: id,
        street: address.street || null,
        city: address.city || null,
        zip: address.zip || null,
        country: address.country || null,
      })
    }
  }

  if (contacts !== undefined) {
    await db.delete(customerContact).where(eq(customerContact.customerId, id))
    if (contacts.length > 0) {
      await db.insert(customerContact).values(
        contacts.map((ct: any) => ({
          id: crypto.randomUUID(),
          customerId: id,
          name: ct.name,
          position: ct.position || null,
          email: ct.email || null,
          phone: ct.phone || null,
        }))
      )
    }
  }

  if (productIds !== undefined) {
    await db.delete(customerProduct).where(eq(customerProduct.customerId, id))
    if (productIds.length > 0) {
      await db.insert(customerProduct).values(
        productIds.map((productId: string) => ({ customerId: id, productId }))
      )
    }
  }

  const [updated] = await db.select().from(customer).where(eq(customer.id, id))
  await logActivity(session.user.id, 'customer.update', { target: id })
  return updated
})
