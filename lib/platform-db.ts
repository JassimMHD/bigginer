import { Pool } from 'pg'
import { hashPassword } from './auth'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is required')
}

export const pool = new Pool({
  connectionString,
  max: 10
})

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  full_name TEXT NOT NULL,
  nic TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  account_number TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  pin TEXT NOT NULL DEFAULT '0000'
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  from_account TEXT NOT NULL,
  to_account TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  created_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`

// Default credentials for the seeded demo users. Passwords/PINs are hashed
// before insertion; these plaintext values exist only to bootstrap local demos.
const seedUsers = [
  {
    id: 1,
    username: 'dilara',
    password: 'password123',
    role: 'customer',
    full_name: 'Dilara Perera',
    nic: '200112345678',
    email: 'dilara@example.test'
  },
  {
    id: 2,
    username: 'kasun',
    password: 'kasun',
    role: 'customer',
    full_name: 'Kasun Wickramanayake',
    nic: '199812345678',
    email: 'kasun@example.test'
  },
  {
    id: 3,
    username: 'admin',
    password: 'admin',
    role: 'admin',
    full_name: 'Platform Administrator',
    nic: '000000000000',
    email: 'root@example.test'
  }
]

const seedAccounts = [
  {
    user_id: 1,
    account_number: '1000003423',
    account_name: 'Dilara Savings',
    balance: 100000.0,
    pin: '1234'
  },
  {
    user_id: 1,
    account_number: '1000004876',
    account_name: 'Dilara Expenses',
    balance: 42000.0,
    pin: '1234'
  },
  {
    user_id: 2,
    account_number: '2000006754',
    account_name: 'Kasun Current',
    balance: 9870.0,
    pin: '0000'
  },
  {
    user_id: 3,
    account_number: '9999999999',
    account_name: 'Admin Vault',
    balance: 9999999.99,
    pin: '9999'
  }
]

const seedTransactions = [
  {
    from: '1000003423',
    to: '2000006754',
    amount: 4500.0,
    description: 'Lunch money',
    by: 1
  },
  {
    from: '1000004876',
    to: '9999999999',
    amount: 10000.0,
    description: 'Totally normal fee',
    by: 1
  },
  {
    from: '2000006754',
    to: '1000003423',
    amount: 9870.0,
    description: 'Refund maybe',
    by: 2
  }
]

async function seedDatabase() {
  for (const u of seedUsers) {
    await pool.query(
      `INSERT INTO users (id, username, password, role, full_name, nic, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        u.id,
        u.username,
        await hashPassword(u.password),
        u.role,
        u.full_name,
        u.nic,
        u.email
      ]
    )
  }

  // Keep the SERIAL sequence ahead of the explicit ids we just inserted.
  await pool.query(
    `SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users))`
  )

  for (const a of seedAccounts) {
    await pool.query(
      `INSERT INTO accounts (user_id, account_number, account_name, balance, pin)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (account_number) DO NOTHING`,
      [
        a.user_id,
        a.account_number,
        a.account_name,
        a.balance,
        await hashPassword(a.pin)
      ]
    )
  }

  for (const t of seedTransactions) {
    await pool.query(
      `INSERT INTO transactions (from_account, to_account, amount, description, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [t.from, t.to, t.amount, t.description, t.by]
    )
  }
}

/**
 * Execute a query. Always use parameter placeholders ($1, $2, …) and pass
 * values via `params` — never interpolate user input into `sql`.
 */
export async function runStatement(sql: string, params: unknown[] = []) {
  await ensureDatabase()
  return pool.query(sql, params)
}

let bootPromise: Promise<void> | null = null

export function ensureDatabase() {
  if (!bootPromise) {
    bootPromise = (async () => {
      await pool.query(schema)
      await seedDatabase()
    })().catch((err) => {
      // Allow a later request to retry boot if this attempt failed.
      bootPromise = null
      throw err
    })
  }
  return bootPromise
}

export function asText(value: unknown) {
  if (value === undefined || value === null) return ''
  return String(value)
}

export function serviceFailure(reason: unknown) {
  // Log full details server-side only; never leak internals to the client.
  console.error('[service-failure]', reason)

  return Response.json(
    {
      ok: false,
      message: 'Internal server error'
    },
    { status: 500 }
  )
}
