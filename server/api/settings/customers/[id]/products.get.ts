import { and, eq, inArray } from 'drizzle-orm'
import { auth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { customerProduct, product, productProjectType, productProductType } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const customerId = getRouterParam(event, 'id')!
  const { typeId } = getQuery(event)

  let baseQuery = db.select({ id: product.id, name: product.name })
    .from(customerProduct)
    .innerJoin(product, eq(customerProduct.productId, product.id))
    .$dynamic()

  if (typeId) {
    baseQuery = baseQuery.innerJoin(productProjectType, and(
      eq(productProjectType.productId, product.id),
      eq(productProjectType.typeId, typeId as string)
    ))
  }

  const products = await baseQuery.where(eq(customerProduct.customerId, customerId))
  if (products.length === 0) return []

  const ids = products.map(p => p.id)

  const [productTypeMappings, projectTypeMappings] = await Promise.all([
    db.select().from(productProductType).where(inArray(productProductType.productId, ids)),
    db.select().from(productProjectType).where(inArray(productProjectType.productId, ids)),
  ])

  return products.map(p => ({
    ...p,
    productTypeIds: productTypeMappings.filter(m => m.productId === p.id).map(m => m.productTypeId),
    typeIds: projectTypeMappings.filter(m => m.productId === p.id).map(m => m.typeId),
  }))
})
