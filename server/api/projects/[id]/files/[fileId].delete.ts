import { unlink } from 'fs/promises'
import { join } from 'path'
import { eq } from 'drizzle-orm'
import { auth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { projectFile } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const projectId = getRouterParam(event, 'id')!
  const fileId = getRouterParam(event, 'fileId')!

  const [file] = await db.select().from(projectFile)
    .where(eq(projectFile.id, fileId))
  if (!file || file.projectId !== projectId) throw createError({ statusCode: 404 })

  try { await unlink(join(process.cwd(), file.filePath)) } catch {}

  await db.delete(projectFile).where(eq(projectFile.id, fileId))

  return { ok: true }
})
