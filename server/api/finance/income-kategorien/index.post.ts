import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { incomeKategorie } from '../../../../drizzle/schema'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const body = await readBody(event)
  const id = randomUUID()
  await db.insert(incomeKategorie).values({
    id,
    userId: session.user.id,
    name: body.name,
    type: body.type,
  })
  return { id }
})
