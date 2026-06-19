import { runStatement, pool, ensureDatabase } from '@/lib/platform-db'

export async function findByIdentifier(identifier: string) {
  const result = await runStatement(
    `SELECT id, username, password, role, full_name, email
     FROM users
     WHERE username = $1 OR email = $1
     LIMIT 1`,
    [identifier.toLowerCase()]
  )
  return result.rows[0] ?? null
}

export async function findById(id: number) {
  const result = await runStatement(
    'SELECT id, username, role, full_name, email FROM users WHERE id = $1 LIMIT 1',
    [id]
  )
  return result.rows[0] ?? null
}

export async function createUser(
  username: string,
  passwordHash: string,
  fullName: string,
  email: string,
  client: Awaited<ReturnType<typeof pool.connect>>
) {
  const result = await client.query(
    `INSERT INTO users (username, password, role, full_name, email)
     VALUES ($1, $2, 'customer', $3, $4)
     RETURNING id, username, role, full_name, email`,
    [username, passwordHash, fullName, email]
  )
  return result.rows[0]
}

export async function emailExists(
  username: string,
  client: Awaited<ReturnType<typeof pool.connect>>
) {
  const result = await client.query(
    'SELECT 1 FROM users WHERE username = $1 LIMIT 1',
    [username]
  )
  return (result.rowCount ?? 0) > 0
}

export async function updatePassword(email: string, passwordHash: string) {
  const result = await runStatement(
    'UPDATE users SET password = $1 WHERE email = $2 OR username = $2',
    [passwordHash, email]
  )
  return result.rowCount ?? 0
}

export { ensureDatabase, pool }
