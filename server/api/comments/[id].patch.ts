import { eq, and } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { appComment } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({ headers: event.headers })
    if (!session) throw createError({ statusCode: 401 })

    const id = getRouterParam(event, 'id')!
    const body = await readBody(event)

    const [comment] = await db.select().from(appComment).where(eq(appComment.id, id))
    if (!comment) throw createError({ statusCode: 404, message: 'Comment not found' })

    if (comment.userId !== session.user.id) {
        throw createError({ statusCode: 403, message: 'Forbidden' })
    }

    const [updated] = await db.update(appComment)
        .set({
            subject: body.subject !== undefined ? String(body.subject).trim() : comment.subject,
            text: body.text !== undefined ? String(body.text).trim() : comment.text,
            updatedAt: new Date()
        })
        .where(eq(appComment.id, id))
        .returning()

    return updated
})
