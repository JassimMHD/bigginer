import { randomBytes, scrypt, timingSafeEqual, createHmac } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

const SCRYPT_KEYLEN = 64

/**
 * Hash a secret (password or PIN) with scrypt and a per-secret random salt.
 * Format: `scrypt$<saltHex>$<hashHex>`.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = (await scryptAsync(plain, salt, SCRYPT_KEYLEN)) as Buffer
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`
}

/**
 * Verify a plaintext secret against a stored `scrypt$salt$hash` value.
 * Returns false (never throws) on malformed input. Constant-time compare.
 */
export async function verifyPassword(
  plain: string,
  stored: string | null | undefined
): Promise<boolean> {
  if (!stored) return false
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false

  const salt = Buffer.from(parts[1], 'hex')
  const expected = Buffer.from(parts[2], 'hex')
  if (expected.length !== SCRYPT_KEYLEN) return false

  const derived = (await scryptAsync(plain, salt, SCRYPT_KEYLEN)) as Buffer
  return timingSafeEqual(derived, expected)
}

// --- Sessions: HMAC-signed, opaque-to-the-client tokens --------------------

const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required')
}
const secret: string = SESSION_SECRET

export const SESSION_COOKIE = 'session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 8 // 8 hours

export type Session = {
  userId: number
  role: string
  exp: number
}

function sign(payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

/** Create a signed session token. */
export function createSession(userId: number, role: string): string {
  // exp is read from elsewhere via Date; callers pass it in to stay testable.
  const exp = sessionExpiry()
  const body = Buffer.from(JSON.stringify({ userId, role, exp })).toString(
    'base64url'
  )
  return `${body}.${sign(body)}`
}

function sessionExpiry(): number {
  return new Date().getTime() + SESSION_TTL_MS
}

/** Verify a session token's signature and expiry. Returns null if invalid. */
export function verifySession(
  token: string | undefined | null
): Session | null {
  if (!token) return null
  const dot = token.indexOf('.')
  if (dot < 0) return null

  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  const expectedSig = sign(body)
  const a = Buffer.from(sig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  let parsed: Session
  try {
    parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (
    typeof parsed.userId !== 'number' ||
    typeof parsed.role !== 'string' ||
    typeof parsed.exp !== 'number'
  ) {
    return null
  }
  if (parsed.exp < new Date().getTime()) return null

  return parsed
}

/** Read and verify the session from an incoming request's cookies. */
export function getSession(request: Request): Session | null {
  const cookie = request.headers.get('cookie') || ''
  const match = cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
  if (!match) return null
  const token = decodeURIComponent(match.slice(SESSION_COOKIE.length + 1))
  return verifySession(token)
}

/** Build a Set-Cookie header value for the session token. */
export function sessionCookie(token: string): string {
  return [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`
  ].join('; ')
}

/** Build a Set-Cookie header value that immediately clears the session. */
export function clearSessionCookie(): string {
  return [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Max-Age=0'
  ].join('; ')
}
