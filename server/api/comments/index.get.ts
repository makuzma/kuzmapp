import { eq, and } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../lib/db'
import { appComment } from '../../../drizzle/schema'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({ headers: event.headers })
    if (!session) throw createError({ statusCode: 401 })

    const query = getQuery(event)
    const targetType = query.targetType as string
    const targetId = query.targetId as string

    if (!targetType || !targetId) {
        throw createError({ statusCode: 400, message: 'Missing targetType or targetId' })
    }

    const comments = await db.query.appComment.findMany({
        where: and(
            eq(appComment.targetType, targetType),
            eq(appComment.targetId, targetId)
        ),
        orderBy: (comments, { asc }) => [asc(comments.createdAt)]
    })

    return comments
})
