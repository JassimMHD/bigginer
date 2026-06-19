'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthButton from '@/components/authButton'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Form = {
  accountNumber: string
  accountName: string
  branch: string
  email: string
  password: string
  confirmPassword: string
}

const FIELDS: { key: keyof Form; label: string; type?: string; placeholder: string }[] = [
  { key: 'accountNumber', label: 'Account Number', placeholder: 'e.g. 12345678' },
  { key: 'accountName', label: 'Account Name', placeholder: 'Your full name' },
  { key: 'branch', label: 'Branch', placeholder: 'e.g. Colombo Main' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
  { key: 'password', label: 'Password', type: 'password', placeholder: 'Min. 6 characters' },
  { key: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Re-enter password' }
]

export default function SignUpPage() {
  const router = useRouter()
  const [form, setForm] = useState<Form>({
    accountNumber: '',
    accountName: '',
    branch: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(key: keyof Form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError('')

    if (!form.accountName.trim() || !form.email.trim() || !form.password) {
      setError('Account name, email and password are required.')
      return
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.accountNumber && !/^\d{8,20}$/.test(form.accountNumber.trim())) {
      setError('Account number must be 8 to 20 digits.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: form.accountNumber.trim(),
          accountName: form.accountName.trim(),
          branch: form.branch.trim(),
          email: form.email.trim(),
          password: form.password
        })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        router.push('/dashboard')
      } else {
        setError(data.message || 'Could not create account.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="logo-row">
          <div className="logo-wrap">
            <img src="/loginlogo.png" alt="Nova Bank" className="logo" />
          </div>
          <div>
            <h1 className="card-title">Create Account</h1>
            <p className="card-sub">Join Nova Bank today</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="fields-grid">
          {FIELDS.map(({ key, label, type, placeholder }) => {
            const fieldId = `sign-up-${key}`
            return (
              <div className="field" key={key}>
                <label className="label" htmlFor={fieldId}>{label}</label>
                <input
                  id={fieldId}
                  type={type || 'text'}
                  value={form[key]}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder={placeholder}
                  className="glass-input"
                />
              </div>
            )
          })}
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div className="form-footer">
          <AuthButton type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Creating account…' : 'Sign Up'}
          </AuthButton>
          <p className="login-row">
            Already have an account?{' '}
            <Link href="/login" className="login-link">Sign In</Link>
          </p>
        </div>
      </form>

      <style jsx>{`
        .card {
          background: rgba(180,192,210,0.07);
          border: 1px solid rgba(180,192,210,0.16);
          backdrop-filter: blur(32px) saturate(160%);
          -webkit-backdrop-filter: blur(32px) saturate(160%);
          box-shadow: 0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(220,230,245,0.07);
          border-radius: 32px;
          padding: 40px 48px;
          max-width: 760px;
          margin: 0 auto;
          width: 100%;
        }

        .card-header { margin-bottom: 36px }

        .logo-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo-wrap {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(180,200,225,0.15);
          border: 1px solid rgba(200,215,235,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          flex-shrink: 0;
        }

        .logo { width: 100%; height: 100%; object-fit: cover; border-radius: 10px }

        .card-title {
          font-size: 24px;
          font-weight: 800;
          color: rgba(240,245,252,0.95);
          letter-spacing: -0.4px;
          margin-bottom: 2px;
        }

        .card-sub { color: rgba(180,195,215,0.45); font-size: 13px }

        .form { display: flex; flex-direction: column; gap: 24px }

        .fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

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

        .form-footer { display: flex; flex-direction: column; gap: 14px; align-items: center }

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
        }
        :global(.auth-btn:hover:not(:disabled)) {
          filter: brightness(1.12);
          transform: translateY(-1px);
          box-shadow: 0 0 36px rgba(180,200,225,0.5);
        }
        :global(.auth-btn:disabled) { opacity: 0.5; cursor: not-allowed; transform: none }

        .login-row { font-size: 13px; color: rgba(180,195,215,0.45) }

        .login-link {
          color: #b8c8dc;
          font-weight: 700;
          text-decoration: none;
        }
        .login-link:hover { color: #d0dce8 }

        @media (max-width: 640px) {
          .card { padding: 28px 20px; border-radius: 24px }
          .fields-grid { grid-template-columns: 1fr }
        }
      `}</style>
    </div>
  )
}
