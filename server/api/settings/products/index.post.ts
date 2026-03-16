import { randomUUID } from 'crypto'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { product, productProjectType, productProductType } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { name, typeIds, productTypeIds } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name ist erforderlich' })

  const newId = randomUUID()
  await db.insert(product).values({ id: newId, name: name.trim(), userId: session.user.id })

  await Promise.all([
    typeIds?.length > 0
      ? db.insert(productProjectType).values(typeIds.map((typeId: string) => ({ productId: newId, typeId })))
      : Promise.resolve(),
    productTypeIds?.length > 0
      ? db.insert(productProductType).values(productTypeIds.map((productTypeId: string) => ({ productId: newId, productTypeId })))
      : Promise.resolve(),
  ])

  await logActivity(session.user.id, 'product.create', { target: newId, meta: { name: name.trim() } })
  return { id: newId, name: name.trim(), typeIds: typeIds ?? [], productTypeIds: productTypeIds ?? [] }
})
