import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { vacation } from '../../../drizzle/schema'
import { hasApprovalPermission } from '../../utils/hasApprovalPermission'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!

  const [existing] = await db.select().from(vacation).where(eq(vacation.id, id))
  if (!existing) throw createError({ statusCode: 404 })

  const canApprove = await hasApprovalPermission(session.user.id, session.user.email)
  const isOwner = existing.userId === session.user.id

  if (!isOwner && !canApprove) {
    throw createError({ statusCode: 403 })
  }

  await db.delete(vacation).where(eq(vacation.id, id))

  return { ok: true }
})
