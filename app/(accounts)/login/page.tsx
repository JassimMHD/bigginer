'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthButton from '@/components/authButton'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError('')

    if (!username.trim() || !password) {
      setError('Enter your email or username and password.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        router.push('/dashboard')
      } else {
        setError(data.message || 'Invalid username or password.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card">
      {/* Left panel */}
      <aside className="left-panel" aria-hidden="true">
        <div className="left-orb left-orb-1" />
        <div className="left-orb left-orb-2" />
        <div className="left-content">
          <div className="logo-wrap">
            <img src="/loginlogo.png" alt="Nova Bank" className="logo" />
          </div>
          <h2 className="left-title">Nova Bank</h2>
          <p className="left-sub">Your money, beautifully managed.</p>
        </div>
      </aside>

      {/* Right panel */}
      <div className="right-panel">
        <h1 className="form-title">Welcome back</h1>
        <p className="form-sub">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label className="label" htmlFor="login-account">Email or Username</label>
            <div className="input-wrap">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="login-account"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter email or username"
                autoComplete="username"
                className="glass-input input-padded"
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="login-password">Password</label>
            <div className="input-wrap">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="glass-input input-padded"
              />
            </div>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="forgot-row">
            <Link href="/reset-password" className="forgot-link">Forgot password?</Link>
          </div>

          <AuthButton type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Signing in…' : 'Sign In'}
          </AuthButton>

          <p className="signup-row">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="signup-link">Sign Up</Link>
          </p>
        </form>
      </div>

      <style jsx>{`
        .card {
          display: flex;
          min-height: 600px;
          border-radius: 32px;
          overflow: hidden;
          background: rgba(180,192,210,0.07);
          border: 1px solid rgba(180,192,210,0.16);
          backdrop-filter: blur(32px) saturate(160%);
          -webkit-backdrop-filter: blur(32px) saturate(160%);
          box-shadow: 0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(220,230,245,0.07);
        }

        .left-panel {
          position: relative;
          width: 44%;
          background: linear-gradient(145deg, rgba(148,163,184,0.45) 0%, rgba(8,8,12,0.7) 100%);
          border-right: 1px solid rgba(220,230,245,0.07);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .left-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(50px);
          pointer-events: none;
        }
        .left-orb-1 { width: 280px; height: 280px; background: rgba(180,200,225,0.3); top: -60px; left: -60px }
        .left-orb-2 { width: 200px; height: 200px; background: rgba(56,189,248,0.15); bottom: 0; right: -40px }

        .left-content {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 40px 32px;
        }

        .logo-wrap {
          width: 96px;
          height: 96px;
          margin: 0 auto 24px;
          border-radius: 24px;
          background: rgba(180,200,225,0.15);
          border: 1px solid rgba(200,215,235,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          box-shadow: 0 0 32px rgba(180,200,225,0.25);
        }

        .logo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 16px;
        }

        .left-title {
          color: rgba(240,245,252,0.95);
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 10px;
        }

        .left-sub {
          color: rgba(180,195,215,0.45);
          font-size: 14px;
          line-height: 1.5;
        }

        .right-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 44px;
        }

        .form-title {
          font-size: 28px;
          font-weight: 800;
          color: rgba(240,245,252,0.95);
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }

        .form-sub {
          color: rgba(180,195,215,0.45);
          font-size: 14px;
          margin-bottom: 36px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field { display: flex; flex-direction: column; gap: 7px }

        .label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(180,195,215,0.65);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .input-wrap { position: relative }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(180,195,215,0.38);
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        :global(.input-padded) { padding-left: 44px !important }

        .error-msg {
          font-size: 13px;
          font-weight: 600;
          color: #ff6b63;
          background: rgba(255,69,58,0.1);
          border: 1px solid rgba(255,69,58,0.25);
          border-radius: 10px;
          padding: 10px 14px;
          margin: 0;
        }

        .forgot-row { text-align: right; margin-top: -6px }

        .forgot-link {
          font-size: 12px;
          font-weight: 600;
          color: rgba(184,200,220,0.8);
          text-decoration: none;
          transition: color 0.2s;
        }
        .forgot-link:hover { color: #b8c8dc }

        :global(.auth-btn) {
          width: 100%;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, #c8d8e8 0%, #7a90a8 100%);
          border: none;
          color: #0a0c10;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
          box-shadow: 0 0 28px rgba(180,200,225,0.38);
          margin-top: 6px;
        }
        :global(.auth-btn:hover:not(:disabled)) {
          filter: brightness(1.12);
          transform: translateY(-1px);
          box-shadow: 0 0 36px rgba(180,200,225,0.5);
        }
        :global(.auth-btn:disabled) { opacity: 0.5; cursor: not-allowed; transform: none }

        .signup-row {
          text-align: center;
          font-size: 13px;
          color: rgba(180,195,215,0.45);
          margin-top: 4px;
        }

        .signup-link {
          color: #b8c8dc;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s;
        }
        .signup-link:hover { color: #d0dce8 }

        @media (max-width: 640px) {
          .card { flex-direction: column; min-height: auto; border-radius: 24px }
          .left-panel { width: 100%; min-height: 180px; padding: 24px }
          .left-content { padding: 16px }
          .logo-wrap { width: 72px; height: 72px; margin-bottom: 16px }
          .left-title { font-size: 22px }
          .right-panel { padding: 32px 24px }
        }
      `}</style>
    </div>
  )
}
