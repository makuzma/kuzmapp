import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { portfolio } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { name, color, portfolioType, groupId } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name fehlt' })

  const id = crypto.randomUUID()
  await db.insert(portfolio).values({
    id,
    userId: session.user.id,
    name: name.trim(),
    color: color ?? 'blue',
    portfolioType: portfolioType ?? '',
    sortOrder: 0,
    groupId: groupId || null,
  })

  return { id }
})
