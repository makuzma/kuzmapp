import { unlink } from 'fs/promises'
import { join } from 'path'
import { eq } from 'drizzle-orm'
import { auth } from '../../../../../lib/auth'
import { db } from '../../../../../lib/db'
import { timeEntry } from '../../../../../../drizzle/schema'

function parseFilePaths(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [raw]
  } catch {
    return [raw]
  }
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const projectId = getRouterParam(event, 'id')!
  const entryId = getRouterParam(event, 'entryId')!

  const [entry] = await db.select().from(timeEntry).where(eq(timeEntry.id, entryId))
  if (!entry || entry.projectId !== projectId) throw createError({ statusCode: 404 })

  const paths = parseFilePaths(entry.filePath)
  if (paths.length === 0) throw createError({ statusCode: 404 })

  const idxParam = getQuery(event).idx
  const idx = idxParam !== undefined ? Number(idxParam) : 0
  const targetPath = paths[idx]
  if (!targetPath) throw createError({ statusCode: 404 })

  try { await unlink(join(process.cwd(), targetPath)) } catch {}

  const newPaths = paths.filter((_, i) => i !== idx)
  await db.update(timeEntry)
    .set({ filePath: newPaths.length ? JSON.stringify(newPaths) : null })
    .where(eq(timeEntry.id, entryId))

  return { ok: true }
})
