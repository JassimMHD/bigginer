import { asText, ensureDatabase, pool, serviceFailure } from '@/lib/platform-db'
import { getSession } from '@/lib/auth'

const MAX_AMOUNT = 1_000_000

export async function POST(request: Request) {
  try {
    const session = getSession(request)
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const fromAccount = asText(body.fromAccount || body.from)
    const toAccount = asText(body.toAccount || body.to)
    const description = asText(body.description)
    const amount = Number(body.amount)

    // --- Validate ---------------------------------------------------------
    if (!fromAccount || !toAccount) {
      return Response.json(
        { ok: false, message: 'Source and destination accounts are required.' },
        { status: 400 }
      )
    }
    if (fromAccount === toAccount) {
      return Response.json(
        { ok: false, message: 'Cannot transfer to the same account.' },
        { status: 400 }
      )
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
      return Response.json(
        { ok: false, message: 'Enter a valid positive amount.' },
        { status: 400 }
      )
    }
    // Reject more than 2 decimal places.
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

      // Debit only if the source account belongs to the session user and has
      // sufficient funds. rowCount === 0 means not owner or insufficient funds.
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

      const credit = await client.query(
        `UPDATE accounts SET balance = balance + $1 WHERE account_number = $2`,
        [amount, toAccount]
      )
      if (credit.rowCount === 0) {
        await client.query('ROLLBACK')
        return Response.json(
          { ok: false, message: 'Destination account not found.' },
          { status: 400 }
        )
      }

      const inserted = await client.query(
        `INSERT INTO transactions (from_account, to_account, amount, description, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, from_account, to_account, amount, description, status, created_at`,
        [fromAccount, toAccount, amount, description, session.userId]
      )

      await client.query('COMMIT')

      return Response.json({
        ok: true,
        message: 'Transfer accepted.',
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
