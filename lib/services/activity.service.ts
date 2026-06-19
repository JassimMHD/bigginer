import * as ActivityModel from '@/lib/models/activity.model'
import type { EventType } from '@/lib/activity'

export async function log(
  userId: number | null,
  eventType: EventType,
  description: string,
  metadata: Record<string, unknown>,
  clientInfo: { ip: string; userAgent: string; deviceType: string }
) {
  try {
    await ActivityModel.create(
      userId,
      eventType,
      description,
      metadata,
      clientInfo.ip,
      clientInfo.userAgent,
      clientInfo.deviceType
    )
  } catch (err) {
    console.error('[activity-log]', err)
  }
}

export async function getActivity(userId: number, limit: number, offset: number) {
  const [activities, total] = await Promise.all([
    ActivityModel.findByUserId(userId, limit, offset),
    ActivityModel.countByUserId(userId)
  ])
  return { activities, total }
}
