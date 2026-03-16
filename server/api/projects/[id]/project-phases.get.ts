import { eq, inArray } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { projectPhase, timePhase, timePhaseSubcategory } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const projectId = getRouterParam(event, 'id')!

  const rows = await db.select({
    id: timePhase.id,
    name: timePhase.name,
    sortOrder: timePhase.sortOrder,
    allowFiles: timePhase.allowFiles,
    activeSubcategoryIds: projectPhase.activeSubcategoryIds,
  })
    .from(projectPhase)
    .innerJoin(timePhase, eq(projectPhase.phaseId, timePhase.id))
    .where(eq(projectPhase.projectId, projectId))
    .orderBy(timePhase.sortOrder)

  if (rows.length === 0) return []

  const subcategories = await db
    .select({ id: timePhaseSubcategory.id, name: timePhaseSubcategory.name, phaseId: timePhaseSubcategory.phaseId })
    .from(timePhaseSubcategory)
    .where(inArray(timePhaseSubcategory.phaseId, rows.map(r => r.id)))
    .orderBy(timePhaseSubcategory.sortOrder, timePhaseSubcategory.createdAt)

  return rows.map(r => ({
    ...r,
    subcategories: subcategories.filter(s => s.phaseId === r.id).map(s => ({ id: s.id, name: s.name })),
  }))
})
