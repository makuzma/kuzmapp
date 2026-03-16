import { and, eq } from 'drizzle-orm'
import { auth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { berechnungsschema } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const customerId = getRouterParam(event, 'id')!
  const { productId, productTypeId, entries } = await readBody(event)

  if (!productId || !productTypeId) throw createError({ statusCode: 400 })

  await db
    .insert(berechnungsschema)
    .values({
      id: crypto.randomUUID(),
      customerId,
      productId,
      productTypeId,
      entries: entries ?? {},
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [berechnungsschema.customerId, berechnungsschema.productId, berechnungsschema.productTypeId],
      set: { entries: entries ?? {}, updatedAt: new Date() },
    })

  return { ok: true }
})
