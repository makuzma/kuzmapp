import { eq } from 'drizzle-orm'
import { auth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { timeEntry } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const entryId = getRouterParam(event, 'entryId')!
  await db.delete(timeEntry).where(eq(timeEntry.id, entryId))
  await logActivity(session.user.id, 'time-entry.delete', { target: entryId })
  return { ok: true }
})
