import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { incomeEntry } from '../../../drizzle/schema'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const body = await readBody(event)
  const id = randomUUID()
  await db.insert(incomeEntry).values({
    id,
    userId: session.user.id,
    label: body.label ?? '',
    amount: Number(body.amount),
    currency: body.currency ?? 'CHF',
    type: body.type ?? 'einkommen',
    wiederkehrend: body.wiederkehrend ?? false,
    frequenz: body.frequenz ?? null,
    startDatum: body.startDatum ?? null,
    endDatum: body.endDatum ?? null,
    kategorie: body.kategorie ?? null,
    monat: body.monat ?? null,
  })
  return { id }
})
