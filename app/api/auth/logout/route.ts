import { serviceFailure } from '@/lib/platform-db'
import { clearSessionCookie } from '@/lib/auth'

export async function POST() {
  try {
    const headers = new Headers()
    headers.append('set-cookie', clearSessionCookie())
    return Response.json({ ok: true, message: 'Signed out.' }, { headers })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
