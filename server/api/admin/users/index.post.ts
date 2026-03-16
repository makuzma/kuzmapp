import { eq } from 'drizzle-orm'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { user } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })
  if (!isSuperAdmin(session.user.email)) throw createError({ statusCode: 403 })

  const { firstName, lastName, email, password } = await readBody(event)

  if (!email?.trim()) throw createError({ statusCode: 400, message: 'E-Mail ist erforderlich' })
  if (!password?.trim()) throw createError({ statusCode: 400, message: 'Passwort ist erforderlich' })

  const name = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ') || email

  const result = await auth.api.signUpEmail({
    body: { email: email.trim(), password, name, firstName, lastName },
  })

  // Mark email as verified since admin created this account
  await db.update(user).set({ emailVerified: true }).where(eq(user.email, email.trim()))

  await logActivity(session.user.id, 'user.create', { meta: { email: email.trim(), name } })

  return result
})
