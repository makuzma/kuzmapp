import { and, eq, inArray } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { project, timePhase, timePhaseProjectType, timePhaseSubcategory } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!

  const [proj] = await db.select({ typeId: project.typeId }).from(project).where(eq(project.id, id))
  if (!proj) throw createError({ statusCode: 404 })

  if (!proj.typeId) return []

  const phases = await db
    .select({ id: timePhase.id, name: timePhase.name, sortOrder: timePhase.sortOrder, allowFiles: timePhase.allowFiles })
    .from(timePhase)
    .innerJoin(timePhaseProjectType, eq(timePhaseProjectType.phaseId, timePhase.id))
    .where(and(
      eq(timePhase.userId, session.user.id),
      eq(timePhaseProjectType.typeId, proj.typeId),
    ))
    .orderBy(timePhase.sortOrder, timePhase.createdAt)

  if (phases.length === 0) return []

  const subcategories = await db
    .select({ id: timePhaseSubcategory.id, name: timePhaseSubcategory.name, phaseId: timePhaseSubcategory.phaseId })
    .from(timePhaseSubcategory)
    .where(inArray(timePhaseSubcategory.phaseId, phases.map(p => p.id)))
    .orderBy(timePhaseSubcategory.sortOrder, timePhaseSubcategory.createdAt)

  return phases.map(p => ({
    ...p,
    subcategories: subcategories.filter(s => s.phaseId === p.id).map(s => ({ id: s.id, name: s.name })),
  }))
})
