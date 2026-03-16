import { randomUUID } from 'crypto'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { appComment } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({ headers: event.headers })
    if (!session) throw createError({ statusCode: 401 })

    const body = await readBody(event)
    if (!body.targetType || !body.targetId || !body.text) {
        throw createError({ statusCode: 400, message: 'Missing targetType, targetId, or text' })
    }

    const [comment] = await db.insert(appComment).values({
        id: randomUUID(),
        targetType: String(body.targetType),
        targetId: String(body.targetId),
        subject: String(body.subject ?? '').trim(),
        text: String(body.text).trim(),
        authorName: session.user.name,
        userId: session.user.id,
        replyToId: body.replyToId ? String(body.replyToId) : null,
    }).returning()

    return comment
})
