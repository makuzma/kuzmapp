import { desc, eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { projectBilling, project } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const rows = await db
    .select({
      id: projectBilling.id,
      projectId: projectBilling.projectId,
      projectName: project.name,
      createdAt: projectBilling.createdAt,
      data: projectBilling.data,
    })
    .from(projectBilling)
    .leftJoin(project, eq(projectBilling.projectId, project.id))
    .orderBy(desc(projectBilling.createdAt))

  return rows.map(r => ({
    id: r.id,
    projectId: r.projectId,
    projectName: r.projectName ?? (r.data as any)?.projectName ?? '–',
    createdAt: r.createdAt,
    totalCost: (r.data as any)?.totalCost ?? null,
    currency: (r.data as any)?.currency ?? 'CHF',
  }))
})
