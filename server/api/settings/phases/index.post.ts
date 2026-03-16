import { randomUUID } from 'crypto'
import { eq, sql } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { timePhase, timePhaseProjectType } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { name, typeIds } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name ist erforderlich' })

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(timePhase).where(eq(timePhase.userId, session.user.id))

  const [created] = await db.insert(timePhase).values({
    id: randomUUID(),
    name: name.trim(),
    sortOrder: Number(count),
    userId: session.user.id,
  }).returning()

  if (typeIds?.length > 0) {
    await db.insert(timePhaseProjectType).values(
      typeIds.map((typeId: string) => ({ phaseId: created.id, typeId }))
    )
  }

  await logActivity(session.user.id, 'phase.create', { target: created.id, meta: { name: name.trim() } })
  return { ...created, typeIds: typeIds ?? [] }
})
