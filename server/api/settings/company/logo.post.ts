import { mkdir, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { companyInfo } from '../../../../drizzle/schema'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const form = await readMultipartFormData(event)
  const file = form?.find(f => f.name === 'file')
  if (!file?.data) throw createError({ statusCode: 400, message: 'Keine Datei gefunden' })

  const ext = file.filename ? extname(file.filename) : '.png'
  const filename = `logo${ext}`
  const uploadDir = join(process.cwd(), 'public/uploads/company-logo')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), file.data)

  const logoPath = `/uploads/company-logo/${filename}`

  const rows = await db.select().from(companyInfo).limit(1)

  if (rows.length > 0) {
    await db.update(companyInfo).set({ logoPath, updatedAt: new Date() })
  } else {
    await db.insert(companyInfo).values({ id: randomUUID(), logoPath })
  }

  return { logoPath }
})
