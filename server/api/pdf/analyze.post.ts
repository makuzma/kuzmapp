import { createRequire } from 'module'
import { auth } from '../../lib/auth'

const require = createRequire(import.meta.url)

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const formData = await readFormData(event)
  const file = formData.get('file') as File | null
  if (!file) throw createError({ statusCode: 400, message: 'Keine Datei übergeben' })

  const buffer = Buffer.from(await file.arrayBuffer())
  const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
  const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')

  if (!isPdf && !isDocx) throw createError({ statusCode: 400, message: 'Nur PDF und DOCX werden unterstützt' })

  let rawText = ''
  let pageCount = 1
  let docInfo: Record<string, any> = {}

  if (isPdf) {
    const mod = require('pdf-parse')
    const pdfParse = (typeof mod === 'function' ? mod : mod.default) as (buf: Buffer) => Promise<{
      text: string
      numpages: number
      info: Record<string, any>
      metadata: any
    }>
    const parsed = await pdfParse(buffer)
    rawText = parsed.text
    pageCount = parsed.numpages
    docInfo = parsed.info ?? {}
  } else {
    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    rawText = result.value
  }

  // --- Extract publishing metadata ---
  const info = docInfo
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  function findAfterLabel(labels: string[], text: string): string | null {
    for (const label of labels) {
      const re = new RegExp(`${label}[:\\s]*([^\\n]{2,80})`, 'i')
      const m = text.match(re)
      if (m) return m[1].trim()
    }
    return null
  }

  // Autor (Author)
  let autor: string | null = info.Author?.trim() || null
  if (!autor) autor = findAfterLabel(['Autor', 'Autorin', 'Autoren', 'Verfasser', 'Author', 'Von', 'Herausgegeben von', 'Hrsg\\.?\\s*von'], rawText)

  // Verlag (Publisher)
  let verlag: string | null = info.Creator?.trim() || null
  if (!verlag) verlag = findAfterLabel(['Verlag', 'Publisher', 'Herausgeber'], rawText)

  // Programmhalbjahr (Program half-year)
  const halbjahr = findAfterLabel(['Programmhalbjahr', 'Halbjahr', 'Programm'], rawText)
  let programmhalbjahr: string | null = halbjahr
  if (!programmhalbjahr) {
    const hjRe = /(?:Frühjahr|Frühling|Herbst|Winter|Sommer|Spring|Summer|Fall|Autumn)\s*(?:\/\s*(?:Sommer|Winter|Herbst|Frühjahr))?\s*\d{4}/gi
    const hjMatch = rawText.match(hjRe)
    if (hjMatch) programmhalbjahr = hjMatch[0].trim()
  }

  // Programmbereich (Program area)
  const programmbereich = findAfterLabel(['Programmbereich', 'Bereich', 'Sparte', 'Kategorie', 'Segment'], rawText)

  // Sachgruppe (Subject group)
  const sachgruppe = findAfterLabel(['Sachgruppe', 'Warengruppe', 'WG', 'Thema', 'Genre', 'Subject'], rawText)

  // ISBN: covers ISBN-10 and ISBN-13 with/without hyphens
  const isbnRegex = /(?:ISBN[-\s]?(?:1[03])?[-:\s]?)?(?:97[89][-\s]?)?\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?[\dX]/gi
  const isbnRaw = rawText.match(isbnRegex) ?? []
  const isbns = [...new Set(
    isbnRaw
      .map(s => s.replace(/\s/g, ''))
      .filter(s => {
        const digits = s.replace(/[^0-9X]/gi, '')
        return digits.length === 10 || digits.length === 13
      })
  )]

  // Format (book dimensions)
  let format: string | null = findAfterLabel(['Format', 'Maße', 'Größe', 'Abmessung'], rawText)
  if (!format) {
    const fmtRe = /\d{1,3}(?:[.,]\d)?\s*[x×]\s*\d{1,3}(?:[.,]\d)?\s*(?:cm|mm)/i
    const fmtMatch = rawText.match(fmtRe)
    if (fmtMatch) format = fmtMatch[0].trim()
  }

  // Einband (binding type)
  let einband: string | null = findAfterLabel(['Einband', 'Bindung', 'Ausstattung', 'Einbandart'], rawText)
  if (!einband) {
    const einbandRe = /\b(Hardcover|Taschenbuch|Kartoniert|Gebunden|Broschiert|Paperback|Softcover|Leinenband|Pappband|Ringbindung|Spiralbindung)\b/i
    const einbandMatch = rawText.match(einbandRe)
    if (einbandMatch) einband = einbandMatch[0].trim()
  }

  // --- Text cleaning ---
  const text = rawText.replace(/\s+/g, ' ').trim()

  // --- Tokenize into words ---
  const stopWords = new Set([
    'der','die','das','ein','eine','und','oder','in','zu','von','mit','auf','für','an','im',
    'ist','sind','wird','werden','hat','haben','war','waren','nicht','auch','als','bei',
    'aus','nach','wie','durch','so','über','aber','wenn','sich','des','dem','den','einer',
    'einem','einer','es','er','sie','wir','ihr','sie','ich','du','man','can','the','and',
    'of','to','in','is','for','on','that','this','with','are','from','by','an','be','as',
    'at','or','but','it','not','was','we','he','she','they','his','her','their','our',
    'you','have','has','had','will','would','could','should','may','might','do','does',
    'did','been','being','than','then','so','if','when','what','which','who','how','all',
    'its','a','i','s','t','re','ve','ll','d','m',
  ])

  function tokenize(str: string): string[] {
    return str
      .toLowerCase()
      .replace(/[^a-züäöß\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
  }

  // --- Split into sentences ---
  const sentences = rawText.match(/[^.!?]+[.!?]+/g) ?? [rawText]

  // --- TF-IDF ---
  // Treat each sentence as a "document"
  const docs = sentences.map(s => tokenize(s))
  const vocab = new Map<string, number>()

  for (const doc of docs) {
    const seen = new Set(doc)
    for (const word of seen) {
      vocab.set(word, (vocab.get(word) ?? 0) + 1)
    }
  }

  const N = docs.length
  function idf(word: string): number {
    const df = vocab.get(word) ?? 1
    return Math.log((N + 1) / (df + 1)) + 1
  }

  // Global TF across full document
  const allWords = tokenize(text)
  const totalWords = allWords.length
  const termCount = new Map<string, number>()
  for (const w of allWords) {
    termCount.set(w, (termCount.get(w) ?? 0) + 1)
  }

  const tfidfScores = new Map<string, number>()
  for (const [word, count] of termCount) {
    const tf = count / totalWords
    tfidfScores.set(word, tf * idf(word))
  }

  const topKeywords = [...tfidfScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word, score]) => ({ word, score: Math.round(score * 10000) / 10000, count: termCount.get(word) ?? 0 }))

  // --- Key sentences: score by sum of TF-IDF of words in sentence ---
  const scoredSentences = sentences
    .map(sentence => {
      const words = tokenize(sentence)
      if (words.length < 4) return { sentence: sentence.trim(), score: 0 }
      const score = words.reduce((s, w) => s + (tfidfScores.get(w) ?? 0), 0) / words.length
      return { sentence: sentence.trim(), score }
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.sentence)

  // --- Stats ---
  const wordCount = allWords.length
  const uniqueWords = new Set(allWords).size
  const sentenceCount = sentences.length
  // pageCount already set above (PDF: from parser, DOCX: 1)

  return {
    extracted: { autor, verlag, programmhalbjahr, programmbereich, sachgruppe, isbns, format, einband },
    meta: { pageCount, wordCount, uniqueWords, sentenceCount, fileName: file.name },
    topKeywords,
    keySentences: scoredSentences,
    fullText: text.slice(0, 5000),
  }
})
