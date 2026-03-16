import { randomUUID } from 'crypto'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { customer, customerProjectType } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { name, typeIds } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name ist erforderlich' })

  const id = randomUUID()
  const [created] = await db.insert(customer).values({
    id,
    name: name.trim(),
    userId: session.user.id,
  }).returning()

  if (typeIds?.length > 0) {
    await db.insert(customerProjectType).values(
      typeIds.map((typeId: string) => ({ customerId: id, typeId }))
    )
  }

  await logActivity(session.user.id, 'customer.create', { target: id, meta: { name: name.trim() } })
  return { ...created, typeIds: typeIds ?? [] }
})
