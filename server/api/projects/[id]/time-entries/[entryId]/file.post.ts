import { randomUUID } from 'crypto'
import { mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { spawn } from 'child_process'
import { eq } from 'drizzle-orm'
import { auth } from '../../../../../lib/auth'
import { db } from '../../../../../lib/db'
import { timeEntry } from '../../../../../../drizzle/schema'

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-powerpoint': '.ppt',
  'text/csv': '.csv',
  'application/csv': '.csv',
}
const ALLOWED_EXT: Record<string, string> = {
  '.jpg': '.jpg', '.jpeg': '.jpg', '.png': '.png',
  '.gif': '.gif', '.webp': '.webp', '.bmp': '.bmp',
  '.tiff': '.tiff', '.tif': '.tiff', '.pdf': '.pdf',
  '.xlsx': '.xlsx', '.xls': '.xls',
  '.docx': '.docx', '.doc': '.doc',
  '.pptx': '.pptx', '.ppt': '.ppt',
  '.csv': '.csv',
}
const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

function compressPdf(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const gs = spawn('gs', [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/ebook',
      '-dNOPAUSE', '-dQUIET', '-dBATCH',
      '-sOutputFile=-', '-',
    ])
    const chunks: Buffer[] = []
    gs.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
    gs.on('close', (code: number) => {
      if (code === 0) resolve(Buffer.concat(chunks))
      else reject(new Error(`gs exited with code ${code}`))
    })
    gs.on('error', reject)
    gs.stdin.write(input)
    gs.stdin.end()
  })
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

  const [entry] = await db.select().from(timeEntry).where(eq(timeEntry.id, entryId))
  if (!entry || entry.projectId !== projectId) throw createError({ statusCode: 404 })

  const form = await readMultipartFormData(event)
  if (!form || form.length === 0) throw createError({ statusCode: 400, message: 'Keine Datei gefunden' })

  const part = form.find(f => f.name === 'file') ?? form[0]
  const fileData = part?.data
  const fileMime = (part?.type ?? '').toLowerCase()
  const fileFilename = part?.filename ?? ''

  if (!fileData?.length) throw createError({ statusCode: 400, message: 'Keine Datei gefunden' })
  if (fileData.length > MAX_SIZE) throw createError({ statusCode: 400, message: 'Datei zu groß (max. 10 MB)' })

  const fileExt = extname(fileFilename).toLowerCase()
  const ext = ALLOWED_MIME[fileMime] ?? ALLOWED_EXT[fileExt] ?? (fileMime.startsWith('image/') ? '.jpg' : null)
  if (!ext) throw createError({ statusCode: 400, message: `Dateityp nicht erlaubt (mime: ${fileMime}, ext: ${fileExt})` })

  const uploadsDir = join(process.cwd(), 'private/uploads/projects')
  await mkdir(uploadsDir, { recursive: true })

  const isImage = fileMime.startsWith('image/') || (!fileMime && /\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif)$/i.test(fileExt))
  const isPdf = ext === '.pdf'
  const savedExt = isImage ? '.webp' : ext
  const fileName = `${entryId}-${randomUUID()}${savedExt}`
  const newFilePath = `private/uploads/projects/${fileName}`
  const { writeFile } = await import('fs/promises')

  let dataToWrite: Buffer = fileData
  if (isImage) {
    const sharp = (await import('sharp')).default
    dataToWrite = await sharp(fileData)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
  } else if (isPdf) {
    try { dataToWrite = await compressPdf(fileData) } catch {}
  }

  await writeFile(join(process.cwd(), newFilePath), dataToWrite)

  const existing = parseFilePaths(entry.filePath)
  const allPaths = [...existing, newFilePath]
  await db.update(timeEntry).set({ filePath: JSON.stringify(allPaths) }).where(eq(timeEntry.id, entryId))

  return { filePaths: allPaths }
})
