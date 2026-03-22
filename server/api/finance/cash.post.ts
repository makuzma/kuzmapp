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
  // Bei Lending (lendingJahr gesetzt) immer neu einfügen — mehrere Einträge pro Portfolio erlaubt
  const isLending = body.lendingJahr != null
  const existing = portfolioId && !isLending
    ? await db.select().from(cashBalance).where(
        and(eq(cashBalance.userId, session.user.id), eq(cashBalance.portfolioId, portfolioId))
      ).limit(1)
    : []

  const lendingFields = {
    lendingKapital:      body.lendingKapital      != null ? Number(body.lendingKapital)      : null,
    lendingKapitalTotal: body.lendingKapitalTotal != null ? Number(body.lendingKapitalTotal) : null,
    lendingZinsen:       body.lendingZinsen       != null ? Number(body.lendingZinsen)       : null,
    lendingGebuehren: body.lendingGebuehren != null ? Number(body.lendingGebuehren) : null,
    lendingJahr:      body.lendingJahr      != null ? Number(body.lendingJahr)      : null,
    lendingZinssatz:  body.lendingZinssatz  != null ? Number(body.lendingZinssatz)  : null,
  }

  if (existing.length) {
    await db.update(cashBalance)
      .set({ amount: Number(body.amount), currency: body.currency || 'CHF', ...lendingFields })
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
    ...lendingFields,
  })
  return { id }
})
