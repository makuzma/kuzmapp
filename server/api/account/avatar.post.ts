import sharp from 'sharp'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { user } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const form = await readMultipartFormData(event)
  const file = form?.find(f => f.name === 'file')
  if (!file?.data) throw createError({ statusCode: 400, message: 'Keine Datei gefunden' })

  const uploadsDir = join(process.cwd(), 'private/uploads')
  await mkdir(uploadsDir, { recursive: true })

  await sharp(file.data)
    .resize({ width: 200, withoutEnlargement: false })
    .webp({ quality: 85 })
    .toFile(join(uploadsDir, `avatar-${session.user.id}.webp`))

  const imageUrl = `/api/avatar/${session.user.id}`
  await db.update(user).set({ image: imageUrl }).where(eq(user.id, session.user.id))

  await logActivity(session.user.id, 'avatar.upload')
  return { ok: true }
})
