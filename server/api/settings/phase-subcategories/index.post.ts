import { randomUUID } from 'crypto'
import { eq, sql } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { timePhase, timePhaseSubcategory } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { phaseId, name } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name ist erforderlich' })
  if (!phaseId) throw createError({ statusCode: 400, message: 'phaseId ist erforderlich' })

  // Verify the phase belongs to the current user
  const [phase] = await db.select().from(timePhase).where(eq(timePhase.id, phaseId))
  if (!phase || phase.userId !== session.user.id) throw createError({ statusCode: 404 })

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(timePhaseSubcategory).where(eq(timePhaseSubcategory.phaseId, phaseId))

  const [created] = await db.insert(timePhaseSubcategory).values({
    id: randomUUID(),
    phaseId,
    name: name.trim(),
    sortOrder: Number(count),
  }).returning()

  return created
})
