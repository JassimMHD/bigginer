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
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword })
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
    <div className="card">
      <div className="card-top">
        <div className="icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="#b8c8dc" strokeWidth="1.8" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#b8c8dc" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h1 className="card-title">Reset Password</h1>
          <p className="card-sub">Enter your email, OTP, and a new password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="field">
          <label className="label" htmlFor="reset-email">Email Address</label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="glass-input"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="reset-otp">One-Time Password (OTP)</label>
          <input
            id="reset-otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="glass-input"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="reset-password">New Password</label>
          <input
            id="reset-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 6 characters"
            className="glass-input"
          />
        </div>

        {error && <p className="error-msg">{error}</p>}
        {message && <p className="success-msg">{message}</p>}

        <AuthButton type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Resetting…' : 'Reset Password'}
        </AuthButton>

        <p className="back-row">
          <Link href="/login" className="back-link">← Back to Sign In</Link>
        </p>
      </form>

      <style jsx>{`
        .card {
          background: rgba(180,192,210,0.07);
          border: 1px solid rgba(180,192,210,0.16);
          backdrop-filter: blur(32px) saturate(160%);
          -webkit-backdrop-filter: blur(32px) saturate(160%);
          box-shadow: 0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(220,230,245,0.07);
          border-radius: 28px;
          padding: 48px 52px;
          max-width: 520px;
          margin: 0 auto;
          width: 100%;
        }

        .card-top {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 36px;
        }

        .icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(180,200,225,0.12);
          border: 1px solid rgba(180,192,210,0.16);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-title {
          font-size: 22px;
          font-weight: 800;
          color: rgba(240,245,252,0.95);
          letter-spacing: -0.4px;
          margin-bottom: 2px;
        }

        .card-sub { color: rgba(180,195,215,0.38); font-size: 13px }

        .form { display: flex; flex-direction: column; gap: 18px }

        .field { display: flex; flex-direction: column; gap: 7px }

        .label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(180,195,215,0.45);
          letter-spacing: 0.6px;
          text-transform: uppercase;
        }

        .error-msg {
          font-size: 13px;
          font-weight: 600;
          color: #ff6b63;
          background: rgba(255,69,58,0.1);
          border: 1px solid rgba(255,69,58,0.25);
          border-radius: 10px;
          padding: 10px 14px;
        }

        .success-msg {
          font-size: 13px;
          font-weight: 600;
          color: #30d158;
          background: rgba(48,209,88,0.1);
          border: 1px solid rgba(48,209,88,0.25);
          border-radius: 10px;
          padding: 10px 14px;
        }

        :global(.auth-btn) {
          width: 100%;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, #c8d8e8 0%, #7a90a8 100%);
          border: none;
          color: #0a0c10;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
          box-shadow: 0 0 28px rgba(180,200,225,0.38);
          margin-top: 4px;
        }
        :global(.auth-btn:hover:not(:disabled)) {
          filter: brightness(1.12);
          transform: translateY(-1px);
        }
        :global(.auth-btn:disabled) { opacity: 0.5; cursor: not-allowed }

        .back-row { text-align: center }

        .back-link {
          font-size: 13px;
          font-weight: 600;
          color: rgba(184,200,220,0.75);
          text-decoration: none;
          transition: color 0.2s;
        }
        .back-link:hover { color: #b8c8dc }

        @media (max-width: 540px) {
          .card { padding: 32px 20px; border-radius: 20px }
        }
      `}</style>
    </div>
  )
}
