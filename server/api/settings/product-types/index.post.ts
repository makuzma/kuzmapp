import { randomUUID } from 'crypto'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { productType } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { name } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name ist erforderlich' })

  const [created] = await db.insert(productType).values({
    id: randomUUID(),
    name: name.trim(),
  }).returning()

  return created
})
