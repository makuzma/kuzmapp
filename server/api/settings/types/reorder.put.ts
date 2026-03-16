import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { projectType } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const ids: string[] = await readBody(event)

  await Promise.all(
    ids.map((id, index) =>
      db.update(projectType)
        .set({ sortOrder: index })
        .where(eq(projectType.id, id))
    )
  )

  return { ok: true }
})
