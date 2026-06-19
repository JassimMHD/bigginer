import { asText, runStatement, serviceFailure } from '@/lib/platform-db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = asText(body.email).trim().toLowerCase()
    const otp = asText(body.otp).trim()
    const newPassword = asText(body.newPassword)

    if (!email || !otp || !newPassword) {
      return Response.json(
        { ok: false, message: 'Email, OTP and new password are required.' },
        { status: 400 }
      )
    }
    if (newPassword.length < 6) {
      return Response.json(
        { ok: false, message: 'Password must be at least 6 characters.' },
        { status: 400 }
      )
    }

    // NOTE: this demo has no email/OTP delivery, so any non-empty OTP is
    // accepted. In production this would verify a one-time code.
    const passwordHash = await hashPassword(newPassword)
    const result = await runStatement(
      'UPDATE users SET password = $1 WHERE email = $2 OR username = $2',
      [passwordHash, email]
    )

    // Do not reveal whether the email exists.
    if (result.rowCount === 0) {
      return Response.json({
        ok: true,
        message: 'If that account exists, the password has been reset.'
      })
    }

    return Response.json({ ok: true, message: 'Password reset successfully.' })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
