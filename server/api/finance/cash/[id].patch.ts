import { eq, and } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { cashBalance } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  await db.update(cashBalance).set({
    amount:           Number(body.amount),
    currency:         body.currency || 'CHF',
    lendingKapital:      body.lendingKapital      != null ? Number(body.lendingKapital)      : null,
    lendingKapitalTotal: body.lendingKapitalTotal != null ? Number(body.lendingKapitalTotal) : null,
    lendingZinsen:       body.lendingZinsen       != null ? Number(body.lendingZinsen)       : null,
    lendingGebuehren: body.lendingGebuehren != null ? Number(body.lendingGebuehren) : null,
    lendingJahr:      body.lendingJahr      != null ? Number(body.lendingJahr)      : null,
    lendingZinssatz:  body.lendingZinssatz  != null ? Number(body.lendingZinssatz)  : null,
  }).where(and(eq(cashBalance.id, id), eq(cashBalance.userId, session.user.id)))

  return { ok: true }
})
