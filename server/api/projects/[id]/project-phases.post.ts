import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { projectPhase } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const projectId = getRouterParam(event, 'id')!
  const { phaseId } = await readBody(event)

  await db.insert(projectPhase).values({ projectId, phaseId }).onConflictDoNothing()
  await logActivity(session.user.id, 'project-phase.add', { target: projectId, meta: { phaseId } })
  return { ok: true }
})
