import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { saule3a } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { label, amount } = await readBody(event)
  if (amount == null) throw createError({ statusCode: 400, message: 'amount required' })

  const id = crypto.randomUUID()
  const [row] = await db.insert(saule3a).values({
    id,
    userId: session.user.id,
    label: label ?? '',
    amount: Number(amount),
  }).returning()

  return row
})
