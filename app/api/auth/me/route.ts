import { runStatement, serviceFailure } from '@/lib/platform-db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = getSession(request)
    if (!session) {
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await runStatement(
      'SELECT id, username, role, full_name, email FROM users WHERE id = $1 LIMIT 1',
      [session.userId]
    )
    const user = result.rows[0]
    if (!user) {
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    return Response.json({ ok: true, user })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
