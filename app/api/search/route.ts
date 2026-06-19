import { asText, runStatement, serviceFailure } from '@/lib/platform-db'
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

    const { searchParams } = new URL(request.url)
    const q = asText(searchParams.get('q')).trim()
    if (q.length < 2) {
      return Response.json(
        { ok: false, message: 'Search query must be at least 2 characters.' },
        { status: 400 }
      )
    }

    // Escape LIKE metacharacters so user input is matched literally.
    const escaped = q.replace(/([%_\\])/g, '\\$1')
    const like = `%${escaped}%`

    // Results are scoped to the caller's own accounts and the transactions
    // they are a party to. Non-admins cannot search across the whole bank.
    const result = await runStatement(
      `SELECT 'account' AS type, a.id::text, a.account_number AS label, a.account_name AS detail
         FROM accounts a
        WHERE a.user_id = $2
          AND (a.account_number ILIKE $1 ESCAPE '\\' OR a.account_name ILIKE $1 ESCAPE '\\')
       UNION ALL
       SELECT 'transaction' AS type, t.id::text,
              t.from_account || ' -> ' || t.to_account AS label, t.description AS detail
         FROM transactions t
         JOIN accounts a
           ON a.account_number IN (t.from_account, t.to_account)
        WHERE a.user_id = $2
          AND t.description ILIKE $1 ESCAPE '\\'
       LIMIT 25`,
      [like, session.userId]
    )

    return Response.json({ ok: true, query: q, results: result.rows })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
