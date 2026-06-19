import { asText, ensureDatabase, pool, serviceFailure } from '@/lib/platform-db'
import { getSession } from '@/lib/auth'

const MAX_AMOUNT = 1_000_000

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
    const fromAccount = asText(body.fromAccount).trim()
    const biller = asText(body.biller).trim()
    const billId = asText(body.billId).trim()
    const amount = Number(body.amount)

    // --- Validate ---------------------------------------------------------
    if (!fromAccount) {
      return Response.json(
        { ok: false, message: 'Source account is required.' },
        { status: 400 }
      )
    }
    if (!biller) {
      return Response.json(
        { ok: false, message: 'Biller is required.' },
        { status: 400 }
      )
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
      return Response.json(
        { ok: false, message: 'Enter a valid positive amount.' },
        { status: 400 }
      )
    }
    if (Math.round(amount * 100) !== amount * 100) {
      return Response.json(
        { ok: false, message: 'Amount can have at most 2 decimal places.' },
        { status: 400 }
      )
    }

    await ensureDatabase()
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Debit the bill amount only if the account is the session user's and
      // has sufficient funds.
      const debit = await client.query(
        `UPDATE accounts
         SET balance = balance - $1
         WHERE account_number = $2 AND user_id = $3 AND balance >= $1`,
        [amount, fromAccount, session.userId]
      )
      if (debit.rowCount === 0) {
        await client.query('ROLLBACK')
        return Response.json(
          { ok: false, message: 'Insufficient funds or account not owned.' },
          { status: 400 }
        )
      }

      const description = billId ? `${biller} bill ${billId}` : `${biller} bill`
      const inserted = await client.query(
        `INSERT INTO transactions (from_account, to_account, amount, description, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, from_account, to_account, amount, description, status, created_at`,
        [fromAccount, biller, amount, description, session.userId]
      )

      await client.query('COMMIT')

      return Response.json({
        ok: true,
        message: 'Payment accepted.',
        transaction: inserted.rows[0]
      })
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
