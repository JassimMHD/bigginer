import { runStatement } from '@/lib/platform-db'
import type { NextRequest } from 'next/server'

export type EventType =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'SIGNUP'
  | 'PASSWORD_RESET'
  | 'TRANSFER'
  | 'PAY_BILL'
  | 'VIEW_STATEMENT'
  | 'ADD_ACCOUNT'
  | 'DELETE_ACCOUNT'

export function extractClientInfo(req: Request | NextRequest) {
  const headers = req.headers
  const ip =
    (headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  const userAgent = headers.get('user-agent') ?? 'unknown'
  const deviceType = /mobile|android|iphone|ipad/i.test(userAgent)
    ? 'mobile'
    : /tablet/i.test(userAgent)
      ? 'tablet'
      : 'desktop'
  return { ip, userAgent, deviceType }
}

export async function logActivity(
  userId: number | null,
  eventType: EventType,
  description: string,
  metadata: Record<string, unknown>,
  clientInfo: { ip: string; userAgent: string; deviceType: string }
) {
  try {
    await runStatement(
      `INSERT INTO activity_logs
         (user_id, event_type, description, metadata, ip_address, user_agent, device_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        eventType,
        description,
        JSON.stringify(metadata),
        clientInfo.ip,
        clientInfo.userAgent,
        clientInfo.deviceType,
      ]
    )
  } catch (err) {
    console.error('[activity-log]', err)
  }
}
