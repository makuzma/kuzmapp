import { eq, and } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { cashBalance } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const { label, amount, currency, portfolioId } = body

  const [row] = await db.update(cashBalance)
    .set({
      label: label ?? '',
      amount: Number(amount),
      currency,
      portfolioId: portfolioId ?? null,
    })
    .where(and(eq(cashBalance.id, id), eq(cashBalance.userId, session.user.id)))
    .returning()

  if (!row) throw createError({ statusCode: 404 })
  return row
})
