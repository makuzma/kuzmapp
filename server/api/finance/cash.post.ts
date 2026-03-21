import { eq, and } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { cashBalance } from '../../../drizzle/schema'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const body = await readBody(event)
  const portfolioId = body.portfolioId || null

  // Upsert: bestehenden Eintrag für dieses Portfolio aktualisieren
  const existing = portfolioId
    ? await db.select().from(cashBalance).where(
        and(eq(cashBalance.userId, session.user.id), eq(cashBalance.portfolioId, portfolioId))
      ).limit(1)
    : []

  if (existing.length) {
    await db.update(cashBalance)
      .set({ amount: Number(body.amount), currency: body.currency || 'CHF' })
      .where(eq(cashBalance.id, existing[0].id))
    return { id: existing[0].id }
  }

  const id = randomUUID()
  await db.insert(cashBalance).values({
    id,
    userId: session.user.id,
    portfolioId,
    label: '',
    amount: Number(body.amount),
    currency: body.currency || 'CHF',
  })
  return { id }
})
