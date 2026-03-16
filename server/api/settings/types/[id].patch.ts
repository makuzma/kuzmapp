import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { projectType } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const { name, icon } = await readBody(event)

  const updates: Record<string, unknown> = {}
  if (name?.trim()) updates.name = name.trim()
  if (icon) updates.icon = icon

  const [updated] = await db.update(projectType).set(updates).where(eq(projectType.id, id)).returning()
  await logActivity(session.user.id, 'type.update', { target: id })
  return updated
})
