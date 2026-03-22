import { eq } from 'drizzle-orm'
import { generateId } from 'better-auth'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { financeGroup } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { name } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name erforderlich' })

  const id = generateId()
  await db.insert(financeGroup).values({ id, userId: session.user.id, name: name.trim() })
  return { id, name: name.trim() }
})
