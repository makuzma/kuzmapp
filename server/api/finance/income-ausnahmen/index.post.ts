import { eq, and } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { incomeEntryAusnahme } from '../../../../drizzle/schema'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const body = await readBody(event)

  // Upsert: lösche bestehende Ausnahme für diesen Eintrag + Monat
  await db.delete(incomeEntryAusnahme).where(
    and(
      eq(incomeEntryAusnahme.entryId, body.entryId),
      eq(incomeEntryAusnahme.monat, Number(body.monat)),
      eq(incomeEntryAusnahme.userId, session.user.id),
    )
  )

  const id = randomUUID()
  await db.insert(incomeEntryAusnahme).values({
    id,
    entryId: body.entryId,
    userId: session.user.id,
    monat: Number(body.monat),
    betrag: Number(body.betrag),
  })
  return { id }
})
