import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { timePhase, timePhaseProjectType } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const { name, typeIds, allowFiles } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name ist erforderlich' })

  const [updated] = await db.update(timePhase).set({ name: name.trim(), allowFiles: !!allowFiles }).where(eq(timePhase.id, id)).returning()

  if (typeIds !== undefined) {
    await db.delete(timePhaseProjectType).where(eq(timePhaseProjectType.phaseId, id))
    if (typeIds.length > 0) {
      await db.insert(timePhaseProjectType).values(
        typeIds.map((typeId: string) => ({ phaseId: id, typeId }))
      )
    }
  }

  await logActivity(session.user.id, 'phase.update', { target: id })
  return { ...updated, typeIds: typeIds ?? [] }
})
