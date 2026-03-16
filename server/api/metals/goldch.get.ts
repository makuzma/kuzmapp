import { auth } from '../../lib/auth'

let cache: { data: any[]; ts: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

function parseTables(html: string) {
  const results: any[] = []

  // Find all tables with their nearest preceding header
  const tableRegex = /<table[^>]*>(.*?)<\/table>/gs
  const tables: { start: number; content: string }[] = []
  for (const m of html.matchAll(tableRegex)) {
    tables.push({ start: m.index!, content: m[1] })
  }

  // Label each table by looking backwards for h2/h3
  const metalLabels = ['Goldbarren', 'Goldmünzen', 'Silbermünzen']
  const metalKeys = ['gold', 'gold', 'silver']

  tables.forEach((table, i) => {
    const metalKey = metalKeys[i] ?? 'gold'
    const sectionLabel = metalLabels[i] ?? 'Unknown'

    const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gs
    for (const row of table.content.matchAll(rowRegex)) {
      let clean = row[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&thinsp;/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      const stripped = clean.replace(/^[">]+\s*/, '')
      const m = stripped.match(/^(.+?)\s+ab\s+CHF\s*([\d'.]+)\s+([+-][\d.]+%)\s+bis\s+CHF\s*([\d'.]+)\s+([+-][\d.]+%)/)
      if (!m) continue

      const parseCHF = (s: string) => parseFloat(s.replace(/'/g, '').replace(',', '.'))

      results.push({
        label: m[1].trim(),
        section: sectionLabel,
        metal: metalKey,
        cheapest: parseCHF(m[2]),   // Kaufpreis (ab = teuerste was du bezahlst)
        cheapestChange: m[3],
        expensive: parseCHF(m[4]),  // Ankauf (bis = was Händler zahlen)
        expensiveChange: m[5],
        currency: 'CHF',
      })
    }
  })

  return results
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data

  const html = await $fetch<string>('https://www.gold.ch', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'de-CH,de;q=0.9',
    },
    parseResponse: (txt) => txt,
  })

  const data = parseTables(html)
  cache = { data, ts: Date.now() }
  return data
})
