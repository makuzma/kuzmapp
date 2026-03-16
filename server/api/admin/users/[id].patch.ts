import { eq } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { user, account, userRole, userGroup } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })
  if (!isSuperAdmin(session.user.email)) throw createError({ statusCode: 403 })

  const id = getRouterParam(event, 'id')!
  const { firstName, lastName, email, password, roleIds, groupIds } = await readBody(event)

  const updates: Record<string, any> = {}
  if (firstName !== undefined) updates.firstName = firstName || null
  if (lastName !== undefined) updates.lastName = lastName || null
  if (email?.trim()) updates.email = email.trim()
  if (firstName !== undefined || lastName !== undefined) {
    const fn = firstName?.trim() ?? ''
    const ln = lastName?.trim() ?? ''
    updates.name = [fn, ln].filter(Boolean).join(' ') || email?.trim() || ''
  }

  if (Object.keys(updates).length > 0) {
    await db.update(user).set(updates).where(eq(user.id, id))
  }

  if (password?.trim()) {
    const hashed = await hashPassword(password.trim())
    await db.update(account)
      .set({ password: hashed })
      .where(eq(account.userId, id))
  }

  if (roleIds !== undefined) {
    await db.delete(userRole).where(eq(userRole.userId, id))
    if (roleIds.length > 0) {
      await db.insert(userRole).values(roleIds.map((roleId: string) => ({ userId: id, roleId })))
    }
  }

  if (groupIds !== undefined) {
    await db.delete(userGroup).where(eq(userGroup.userId, id))
    if (groupIds.length > 0) {
      await db.insert(userGroup).values(groupIds.map((groupId: string) => ({ userId: id, groupId })))
    }
  }

  const [updated] = await db.select().from(user).where(eq(user.id, id))
  await logActivity(session.user.id, 'user.update', { target: id })
  return updated
})
