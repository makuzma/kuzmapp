import { createReadStream, existsSync } from 'fs'
import { join, extname } from 'path'
import { eq } from 'drizzle-orm'
import { auth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { projectFile } from '../../../../../drizzle/schema'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.csv': 'text/csv',
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const projectId = getRouterParam(event, 'id')!
  const fileId = getRouterParam(event, 'fileId')!

  const [file] = await db.select().from(projectFile)
    .where(eq(projectFile.id, fileId))
  if (!file || file.projectId !== projectId) throw createError({ statusCode: 404 })

  const absPath = join(process.cwd(), file.filePath)
  if (!existsSync(absPath)) throw createError({ statusCode: 404 })

  const ext = extname(file.filePath).toLowerCase()
  const mimeType = MIME_TYPES[ext] ?? file.mimeType ?? 'application/octet-stream'

  setResponseHeader(event, 'Content-Type', mimeType)
  setResponseHeader(event, 'Cache-Control', 'private, no-cache')

  const download = getQuery(event).download
  if (download) {
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`)
  }

  return sendStream(event, createReadStream(absPath))
})
