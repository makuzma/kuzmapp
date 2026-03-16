import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { companyInfo } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const rows = await db.select().from(companyInfo).limit(1)

  if (rows.length === 0) {
    return { id: '', name: '', phone: '', address: '', contactPerson: '', logoPath: null }
  }

  const row = rows[0]
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address,
    contactPerson: row.contactPerson,
    logoPath: row.logoPath,
  }
})
