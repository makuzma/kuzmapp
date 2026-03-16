import { randomUUID } from 'crypto'
import { db } from '../lib/db'
import { activityLog } from '../../drizzle/schema'

export async function logActivity(
  userId: string,
  action: string,
  options?: { target?: string; meta?: Record<string, any> },
) {
  try {
    await db.insert(activityLog).values({
      id: randomUUID(),
      userId,
      action,
      target: options?.target ?? null,
      meta: options?.meta ?? null,
    })
  } catch {
    // never block the main operation
  }
}
