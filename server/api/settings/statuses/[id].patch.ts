import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { projectStatus } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const { name, color } = await readBody(event)

  const updates: Record<string, unknown> = {}
  if (name?.trim()) updates.name = name.trim()
  if (color) updates.color = color

  const [updated] = await db.update(projectStatus).set(updates).where(eq(projectStatus.id, id)).returning()
  await logActivity(session.user.id, 'status.update', { target: id })
  return updated
})
