import { createReadStream, existsSync } from 'fs'
import { join, extname } from 'path'
import { eq } from 'drizzle-orm'
import { auth } from '../../../../../lib/auth'
import { db } from '../../../../../lib/db'
import { timeEntry } from '../../../../../../drizzle/schema'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
}

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

  const [entry] = await db.select({ filePath: timeEntry.filePath, projectId: timeEntry.projectId })
    .from(timeEntry).where(eq(timeEntry.id, entryId))
  if (!entry || entry.projectId !== projectId) throw createError({ statusCode: 404 })

  const paths = parseFilePaths(entry.filePath)
  if (paths.length === 0) throw createError({ statusCode: 404 })

  const idxParam = getQuery(event).idx
  const idx = idxParam !== undefined ? Number(idxParam) : 0
  const filePath = paths[idx]
  if (!filePath) throw createError({ statusCode: 404 })

  const absPath = join(process.cwd(), filePath)
  if (!existsSync(absPath)) throw createError({ statusCode: 404 })

  const ext = extname(filePath).toLowerCase()
  const mimeType = MIME_TYPES[ext] ?? 'application/octet-stream'

  setResponseHeader(event, 'Content-Type', mimeType)
  setResponseHeader(event, 'Cache-Control', 'private, no-cache')

  return sendStream(event, createReadStream(absPath))
})
