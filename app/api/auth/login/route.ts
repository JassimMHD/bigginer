import { asText, runStatement, serviceFailure } from '@/lib/platform-db'
import { createSession, sessionCookie, verifyPassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const username = asText(body.username)
    const password = asText(body.password)

    const result = await runStatement(
      `SELECT id, username, password, role, full_name, email
       FROM users
       WHERE username = $1
       LIMIT 1`,
      [username]
    )

    const row = result.rows[0]
    const passwordOk = row
      ? await verifyPassword(password, row.password)
      : false

    if (!row || !passwordOk) {
      return Response.json(
        { ok: false, message: 'Invalid username or password.' },
        { status: 401 }
      )
    }

    const user = {
      id: row.id,
      username: row.username,
      role: row.role,
      full_name: row.full_name,
      email: row.email
    }

    const token = createSession(user.id, user.role)
    const headers = new Headers()
    headers.append('set-cookie', sessionCookie(token))

    return Response.json({ ok: true, user }, { headers })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
