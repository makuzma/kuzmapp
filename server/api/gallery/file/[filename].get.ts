import { createReadStream, existsSync } from 'fs'
import { join } from 'path'
import { auth } from '../../../lib/auth'

// Erlaubtes Dateiformat: {uuid}-{size}.webp
const SAFE_FILENAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-(thumb|medium|original)\.webp$/

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401, message: 'Nicht authentifiziert' })

  const filename = getRouterParam(event, 'filename') ?? ''

  if (!SAFE_FILENAME.test(filename)) {
    throw createError({ statusCode: 400, message: 'Ungültiger Dateiname' })
  }

  const filePath = join(process.cwd(), 'private/uploads', filename)

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, message: 'Datei nicht gefunden' })
  }

  setResponseHeader(event, 'Content-Type', 'image/webp')
  setResponseHeader(event, 'Cache-Control', 'private, max-age=3600')

  return sendStream(event, createReadStream(filePath))
})
