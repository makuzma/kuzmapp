import { eq, and } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { incomeEntryAusnahme } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  await db.delete(incomeEntryAusnahme).where(
    and(eq(incomeEntryAusnahme.id, id), eq(incomeEntryAusnahme.userId, session.user.id))
  )
  return { ok: true }
})
