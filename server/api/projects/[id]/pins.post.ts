import { randomUUID } from 'crypto'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { projectPin } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const [pin] = await db.insert(projectPin).values({
    id: randomUUID(),
    projectId,
    fileId: body.fileId ? String(body.fileId) : null,
    x: Number(body.x),
    y: Number(body.y),
    comment: String(body.comment ?? '').trim(),
    authorName: session.user.name,
    userId: session.user.id,
  }).returning()

  return pin
})
