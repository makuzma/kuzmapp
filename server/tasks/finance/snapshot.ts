import { and, eq } from 'drizzle-orm'
import { generateId } from 'better-auth'
import { db } from '../../lib/db'
import { user, portfolioSnapshot } from '../../../drizzle/schema'
import { computePortfolioSnapshot } from '../../utils/finance/computePortfolioSnapshot'

export default defineTask({
  meta: {
    name: 'finance:snapshot',
    description: 'Daily portfolio snapshot — speichert alle Portfoliowerte als JSON in der DB',
  },
  async run() {
    const users = await db.select({ id: user.id }).from(user)
    const date = new Date().toISOString().slice(0, 10)

    for (const u of users) {
      const data = await computePortfolioSnapshot(u.id)

      const existing = await db
        .select({ id: portfolioSnapshot.id })
        .from(portfolioSnapshot)
        .where(and(eq(portfolioSnapshot.userId, u.id), eq(portfolioSnapshot.date, date)))
        .limit(1)

      if (existing[0]) {
        await db.update(portfolioSnapshot)
          .set({ data, createdAt: new Date() })
          .where(eq(portfolioSnapshot.id, existing[0].id))
      } else {
        await db.insert(portfolioSnapshot).values({
          id: generateId(),
          userId: u.id,
          date,
          data,
          createdAt: new Date(),
        })
      }
    }

    return { result: 'ok', users: users.length, date }
  },
})
