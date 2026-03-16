import { randomUUID } from 'crypto'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { project } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { name, typeId, statusId, customerId, startDate, deadline } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name ist erforderlich' })

  const [created] = await db.insert(project).values({
    id: randomUUID(),
    name: name.trim(),
    typeId: typeId ?? null,
    statusId: statusId ?? null,
    customerId: customerId ?? null,
    startDate: startDate ? new Date(startDate) : null,
    deadline: deadline ? new Date(deadline) : null,
    userId: session.user.id,
  }).returning()

  await logActivity(session.user.id, 'project.create', { target: created.id, meta: { name: name.trim() } })
  return created
})
