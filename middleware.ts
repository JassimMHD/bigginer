import { NextResponse, type NextRequest } from 'next/server'

// Middleware runs on the Edge runtime, so it uses Web Crypto (not node:crypto).
// It verifies the session signature + expiry as a first gate; each route also
// re-verifies via getSession() for defense in depth.

const SESSION_COOKIE = 'session'

const encoder = new TextEncoder()

function base64urlToBytes(b64url: string): Uint8Array<ArrayBuffer> {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
  const binary = atob(b64 + pad)
  const buffer = new ArrayBuffer(binary.length)
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function verifySession(
  token: string | undefined,
  secret: string
): Promise<{ userId: number; role: string; exp: number } | null> {
  if (!token) return null
  const dot = token.indexOf('.')
  if (dot < 0) return null

  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  let sigBytes: Uint8Array<ArrayBuffer>
  try {
    sigBytes = base64urlToBytes(sig)
  } catch {
    return null
  }

  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes,
    encoder.encode(body)
  )
  if (!valid) return null

  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64urlToBytes(body)))
    if (
      typeof parsed.userId !== 'number' ||
      typeof parsed.role !== 'string' ||
      typeof parsed.exp !== 'number'
    ) {
      return null
    }
    if (parsed.exp < Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    return NextResponse.json(
      { ok: false, message: 'Server misconfigured' },
      { status: 500 }
    )
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = await verifySession(token, secret)
  const { pathname } = request.nextUrl

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Admin-only routes.
  if (pathname.startsWith('/api/admin') && session.role !== 'admin') {
    return NextResponse.json(
      { ok: false, message: 'Forbidden' },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/accounts/:path*',
    '/api/transactions/:path*',
    '/api/transfer/:path*',
    '/api/pay-bills/:path*',
    '/api/search/:path*',
    '/api/admin/:path*',
    '/dashboard/:path*',
    '/bank-accounts/:path*',
    '/bank-transfer/:path*',
    '/e-statement/:path*',
    '/pay-bills/:path*',
    '/smart-spend/:path*'
  ]
}
