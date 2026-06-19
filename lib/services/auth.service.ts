import { hashPassword, verifyPassword, createSession } from '@/lib/auth'
import * as UserModel from '@/lib/models/user.model'
import * as AccountModel from '@/lib/models/account.model'

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function login(identifier: string, password: string) {
  const row = await UserModel.findByIdentifier(identifier)
  const passwordOk = row ? await verifyPassword(password, row.password) : false

  if (!row || !passwordOk) {
    throw new AuthError('Invalid username or password.', 401)
  }

  const user = {
    id: row.id as number,
    username: row.username as string,
    role: row.role as string,
    full_name: row.full_name as string,
    email: row.email as string
  }
  const token = createSession(user.id, user.role)
  return { user, token }
}

export async function signup(
  accountName: string,
  email: string,
  password: string,
  accountNumber?: string,
  branch?: string
) {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!accountName || !email || !password) {
    throw new AuthError('Account name, email and password are required.', 400)
  }
  if (!EMAIL_RE.test(email)) {
    throw new AuthError('Enter a valid email address.', 400)
  }
  if (password.length < 6) {
    throw new AuthError('Password must be at least 6 characters.', 400)
  }
  if (accountNumber && !/^\d{8,20}$/.test(accountNumber)) {
    throw new AuthError('Account number must be 8 to 20 digits.', 400)
  }

  const username = email.toLowerCase()
  const passwordHash = await hashPassword(password)

  const { pool, ensureDatabase } = UserModel
  await ensureDatabase()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    if (await UserModel.emailExists(username, client)) {
      await client.query('ROLLBACK')
      throw new AuthError('An account with this email already exists.', 409)
    }

    const user = await UserModel.createUser(username, passwordHash, accountName, email, client)

    if (accountNumber) {
      if (await AccountModel.accountNumberExistsInTx(accountNumber, client)) {
        await client.query('ROLLBACK')
        throw new AuthError('That account number is already in use.', 409)
      }
      const pinHash = await hashPassword('0000')
      await AccountModel.createInTx(
        user.id,
        accountNumber,
        branch || accountName,
        pinHash,
        client
      )
    }

    await client.query('COMMIT')
    const token = createSession(user.id, user.role)
    return { user, token }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function getCurrentUser(userId: number) {
  const user = await UserModel.findById(userId)
  if (!user) throw new AuthError('Unauthorized', 401)
  return user
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  if (!email || !otp || !newPassword) {
    throw new AuthError('Email, OTP and new password are required.', 400)
  }
  if (newPassword.length < 6) {
    throw new AuthError('Password must be at least 6 characters.', 400)
  }
  const passwordHash = await hashPassword(newPassword)
  await UserModel.updatePassword(email, passwordHash)
}
