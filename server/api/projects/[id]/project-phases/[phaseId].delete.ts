import { and, eq } from 'drizzle-orm'
import { auth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { projectPhase, timeEntry } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const projectId = getRouterParam(event, 'id')!
  const phaseId = getRouterParam(event, 'phaseId')!

  await db.delete(timeEntry)
    .where(and(eq(timeEntry.projectId, projectId), eq(timeEntry.phaseId, phaseId)))
  await db.delete(projectPhase)
    .where(and(eq(projectPhase.projectId, projectId), eq(projectPhase.phaseId, phaseId)))
  await logActivity(session.user.id, 'project-phase.remove', { target: projectId, meta: { phaseId } })
  return { ok: true }
})
