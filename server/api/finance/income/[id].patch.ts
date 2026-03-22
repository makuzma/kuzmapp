import { eq, and } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { incomeEntry } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  await db.update(incomeEntry).set({
    label:         body.label ?? '',
    amount:        Number(body.amount),
    currency:      body.currency ?? 'CHF',
    type:          body.type ?? 'einkommen',
    wiederkehrend: body.wiederkehrend ?? false,
    frequenz:      body.frequenz ?? null,
    startDatum:    body.startDatum ?? null,
    endDatum:      body.endDatum ?? null,
    kategorie:     body.kategorie ?? null,
    monat:         body.monat ?? null,
  }).where(and(eq(incomeEntry.id, id), eq(incomeEntry.userId, session.user.id)))

  return { ok: true }
})
