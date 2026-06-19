import { runStatement } from '@/lib/platform-db'
import type { EventType } from '@/lib/activity'

export async function create(
  userId: number | null,
  eventType: EventType,
  description: string,
  metadata: Record<string, unknown>,
  ip: string,
  userAgent: string,
  deviceType: string
) {
  await runStatement(
    `INSERT INTO activity_logs
       (user_id, event_type, description, metadata, ip_address, user_agent, device_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, eventType, description, JSON.stringify(metadata), ip, userAgent, deviceType]
  )
}

export async function findByUserId(userId: number, limit: number, offset: number) {
  const result = await runStatement(
    `SELECT id, event_type, description, metadata, ip_address, device_type, created_at
     FROM activity_logs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  )
  return result.rows
}

export async function countByUserId(userId: number) {
  const result = await runStatement(
    'SELECT COUNT(*)::int AS total FROM activity_logs WHERE user_id = $1',
    [userId]
  )
  return result.rows[0]?.total ?? 0
}
