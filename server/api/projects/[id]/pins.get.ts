import { eq, asc } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { projectPin } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const projectId = getRouterParam(event, 'id')!

  return db.select().from(projectPin).where(eq(projectPin.projectId, projectId)).orderBy(asc(projectPin.createdAt))
})
