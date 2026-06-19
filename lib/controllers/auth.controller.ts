import type { NextRequest } from 'next/server'
import { asText, serviceFailure } from '@/lib/platform-db'
import { getSession, sessionCookie, clearSessionCookie } from '@/lib/auth'
import { extractClientInfo } from '@/lib/activity'
import * as AuthService from '@/lib/services/auth.service'
import * as ActivityService from '@/lib/services/activity.service'

export async function login(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const identifier = asText(body.username)
    const password = asText(body.password)
    const clientInfo = extractClientInfo(request)

    try {
      const { user, token } = await AuthService.login(identifier, password)
      const headers = new Headers()
      headers.append('set-cookie', sessionCookie(token))
      await ActivityService.log(user.id, 'LOGIN', `Logged in as ${user.username}`, { username: user.username }, clientInfo)
      return Response.json({ ok: true, user }, { headers })
    } catch (err) {
      if (err instanceof AuthService.AuthError && err.status === 401) {
        await ActivityService.log(null, 'LOGIN_FAILED', `Failed login attempt for "${identifier}"`, { username: identifier }, clientInfo)
        return Response.json({ ok: false, message: err.message }, { status: 401 })
      }
      throw err
    }
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function logout(request: NextRequest) {
  try {
    const session = getSession(request)
    const clientInfo = extractClientInfo(request)
    if (session) {
      await ActivityService.log(session.userId, 'LOGOUT', 'Signed out', {}, clientInfo)
    }
    const headers = new Headers()
    headers.append('set-cookie', clearSessionCookie())
    return Response.json({ ok: true, message: 'Signed out.' }, { headers })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function signup(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const accountName = asText(body.accountName).trim()
    const email = asText(body.email).trim()
    const password = asText(body.password)
    const accountNumber = asText(body.accountNumber).trim() || undefined
    const branch = asText(body.branch).trim() || undefined

    const { user, token } = await AuthService.signup(
      accountName,
      email,
      password,
      accountNumber,
      branch
    )
    const headers = new Headers()
    headers.append('set-cookie', sessionCookie(token))
    return Response.json({ ok: true, user }, { headers })
  } catch (err) {
    if (err instanceof AuthService.AuthError) {
      return Response.json({ ok: false, message: err.message }, { status: err.status })
    }
    return serviceFailure(err)
  }
}

export async function me(request: NextRequest) {
  try {
    const session = getSession(request)
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }
    const user = await AuthService.getCurrentUser(session.userId)
    return Response.json({ ok: true, user })
  } catch (err) {
    if (err instanceof AuthService.AuthError) {
      return Response.json({ ok: false, message: err.message }, { status: err.status })
    }
    return serviceFailure(err)
  }
}

export async function resetPassword(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = asText(body.email).trim().toLowerCase()
    const otp = asText(body.otp).trim()
    const newPassword = asText(body.newPassword)

    await AuthService.resetPassword(email, otp, newPassword)
    return Response.json({ ok: true, message: 'Password reset successfully.' })
  } catch (err) {
    if (err instanceof AuthService.AuthError) {
      return Response.json({ ok: false, message: err.message }, { status: err.status })
    }
    return serviceFailure(err)
  }
}
