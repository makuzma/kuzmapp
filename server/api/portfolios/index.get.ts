import { eq, and } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { portfolio, stockWatchlist, metalHolding } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const portfolios = await db
    .select()
    .from(portfolio)
    .where(eq(portfolio.userId, session.user.id))
    .orderBy(portfolio.sortOrder, portfolio.createdAt)

  // Count items per portfolio
  const stocks = await db
    .select({ id: stockWatchlist.id, portfolioId: stockWatchlist.portfolioId })
    .from(stockWatchlist)
    .where(eq(stockWatchlist.userId, session.user.id))

  const metals = await db
    .select({ id: metalHolding.id, portfolioId: metalHolding.portfolioId })
    .from(metalHolding)
    .where(eq(metalHolding.userId, session.user.id))

  return portfolios.map(p => ({
    ...p,
    stockCount: stocks.filter(s => s.portfolioId === p.id).length,
    metalCount: metals.filter(m => m.portfolioId === p.id).length,
  }))
})
