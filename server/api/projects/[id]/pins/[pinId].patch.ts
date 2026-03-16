import { eq } from 'drizzle-orm'
import { auth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { projectPin } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const pinId = getRouterParam(event, 'pinId')!
  const body = await readBody(event)

  const updates: any = {}
  if (body.comment !== undefined) updates.comment = String(body.comment ?? '').trim()
  if (body.x !== undefined) updates.x = Number(body.x)
  if (body.y !== undefined) updates.y = Number(body.y)

  const [pin] = await db.update(projectPin)
    .set(updates)
    .where(eq(projectPin.id, pinId))
    .returning()

  return pin
})
