import { desc, eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { timeEntry, timePhase, timeEntryCategory, user } from '../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const editor = alias(user, 'editor')

  return db
    .select({
      id: timeEntry.id,
      phaseId: timeEntry.phaseId,
      phaseName: timePhase.name,
      userId: timeEntry.userId,
      userName: user.name,
      lastEditedByUserId: timeEntry.lastEditedByUserId,
      lastEditedByUserName: editor.name,
      categoryId: timeEntry.categoryId,
      categoryName: timeEntryCategory.name,
      date: timeEntry.date,
      description: timeEntry.description,
      anzahl: timeEntry.anzahl,
      duration: timeEntry.duration,
      subcategoryIds: timeEntry.subcategoryIds,
      filePath: timeEntry.filePath,
      createdAt: timeEntry.createdAt,
    })
    .from(timeEntry)
    .leftJoin(timePhase, eq(timeEntry.phaseId, timePhase.id))
    .leftJoin(timeEntryCategory, eq(timeEntry.categoryId, timeEntryCategory.id))
    .leftJoin(user, eq(timeEntry.userId, user.id))
    .leftJoin(editor, eq(timeEntry.lastEditedByUserId, editor.id))
    .where(eq(timeEntry.projectId, id))
    .orderBy(desc(timeEntry.date), desc(timeEntry.createdAt))
})
