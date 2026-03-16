import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { product, productProjectType, productProductType } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const { name, typeIds, productTypeIds } = await readBody(event)

  if (name?.trim()) {
    await db.update(product).set({ name: name.trim() }).where(eq(product.id, id))
  }

  if (typeIds !== undefined) {
    await db.delete(productProjectType).where(eq(productProjectType.productId, id))
    if (typeIds.length > 0) {
      await db.insert(productProjectType).values(typeIds.map((typeId: string) => ({ productId: id, typeId })))
    }
  }

  if (productTypeIds !== undefined) {
    await db.delete(productProductType).where(eq(productProductType.productId, id))
    if (productTypeIds.length > 0) {
      await db.insert(productProductType).values(productTypeIds.map((productTypeId: string) => ({ productId: id, productTypeId })))
    }
  }

  const [updated] = await db.select().from(product).where(eq(product.id, id))
  await logActivity(session.user.id, 'product.update', { target: id })
  return updated
})
