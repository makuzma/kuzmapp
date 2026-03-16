import { desc, eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { projectBilling } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!

  const billings = await db
    .select({
      id: projectBilling.id,
      createdAt: projectBilling.createdAt,
      data: projectBilling.data,
    })
    .from(projectBilling)
    .where(eq(projectBilling.projectId, id))
    .orderBy(desc(projectBilling.createdAt))

  return billings.map(b => ({
    id: b.id,
    createdAt: b.createdAt,
    totalCost: (b.data as any)?.totalCost ?? null,
    currency: (b.data as any)?.currency ?? 'CHF',
  }))
})
