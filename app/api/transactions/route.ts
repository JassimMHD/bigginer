import { asText, runStatement, serviceFailure } from '@/lib/platform-db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = getSession(request)
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const account = asText(searchParams.get('account'))
    if (!account) {
      return Response.json(
        { ok: false, message: 'account is required.' },
        { status: 400 }
      )
    }

    // Verify the requested account belongs to the session user.
    const owns = await runStatement(
      `SELECT 1 FROM accounts WHERE account_number = $1 AND user_id = $2 LIMIT 1`,
      [account, session.userId]
    )
    if (owns.rowCount === 0) {
      return Response.json({ ok: false, message: 'Forbidden' }, { status: 403 })
    }

    const result = await runStatement(
      `SELECT id, from_account, to_account, amount, description, status, created_at
       FROM transactions
       WHERE from_account = $1 OR to_account = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [account]
    )

    return Response.json({ ok: true, account, transactions: result.rows })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
