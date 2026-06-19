import { asText, runStatement, serviceFailure } from '@/lib/platform-db'
import { getSession } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = getSession(request)
    if (!session) {
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const accountId = Number(id)
    if (!Number.isInteger(accountId)) {
      return Response.json(
        { ok: false, message: 'Invalid account id.' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const accountName = asText(body.accountName).trim()
    if (accountName.length < 2) {
      return Response.json(
        { ok: false, message: 'Account name must be at least 2 characters.' },
        { status: 400 }
      )
    }

    // Scope the update to the session user — rowCount 0 means not theirs.
    const result = await runStatement(
      `UPDATE accounts SET account_name = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, user_id, account_number, account_name, balance`,
      [accountName, accountId, session.userId]
    )
    if (result.rowCount === 0) {
      return Response.json(
        { ok: false, message: 'Account not found.' },
        { status: 404 }
      )
    }

    return Response.json({ ok: true, account: result.rows[0] })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = getSession(request)
    if (!session) {
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const accountId = Number(id)
    if (!Number.isInteger(accountId)) {
      return Response.json(
        { ok: false, message: 'Invalid account id.' },
        { status: 400 }
      )
    }

    const result = await runStatement(
      'DELETE FROM accounts WHERE id = $1 AND user_id = $2',
      [accountId, session.userId]
    )
    if (result.rowCount === 0) {
      return Response.json(
        { ok: false, message: 'Account not found.' },
        { status: 404 }
      )
    }

    return Response.json({ ok: true, message: 'Account deleted.' })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
