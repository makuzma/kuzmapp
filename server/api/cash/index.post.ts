import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { cashBalance } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const body = await readBody(event)
  const { label, amount, currency, portfolioId } = body

  if (amount == null || !currency) throw createError({ statusCode: 400, message: 'amount and currency required' })

  const id = crypto.randomUUID()
  const [row] = await db.insert(cashBalance).values({
    id,
    userId: session.user.id,
    portfolioId: portfolioId ?? null,
    label: label ?? '',
    amount: Number(amount),
    currency,
  }).returning()

  return row
})
