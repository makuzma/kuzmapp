import { eq } from 'drizzle-orm'
import { auth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { timeEntry } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const entryId = getRouterParam(event, 'entryId')!
  const body = await readBody(event)

  const patch: Record<string, any> = { lastEditedByUserId: session.user.id }
  if ('date' in body)        patch.date = body.date
  if ('description' in body) patch.description = body.description
  if ('duration' in body)    patch.duration = Number(body.duration)
  if ('anzahl' in body)      patch.anzahl = body.anzahl != null ? Number(body.anzahl) : null
  if ('categoryId' in body)  patch.categoryId = body.categoryId ?? null

  const [updated] = await db.update(timeEntry)
    .set(patch)
    .where(eq(timeEntry.id, entryId))
    .returning()

  await logActivity(session.user.id, 'time-entry.update', { target: entryId })
  return updated
})
