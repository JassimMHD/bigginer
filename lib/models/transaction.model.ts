import { runStatement, pool } from '@/lib/platform-db'

export async function findByAccount(accountNumber: string) {
  const result = await runStatement(
    `SELECT id, from_account, to_account, amount, description, status, created_at
     FROM transactions
     WHERE from_account = $1 OR to_account = $1
     ORDER BY created_at DESC
     LIMIT 100`,
    [accountNumber]
  )
  return result.rows
}

export async function create(
  fromAccount: string,
  toAccount: string,
  amount: number,
  description: string,
  createdBy: number,
  client: Awaited<ReturnType<typeof pool.connect>>
) {
  const result = await client.query(
    `INSERT INTO transactions (from_account, to_account, amount, description, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, from_account, to_account, amount, description, status, created_at`,
    [fromAccount, toAccount, amount, description, createdBy]
  )
  return result.rows[0]
}
