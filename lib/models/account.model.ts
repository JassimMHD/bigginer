import { runStatement, pool, ensureDatabase } from '@/lib/platform-db'
import type { PoolClient } from 'pg'

export async function findByUserId(userId: number) {
  const result = await runStatement(
    `SELECT a.id, a.user_id, a.account_number, a.account_name, a.balance,
            u.username, u.full_name
     FROM accounts a
     JOIN users u ON u.id = a.user_id
     WHERE a.user_id = $1
     ORDER BY a.id`,
    [userId]
  )
  return result.rows
}

export async function accountNumberExists(accountNumber: string) {
  const result = await runStatement(
    'SELECT 1 FROM accounts WHERE account_number = $1 LIMIT 1',
    [accountNumber]
  )
  return (result.rowCount ?? 0) > 0
}

export async function accountNumberExistsInTx(
  accountNumber: string,
  client: PoolClient
) {
  const result = await client.query(
    'SELECT 1 FROM accounts WHERE account_number = $1 LIMIT 1',
    [accountNumber]
  )
  return (result.rowCount ?? 0) > 0
}

export async function isOwnedByUser(accountNumber: string, userId: number) {
  const result = await runStatement(
    'SELECT 1 FROM accounts WHERE account_number = $1 AND user_id = $2 LIMIT 1',
    [accountNumber, userId]
  )
  return (result.rowCount ?? 0) > 0
}

export async function create(
  userId: number,
  accountNumber: string,
  accountName: string,
  pinHash: string
) {
  const result = await runStatement(
    `INSERT INTO accounts (user_id, account_number, account_name, balance, pin)
     VALUES ($1, $2, $3, 0, $4)
     RETURNING id, user_id, account_number, account_name, balance`,
    [userId, accountNumber, accountName, pinHash]
  )
  return result.rows[0]
}

export async function createInTx(
  userId: number,
  accountNumber: string,
  accountName: string,
  pinHash: string,
  client: PoolClient
) {
  await client.query(
    `INSERT INTO accounts (user_id, account_number, account_name, balance, pin)
     VALUES ($1, $2, $3, 0, $4)`,
    [userId, accountNumber, accountName, pinHash]
  )
}

export async function updateName(
  id: number,
  userId: number,
  accountName: string
) {
  const result = await runStatement(
    `UPDATE accounts SET account_name = $1
     WHERE id = $2 AND user_id = $3
     RETURNING id, user_id, account_number, account_name, balance`,
    [accountName, id, userId]
  )
  return result.rows[0] ?? null
}

export async function deleteById(id: number, userId: number) {
  const result = await runStatement(
    'DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING account_number, account_name',
    [id, userId]
  )
  return result.rows[0] ?? null
}

export async function debit(
  accountNumber: string,
  userId: number,
  amount: number,
  client: PoolClient
) {
  const result = await client.query(
    `UPDATE accounts
     SET balance = balance - $1
     WHERE account_number = $2 AND user_id = $3 AND balance >= $1`,
    [amount, accountNumber, userId]
  )
  return (result.rowCount ?? 0) > 0
}

export async function credit(
  accountNumber: string,
  amount: number,
  client: PoolClient
) {
  const result = await client.query(
    `UPDATE accounts SET balance = balance + $1 WHERE account_number = $2`,
    [amount, accountNumber]
  )
  return (result.rowCount ?? 0) > 0
}

export { ensureDatabase, pool }
