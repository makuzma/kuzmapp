import { eq } from 'drizzle-orm'
import { auth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { projectPin } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const pinId = getRouterParam(event, 'pinId')!
  await db.delete(projectPin).where(eq(projectPin.id, pinId))
  return { ok: true }
})
