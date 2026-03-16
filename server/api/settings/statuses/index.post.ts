import { randomUUID } from 'crypto'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { projectStatus } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { name, color } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name ist erforderlich' })

  const [created] = await db.insert(projectStatus).values({
    id: randomUUID(),
    name: name.trim(),
    color: color ?? 'neutral',
  }).returning()

  await logActivity(session.user.id, 'status.create', { target: created.id, meta: { name: name.trim() } })
  return created
})
