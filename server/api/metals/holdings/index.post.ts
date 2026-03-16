import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { metalHolding } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { metalKey, coinType, quantity, unit, purchaseDate, purchasePricePerOz, purchaseCurrency, portfolioId } = await readBody(event)

  if (!metalKey || !quantity || !unit) throw createError({ statusCode: 400, message: 'Pflichtfelder fehlen' })

  const id = crypto.randomUUID()
  await db.insert(metalHolding).values({
    id,
    userId: session.user.id,
    metalKey,
    coinType: coinType ?? '',
    quantity: Number(quantity),
    unit,
    purchaseDate: purchaseDate || null,
    purchasePricePerOz: purchasePricePerOz ? Number(purchasePricePerOz) : null,
    purchaseCurrency: purchaseCurrency ?? 'CHF',
    portfolioId: portfolioId ?? null,
  })

  return { id }
})
