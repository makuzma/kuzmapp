import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { project, projectType, projectStatus, customer, customerContact, product, productType } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!

  const [result] = await db.select({
    id: project.id,
    name: project.name,
    startDate: project.startDate,
    deadline: project.deadline,
    archivedAt: project.archivedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    userId: project.userId,
    type: {
      id: projectType.id,
      name: projectType.name,
      icon: projectType.icon,
    },
    status: {
      id: projectStatus.id,
      name: projectStatus.name,
      color: projectStatus.color,
    },
    customer: {
      id: customer.id,
      name: customer.name,
    },
    contact: {
      id: customerContact.id,
      name: customerContact.name,
      position: customerContact.position,
      email: customerContact.email,
      phone: customerContact.phone,
    },
    product: {
      id: product.id,
      name: product.name,
    },
    productType: {
      id: productType.id,
      name: productType.name,
    },
  })
    .from(project)
    .leftJoin(projectType, eq(project.typeId, projectType.id))
    .leftJoin(projectStatus, eq(project.statusId, projectStatus.id))
    .leftJoin(customer, eq(project.customerId, customer.id))
    .leftJoin(customerContact, eq(project.contactId, customerContact.id))
    .leftJoin(product, eq(project.productId, product.id))
    .leftJoin(productType, eq(project.productTypeId, productType.id))
    .where(eq(project.id, id))

  if (!result) throw createError({ statusCode: 404, message: 'Projekt nicht gefunden' })
  return result
})
