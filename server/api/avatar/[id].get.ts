import { createReadStream, existsSync } from 'fs'
import { join } from 'path'
import { auth } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id') ?? ''

  // Only allow safe alphanumeric + hyphen IDs (no path traversal)
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw createError({ statusCode: 400 })
  }

  const filePath = join(process.cwd(), 'private/uploads', `avatar-${id}.webp`)

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404 })
  }

  setResponseHeader(event, 'Content-Type', 'image/webp')
  setResponseHeader(event, 'Cache-Control', 'private, no-cache')

  return sendStream(event, createReadStream(filePath))
})
