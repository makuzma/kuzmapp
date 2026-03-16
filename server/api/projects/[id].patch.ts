import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { project } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if ('name' in body) updates.name = body.name?.trim()
  if ('typeId' in body) updates.typeId = body.typeId ?? null
  if ('statusId' in body) updates.statusId = body.statusId ?? null
  if ('customerId' in body) updates.customerId = body.customerId ?? null
  if ('contactId' in body) updates.contactId = body.contactId ?? null
  if ('productId' in body) updates.productId = body.productId ?? null
  if ('productTypeId' in body) updates.productTypeId = body.productTypeId ?? null
  if ('startDate' in body) updates.startDate = body.startDate ? new Date(body.startDate) : null
  if ('deadline' in body) updates.deadline = body.deadline ? new Date(body.deadline) : null
  if ('archivedAt' in body) updates.archivedAt = body.archivedAt ? new Date(body.archivedAt) : null

  const [updated] = await db.update(project)
    .set(updates)
    .where(eq(project.id, id))
    .returning()

  await logActivity(session.user.id, 'project.update', { target: id })
  return updated
})
