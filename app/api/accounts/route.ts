import { asText, runStatement, serviceFailure } from '@/lib/platform-db'
import { getSession, hashPassword } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = getSession(request)
    if (!session) {
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Identity comes from the session, never from the query string. PINs are
    // never returned to the client.
    const result = await runStatement(
      `SELECT a.id, a.user_id, a.account_number, a.account_name, a.balance,
              u.username, u.full_name
       FROM accounts a
       JOIN users u ON u.id = a.user_id
       WHERE a.user_id = $1
       ORDER BY a.id`,
      [session.userId]
    )

    return Response.json({
      ok: true,
      note: 'Account list prepared.',
      accounts: result.rows
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function POST(request: Request) {
  try {
    const session = getSession(request)
    if (!session) {
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const accountNumber = asText(body.accountNumber).trim()
    const accountName = asText(body.accountName).trim()
    const pin = asText(body.pin).trim() || '0000'

    if (!/^\d{8,20}$/.test(accountNumber)) {
      return Response.json(
        { ok: false, message: 'Account number must be 8 to 20 digits.' },
        { status: 400 }
      )
    }
    if (accountName.length < 2) {
      return Response.json(
        { ok: false, message: 'Account name must be at least 2 characters.' },
        { status: 400 }
      )
    }

    const exists = await runStatement(
      'SELECT 1 FROM accounts WHERE account_number = $1 LIMIT 1',
      [accountNumber]
    )
    if (exists.rowCount && exists.rowCount > 0) {
      return Response.json(
        { ok: false, message: 'That account number is already in use.' },
        { status: 409 }
      )
    }

    // The new account always belongs to the session user — never trust input.
    const result = await runStatement(
      `INSERT INTO accounts (user_id, account_number, account_name, balance, pin)
       VALUES ($1, $2, $3, 0, $4)
       RETURNING id, user_id, account_number, account_name, balance`,
      [session.userId, accountNumber, accountName, await hashPassword(pin)]
    )

    return Response.json({ ok: true, account: result.rows[0] })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
