import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { timeEntryCategory } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const { name, isAusfall } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name ist erforderlich' })

  const [updated] = await db.update(timeEntryCategory)
    .set({ name: name.trim(), isAusfall: !!isAusfall })
    .where(eq(timeEntryCategory.id, id))
    .returning()

  return updated
})
