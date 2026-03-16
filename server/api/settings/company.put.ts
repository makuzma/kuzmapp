import { randomUUID } from 'crypto'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { companyInfo } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { name, phone, address, contactPerson } = await readBody(event)

  const rows = await db.select().from(companyInfo).limit(1)

  if (rows.length > 0) {
    const [updated] = await db
      .update(companyInfo)
      .set({ name: name ?? '', phone: phone ?? '', address: address ?? '', contactPerson: contactPerson ?? '', updatedAt: new Date() })
      .returning()
    return {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      address: updated.address,
      contactPerson: updated.contactPerson,
      logoPath: updated.logoPath,
    }
  } else {
    const [inserted] = await db
      .insert(companyInfo)
      .values({ id: randomUUID(), name: name ?? '', phone: phone ?? '', address: address ?? '', contactPerson: contactPerson ?? '' })
      .returning()
    return {
      id: inserted.id,
      name: inserted.name,
      phone: inserted.phone,
      address: inserted.address,
      contactPerson: inserted.contactPerson,
      logoPath: inserted.logoPath,
    }
  }
})
