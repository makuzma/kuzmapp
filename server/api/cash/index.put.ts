import { eq, and, isNull } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { cashBalance } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { portfolioId, amount, currency } = await readBody(event)

  const condition = portfolioId
    ? and(eq(cashBalance.userId, session.user.id), eq(cashBalance.portfolioId, portfolioId))
    : and(eq(cashBalance.userId, session.user.id), isNull(cashBalance.portfolioId))

  const existing = await db.select().from(cashBalance).where(condition).limit(1)

  if (existing.length > 0) {
    const [row] = await db.update(cashBalance)
      .set({ amount: Number(amount), currency })
      .where(eq(cashBalance.id, existing[0].id))
      .returning()
    return row
  }

  const [row] = await db.insert(cashBalance)
    .values({ id: crypto.randomUUID(), userId: session.user.id, portfolioId: portfolioId ?? null, amount: Number(amount), currency, label: '' })
    .returning()
  return row
})
