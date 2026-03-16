import sharp from 'sharp'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { image } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401, message: 'Nicht authentifiziert' })

  const form = await readMultipartFormData(event)
  const file = form?.find(f => f.name === 'file')

  if (!file?.data) throw createError({ statusCode: 400, message: 'Keine Datei gefunden' })

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type ?? '')) {
    throw createError({ statusCode: 400, message: 'Nur JPEG, PNG, WebP und GIF erlaubt' })
  }

  const id = randomUUID()
  const uploadsDir = join(process.cwd(), 'private/uploads')
  await mkdir(uploadsDir, { recursive: true })

  const src = sharp(file.data)
  const meta = await src.metadata()

  // Thumbnail 300x300 (crop)
  await src.clone().resize(300, 300, { fit: 'cover' }).webp({ quality: 80 })
    .toFile(join(uploadsDir, `${id}-thumb.webp`))

  // Medium max 1200px Breite
  await src.clone().resize(1200, null, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 })
    .toFile(join(uploadsDir, `${id}-medium.webp`))

  // Original als WebP
  await src.clone().webp({ quality: 90 })
    .toFile(join(uploadsDir, `${id}-original.webp`))

  await db.insert(image).values({
    id,
    userId: session.user.id,
    originalName: file.filename ?? 'image',
    width: meta.width ?? null,
    height: meta.height ?? null,
  })

  return { id }
})
