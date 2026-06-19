import { ensureDatabase, serviceFailure } from '@/lib/platform-db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    // Only allow unauthenticated init in development. In any other environment
    // an admin session is required, and the schema is never disclosed.
    if (process.env.NODE_ENV !== 'development') {
      const session = getSession(request)
      if (!session || session.role !== 'admin') {
        return Response.json(
          { ok: false, message: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    await ensureDatabase()

    return Response.json({ ok: true, message: 'Database initialized.' })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
