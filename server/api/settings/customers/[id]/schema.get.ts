import { and, eq } from 'drizzle-orm'
import { auth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { berechnungsschema } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const customerId = getRouterParam(event, 'id')!
  const { productId, productTypeId } = getQuery(event)

  if (!productId || !productTypeId) throw createError({ statusCode: 400 })

  const [row] = await db
    .select()
    .from(berechnungsschema)
    .where(and(
      eq(berechnungsschema.customerId, customerId),
      eq(berechnungsschema.productId, productId as string),
      eq(berechnungsschema.productTypeId, productTypeId as string),
    ))

  return row?.entries ?? {}
})
