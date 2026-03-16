import { and, eq } from 'drizzle-orm'
import { auth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { projectPhase } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const projectId = getRouterParam(event, 'id')!
  const phaseId = getRouterParam(event, 'phaseId')!
  const { activeSubcategoryIds } = await readBody(event)

  await db
    .update(projectPhase)
    .set({ activeSubcategoryIds: activeSubcategoryIds ?? [] })
    .where(and(eq(projectPhase.projectId, projectId), eq(projectPhase.phaseId, phaseId)))

  return { ok: true }
})
