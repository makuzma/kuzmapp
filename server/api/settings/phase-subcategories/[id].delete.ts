import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { timePhase, timePhaseSubcategory } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!

  // Verify the subcategory belongs to a phase owned by the current user
  const [sub] = await db.select({ phaseId: timePhaseSubcategory.phaseId })
    .from(timePhaseSubcategory)
    .where(eq(timePhaseSubcategory.id, id))
  if (!sub) throw createError({ statusCode: 404 })

  const [phase] = await db.select().from(timePhase).where(eq(timePhase.id, sub.phaseId))
  if (!phase || phase.userId !== session.user.id) throw createError({ statusCode: 404 })

  await db.delete(timePhaseSubcategory).where(eq(timePhaseSubcategory.id, id))
  return { ok: true }
})
