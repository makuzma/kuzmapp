import PDFDocument from 'pdfkit'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { projectBilling, companyInfo } from '../../../../drizzle/schema'

function formatDate(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`
}
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
function formatCurrency(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) return `– ${currency}`
  return `${amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

const MARGIN = 50
const PAGE_W = 595
const CONTENT_W = PAGE_W - MARGIN * 2  // 495

const PRIMARY  = '#3b82f6'
const DARK     = '#1f2937'
const GRAY     = '#6b7280'
const LIGHT    = '#f3f4f6'
const WHITE    = '#ffffff'
const LGRAY    = '#e5e7eb'

const COL_DATE = 70
const COL_DESC = 175
const COL_ANZ  = 45
const COL_ZEIT = 55
const COL_COST = CONTENT_W - COL_DATE - COL_DESC - COL_ANZ - COL_ZEIT  // 150

interface BillingEntry {
  date: string; description: string; anzahl: number | null
  duration: number; isAusfall: boolean
  cost: number | null; costType: string | null
}
interface BillingPhase {
  phaseName: string; entries: BillingEntry[]
  cost: number | null
  subcategoryExtras: Array<{ name: string; cost: number }> | null
}
interface BillingData {
  projectName: string; createdAt: string; currency: string
  customer: { name: string } | null
  customerAddress: { street: string | null; city: string | null; zip: string | null; country: string | null } | null
  contact: { name: string; position: string | null; email: string | null; phone: string | null } | null
  totalCost: number | null; phases: BillingPhase[]
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const [billing] = await db.select().from(projectBilling).where(eq(projectBilling.id, id))
  if (!billing) throw createError({ statusCode: 404 })

  const data = billing.data as BillingData
  const [company] = await db.select().from(companyInfo).limit(1)

  // Load logo if available (only JPEG and PNG are supported by PDFKit)
  let logoBuffer: Buffer | null = null
  if (company?.logoPath) {
    try {
      const filePath = join(process.cwd(), 'public', company.logoPath)
      const buf = await readFile(filePath)
      // Check magic bytes: PNG = 89 50 4E 47, JPEG = FF D8 FF
      const isPNG  = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47
      const isJPEG = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF
      if (isPNG || isJPEG) logoBuffer = buf
    } catch { /* file missing or unreadable */ }
  }

  const doc = new PDFDocument({ size: 'A4', margin: MARGIN, autoFirstPage: true })
  const chunks: Buffer[] = []

  await new Promise<void>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', resolve)
    doc.on('error', reject)

    // ── HEADER ──────────────────────────────────────────────────────────────
    // Fixed header height: 100pt regardless of content
    const HEADER_TOP = MARGIN
    const HEADER_H   = 100
    const LEFT_W     = 240
    const RIGHT_X    = MARGIN + CONTENT_W - 210

    // Logo (top-left, max 120×45)
    let leftTextY = HEADER_TOP
    if (logoBuffer) {
      doc.image(logoBuffer, MARGIN, HEADER_TOP, { fit: [120, 45] })
      leftTextY = HEADER_TOP + 50
    }

    // Company name
    doc.font('Helvetica-Bold').fontSize(14).fillColor(PRIMARY)
       .text(company?.name || '', MARGIN, leftTextY, { width: LEFT_W, lineBreak: true })
    leftTextY = doc.y + 3

    // Address lines (split by newline)
    const addrLines = (company?.address || '').split('\n').filter(Boolean)
    for (const line of addrLines) {
      doc.font('Helvetica').fontSize(9).fillColor(GRAY)
         .text(line, MARGIN, leftTextY, { width: LEFT_W })
      leftTextY = doc.y + 1
    }
    if (company?.phone) {
      doc.font('Helvetica').fontSize(9).fillColor(GRAY)
         .text(company.phone, MARGIN, leftTextY, { width: LEFT_W })
      leftTextY = doc.y + 1
    }
    if (company?.contactPerson) {
      doc.font('Helvetica').fontSize(9).fillColor(GRAY)
         .text(company.contactPerson, MARGIN, leftTextY, { width: LEFT_W })
    }

    // RIGHT: RECHNUNG title
    doc.font('Helvetica-Bold').fontSize(26).fillColor(DARK)
       .text('RECHNUNG', RIGHT_X, HEADER_TOP, { width: 210, align: 'right' })

    doc.font('Helvetica').fontSize(10).fillColor(GRAY)
       .text(formatDate(data.createdAt), RIGHT_X, HEADER_TOP + 34, { width: 210, align: 'right' })

    doc.font('Helvetica').fontSize(9).fillColor(GRAY)
       .text('Projekt', RIGHT_X, HEADER_TOP + 52, { width: 210, align: 'right' })

    doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK)
       .text(data.projectName || '–', RIGHT_X, HEADER_TOP + 64, { width: 210, align: 'right' })

    // ── DIVIDER ─────────────────────────────────────────────────────────────
    let y = HEADER_TOP + HEADER_H + 8
    doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y)
       .lineWidth(0.8).strokeColor(LGRAY).stroke()
    y += 16

    // ── AN BLOCK ────────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(GRAY)
       .text('AN', MARGIN, y)
    y = doc.y + 6

    if (data.customer) {
      doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK)
         .text(data.customer.name, MARGIN, y, { width: CONTENT_W / 2 })
      y = doc.y + 4
    }

    if (data.customerAddress) {
      const a = data.customerAddress
      if (a.street) {
        doc.font('Helvetica').fontSize(10).fillColor(DARK).text(a.street, MARGIN, y)
        y = doc.y + 2
      }
      const zipCity = [a.zip, a.city].filter(Boolean).join(' ')
      if (zipCity) {
        doc.font('Helvetica').fontSize(10).fillColor(DARK).text(zipCity, MARGIN, y)
        y = doc.y + 2
      }
      if (a.country) {
        doc.font('Helvetica').fontSize(10).fillColor(DARK).text(a.country, MARGIN, y)
        y = doc.y + 2
      }
    }

    if (data.contact) {
      const c = data.contact
      const label = [c.name, c.position].filter(Boolean).join(', ')
      doc.font('Helvetica').fontSize(10).fillColor(GRAY).text(label, MARGIN, y)
      y = doc.y + 2
      if (c.email) {
        doc.font('Helvetica').fontSize(10).fillColor(GRAY).text(c.email, MARGIN, y)
        y = doc.y + 2
      }
      if (c.phone) {
        doc.font('Helvetica').fontSize(10).fillColor(GRAY).text(c.phone, MARGIN, y)
        y = doc.y + 2
      }
    }

    y += 20

    // ── LEISTUNGSÜBERSICHT ───────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK)
       .text('Leistungsübersicht', MARGIN, y)
    y = doc.y + 12

    // ── PHASES ──────────────────────────────────────────────────────────────
    for (const phase of data.phases) {
      // Check for page overflow (need at least 60pt)
      if (y + 60 > 842 - MARGIN) { doc.addPage(); y = MARGIN }

      // Phase header bar
      doc.rect(MARGIN, y, CONTENT_W, 22).fill(LIGHT)
      doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK)
         .text(phase.phaseName, MARGIN + 8, y + 6, { width: CONTENT_W - 16 })
      y += 22

      // Column headers
      doc.font('Helvetica-Bold').fontSize(8).fillColor(GRAY)
      let cx = MARGIN
      doc.text('Datum',        cx, y + 4, { width: COL_DATE, align: 'left' });  cx += COL_DATE
      doc.text('Beschreibung', cx, y + 4, { width: COL_DESC, align: 'left' });  cx += COL_DESC
      doc.text('Anzahl',       cx, y + 4, { width: COL_ANZ,  align: 'right' }); cx += COL_ANZ
      doc.text('Zeit',         cx, y + 4, { width: COL_ZEIT, align: 'right' }); cx += COL_ZEIT
      doc.text('Betrag',       cx, y + 4, { width: COL_COST, align: 'right' })
      y += 16

      doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y)
         .lineWidth(0.5).strokeColor(LGRAY).stroke()
      y += 2

      // Entry rows
      let totalMin = 0
      for (let i = 0; i < phase.entries.length; i++) {
        const e = phase.entries[i]!
        if (y + 18 > 842 - MARGIN) { doc.addPage(); y = MARGIN }

        const ROW_H = 17
        doc.rect(MARGIN, y, CONTENT_W, ROW_H).fill(i % 2 === 0 ? WHITE : '#f9fafb')

        const tc = e.isAusfall ? '#9ca3af' : DARK
        const fn = e.isAusfall ? 'Helvetica-Oblique' : 'Helvetica'
        doc.font(fn).fontSize(8.5).fillColor(tc)

        cx = MARGIN
        doc.text(e.date || '–',                           cx, y + 4, { width: COL_DATE, align: 'left' });  cx += COL_DATE
        doc.text(e.description || '–',                    cx, y + 4, { width: COL_DESC - 4, align: 'left' }); cx += COL_DESC
        doc.text(e.isAusfall ? 'Ausfall' : String(e.anzahl ?? '–'), cx, y + 4, { width: COL_ANZ, align: 'right' }); cx += COL_ANZ
        doc.text(formatDuration(e.duration),              cx, y + 4, { width: COL_ZEIT, align: 'right' }); cx += COL_ZEIT

        let costStr = '–'
        if (e.costType === 'included') costStr = 'Im Pauschale'
        else if (e.cost !== null && e.cost !== undefined) costStr = formatCurrency(e.cost, data.currency)
        doc.text(costStr, cx, y + 4, { width: COL_COST, align: 'right' })

        totalMin += e.duration ?? 0
        y += ROW_H
      }

      // Subcategory extras
      if (phase.subcategoryExtras?.length) {
        y += 3
        for (const ex of phase.subcategoryExtras) {
          doc.font('Helvetica').fontSize(8).fillColor(GRAY)
             .text(`• ${ex.name}`, MARGIN + COL_DATE + COL_DESC, y, { width: COL_ANZ + COL_ZEIT, align: 'left' })
          doc.font('Helvetica').fontSize(8).fillColor(DARK)
             .text(formatCurrency(ex.cost, data.currency), MARGIN + COL_DATE + COL_DESC + COL_ANZ + COL_ZEIT, y, { width: COL_COST, align: 'right' })
          y += 13
        }
      }

      // Gesamt row
      y += 4
      doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y)
         .lineWidth(0.5).strokeColor('#d1d5db').stroke()
      y += 5

      cx = MARGIN
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(GRAY)
         .text('Gesamt', cx, y, { width: COL_DATE + COL_DESC, align: 'left' })
      cx += COL_DATE + COL_DESC + COL_ANZ
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(DARK)
         .text(formatDuration(totalMin), cx, y, { width: COL_ZEIT, align: 'right' })
      cx += COL_ZEIT
      if (phase.cost !== null && phase.cost !== undefined)
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(DARK)
           .text(formatCurrency(phase.cost, data.currency), cx, y, { width: COL_COST, align: 'right' })

      y += 22
    }

    // ── TOTAL BOX ───────────────────────────────────────────────────────────
    if (data.totalCost !== null && data.totalCost !== undefined) {
      y += 8
      const BOX_H = 52
      if (y + BOX_H > 842 - MARGIN) { doc.addPage(); y = MARGIN }

      doc.rect(MARGIN, y, CONTENT_W, BOX_H)
         .lineWidth(1.5).strokeColor(PRIMARY).stroke()

      // Subtle blue fill
      doc.rect(MARGIN, y, CONTENT_W, BOX_H)
         .fillOpacity(0.04).fillColor(PRIMARY).fill()
      doc.fillOpacity(1)

      doc.font('Helvetica-Bold').fontSize(11).fillColor(GRAY)
         .text('TOTAL', MARGIN + 18, y + 16)

      doc.font('Helvetica-Bold').fontSize(18).fillColor(DARK)
         .text(formatCurrency(data.totalCost, data.currency),
               MARGIN + 18, y + 13, { width: CONTENT_W - 36, align: 'right' })
    }

    doc.end()
  })

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `attachment; filename="rechnung-${id}.pdf"`)
  return Buffer.concat(chunks)
})
