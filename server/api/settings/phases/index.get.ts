import { eq, inArray } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { timePhase, timePhaseProjectType, timePhaseSubcategory } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const phases = await db.select().from(timePhase).where(eq(timePhase.userId, session.user.id)).orderBy(timePhase.sortOrder, timePhase.createdAt)

  if (phases.length === 0) return []

  const phaseIds = phases.map(p => p.id)

  const [typeMappings, subcategories] = await Promise.all([
    db.select().from(timePhaseProjectType).where(inArray(timePhaseProjectType.phaseId, phaseIds)),
    db.select().from(timePhaseSubcategory).where(inArray(timePhaseSubcategory.phaseId, phaseIds)).orderBy(timePhaseSubcategory.sortOrder, timePhaseSubcategory.createdAt),
  ])

  return phases.map(p => ({
    ...p,
    typeIds: typeMappings.filter(t => t.phaseId === p.id).map(t => t.typeId),
    subcategories: subcategories.filter(s => s.phaseId === p.id).map(s => ({ id: s.id, name: s.name })),
  }))
})
