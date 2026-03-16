import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { companyInfo } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const rows = await db.select({ logoPath: companyInfo.logoPath }).from(companyInfo).limit(1)

  return { logoPath: rows[0]?.logoPath ?? null }
})
