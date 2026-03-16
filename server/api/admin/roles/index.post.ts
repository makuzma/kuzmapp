import { randomUUID } from 'crypto'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { role } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })
  if (!isSuperAdmin(session.user.email)) throw createError({ statusCode: 403 })

  const { name, color, pages, vacationDays } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name ist erforderlich' })

  const [created] = await db.insert(role).values({
    id: randomUUID(),
    name: name.trim(),
    color: color ?? 'neutral',
    pages: Array.isArray(pages) ? pages : [],
    vacationDays: typeof vacationDays === 'number' ? vacationDays : 0,
  }).returning()

  await logActivity(session.user.id, 'role.create', { meta: { name: name.trim() } })
  return created
})
