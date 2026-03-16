import { randomUUID } from 'crypto'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { timeEntry } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const projectId = getRouterParam(event, 'id')!
  const { phaseId, date, description, duration, anzahl, categoryId, subcategoryIds } = await readBody(event)

  if (!phaseId || !date || duration == null) {
    throw createError({ statusCode: 400, message: 'phaseId, date und duration sind erforderlich' })
  }

  const [created] = await db.insert(timeEntry).values({
    id: randomUUID(),
    projectId,
    phaseId,
    userId: session.user.id,
    categoryId: categoryId ?? null,
    subcategoryIds: subcategoryIds ?? [],
    date,
    description: description ?? '',
    duration: Number(duration),
    anzahl: anzahl != null ? Number(anzahl) : null,
  }).returning()

  await logActivity(session.user.id, 'time-entry.create', { target: created.id, meta: { projectId } })
  return created
})
