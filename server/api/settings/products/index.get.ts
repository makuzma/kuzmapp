import { eq, inArray } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { product, productProjectType, productProductType } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const products = await db.select().from(product).where(eq(product.userId, session.user.id)).orderBy(product.createdAt)
  if (products.length === 0) return []

  const ids = products.map(p => p.id)

  const [typeMappings, productTypeMappings] = await Promise.all([
    db.select().from(productProjectType).where(inArray(productProjectType.productId, ids)),
    db.select().from(productProductType).where(inArray(productProductType.productId, ids)),
  ])

  return products.map(p => ({
    ...p,
    typeIds: typeMappings.filter(t => t.productId === p.id).map(t => t.typeId),
    productTypeIds: productTypeMappings.filter(t => t.productId === p.id).map(t => t.productTypeId),
  }))
})
