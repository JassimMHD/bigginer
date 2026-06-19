'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthButton from '@/components/authButton'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError('')
    setMessage('')

    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (!otp.trim()) {
      setError('Enter the OTP.')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword
        })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        setMessage(data.message || 'Password reset. Redirecting to login…')
        setTimeout(() => router.push('/login'), 1200)
      } else {
        setError(data.message || 'Could not reset password.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[500px] w-full max-w-[1100px] items-center justify-center rounded-[58px] bg-white px-8 py-10 shadow-[0_1px_3px_0_rgba(0,0,0,0.30),0_4px_8px_3px_rgba(0,0,0,0.15)] lg:min-h-[684px]">
      <form onSubmit={handleSubmit} className="w-full max-w-[670px]">
        <h1 className="mb-16 text-center text-[2.6rem] font-bold text-black text-balance">
          RESET PASSWORD
        </h1>

        <div className="space-y-8">
          <div className="grid items-center gap-4 md:grid-cols-[120px_1fr]">
            <label className="text-xl text-black" htmlFor="reset-email">
              Email:
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none"
            />
          </div>

          <div className="grid items-center gap-4 md:grid-cols-[120px_250px]">
            <label className="text-xl text-black" htmlFor="reset-otp">
              OTP:
            </label>
            <input
              id="reset-otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none"
            />
          </div>

          <div className="grid items-center gap-4 md:grid-cols-[120px_250px]">
            <label className="text-xl text-black" htmlFor="reset-password">
              New Password:
            </label>
            <input
              id="reset-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="mt-6 text-center text-sm font-semibold text-red-600">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-6 text-center text-sm font-semibold text-green-700">
            {message}
          </p>
        )}

        <div className="mt-12 flex flex-col items-center gap-4">
          <AuthButton type="submit" disabled={submitting}>
            {submitting ? 'RESETTING…' : 'RESET'}
          </AuthButton>
          <Link href="/login" className="text-sm font-bold text-black">
            Back to login
          </Link>
        </div>
      </form>
    </section>
  )
}
