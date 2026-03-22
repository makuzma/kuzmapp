import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { financeGroup } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const { name } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name erforderlich' })

  const [row] = await db.select().from(financeGroup).where(eq(financeGroup.id, id))
  if (!row) throw createError({ statusCode: 404 })
  if (row.userId !== session.user.id) throw createError({ statusCode: 403 })

  await db.update(financeGroup).set({ name: name.trim() }).where(eq(financeGroup.id, id))
  return { ok: true }
})
