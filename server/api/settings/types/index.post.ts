import { randomUUID } from 'crypto'
import { sql } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { projectType } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { name, icon } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name ist erforderlich' })

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(projectType)

  const [created] = await db.insert(projectType).values({
    id: randomUUID(),
    name: name.trim(),
    icon: icon ?? 'i-lucide-folder',
    sortOrder: Number(count),
  }).returning()

  await logActivity(session.user.id, 'type.create', { target: created.id, meta: { name: name.trim() } })
  return created
})
