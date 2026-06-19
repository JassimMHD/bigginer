import { asText, ensureDatabase, pool, serviceFailure } from '@/lib/platform-db'
import { createSession, hashPassword, sessionCookie } from '@/lib/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const accountNumber = asText(body.accountNumber).trim()
    const accountName = asText(body.accountName).trim()
    const branch = asText(body.branch).trim()
    const email = asText(body.email).trim()
    const password = asText(body.password)

    // --- Validate ---------------------------------------------------------
    if (!accountName || !email || !password) {
      return Response.json(
        {
          ok: false,
          message: 'Account name, email and password are required.'
        },
        { status: 400 }
      )
    }
    if (!EMAIL_RE.test(email)) {
      return Response.json(
        { ok: false, message: 'Enter a valid email address.' },
        { status: 400 }
      )
    }
    if (password.length < 6) {
      return Response.json(
        { ok: false, message: 'Password must be at least 6 characters.' },
        { status: 400 }
      )
    }
    if (accountNumber && !/^\d{8,20}$/.test(accountNumber)) {
      return Response.json(
        { ok: false, message: 'Account number must be 8 to 20 digits.' },
        { status: 400 }
      )
    }

    // Username is the email — guaranteed unique and used to sign in.
    const username = email.toLowerCase()
    const passwordHash = await hashPassword(password)

    await ensureDatabase()
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const existing = await client.query(
        'SELECT 1 FROM users WHERE username = $1 LIMIT 1',
        [username]
      )
      if (existing.rowCount && existing.rowCount > 0) {
        await client.query('ROLLBACK')
        return Response.json(
          { ok: false, message: 'An account with this email already exists.' },
          { status: 409 }
        )
      }

      const userResult = await client.query(
        `INSERT INTO users (username, password, role, full_name, email)
         VALUES ($1, $2, 'customer', $3, $4)
         RETURNING id, username, role, full_name, email`,
        [username, passwordHash, accountName, email]
      )
      const user = userResult.rows[0]

      // Optionally open a starter account for the new customer.
      if (accountNumber) {
        const taken = await client.query(
          'SELECT 1 FROM accounts WHERE account_number = $1 LIMIT 1',
          [accountNumber]
        )
        if (taken.rowCount && taken.rowCount > 0) {
          await client.query('ROLLBACK')
          return Response.json(
            { ok: false, message: 'That account number is already in use.' },
            { status: 409 }
          )
        }
        await client.query(
          `INSERT INTO accounts (user_id, account_number, account_name, balance, pin)
           VALUES ($1, $2, $3, 0, $4)`,
          [
            user.id,
            accountNumber,
            branch || accountName,
            await hashPassword('0000')
          ]
        )
      }

      await client.query('COMMIT')

      const token = createSession(user.id, user.role)
      const headers = new Headers()
      headers.append('set-cookie', sessionCookie(token))

      return Response.json({ ok: true, user }, { headers })
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {})
      throw err
    } finally {
      client.release()
    }
  } catch (reason) {
    return serviceFailure(reason)
  }
}
