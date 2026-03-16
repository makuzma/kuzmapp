import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { timeEntryCategory } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { name } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name ist erforderlich' })

  const [created] = await db.insert(timeEntryCategory).values({
    id: crypto.randomUUID(),
    name: name.trim(),
  }).returning()

  return created
})
