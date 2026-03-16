import { desc, eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { project, projectType, projectStatus, customer, user } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  return db.select({
    id: project.id,
    name: project.name,
    deadline: project.deadline,
    archivedAt: project.archivedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    userId: project.userId,
    creatorName: user.name,
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
  })
    .from(project)
    .leftJoin(projectType, eq(project.typeId, projectType.id))
    .leftJoin(projectStatus, eq(project.statusId, projectStatus.id))
    .leftJoin(customer, eq(project.customerId, customer.id))
    .leftJoin(user, eq(project.userId, user.id))
    .orderBy(desc(project.createdAt))
})
