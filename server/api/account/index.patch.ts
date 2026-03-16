import { eq } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { user, account } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const { firstName, lastName, email, password, calendarColor, notificationPages } = await readBody(event)
  const id = session.user.id

  const updates: Record<string, any> = {}
  if (calendarColor?.trim()) updates.calendarColor = calendarColor.trim()
  if (Array.isArray(notificationPages)) updates.notificationPages = notificationPages
  if (firstName !== undefined) updates.firstName = firstName || null
  if (lastName !== undefined) updates.lastName = lastName || null
  if (email?.trim()) updates.email = email.trim()
  if (firstName !== undefined || lastName !== undefined) {
    const fn = firstName?.trim() ?? ''
    const ln = lastName?.trim() ?? ''
    updates.name = [fn, ln].filter(Boolean).join(' ') || email?.trim() || session.user.name
  }

  if (Object.keys(updates).length > 0) {
    await db.update(user).set(updates).where(eq(user.id, id))
  }

  if (password?.trim()) {
    const hashed = await hashPassword(password.trim())
    await db.update(account).set({ password: hashed }).where(eq(account.userId, id))
  }

  const [updated] = await db.select().from(user).where(eq(user.id, id))
  await logActivity(id, 'profile.update')
  return updated
})
