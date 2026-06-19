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

const FIELDS: { key: keyof Form; label: string }[] = [
  { key: 'accountNumber', label: 'Account Number' },
  { key: 'accountName', label: 'Account Name' },
  { key: 'branch', label: 'Branch' },
  { key: 'email', label: 'Email' },
  { key: 'password', label: 'Password' },
  { key: 'confirmPassword', label: 'Confirm Password' }
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
    <section className="mx-auto min-h-[700px] w-full max-w-[1100px] rounded-[58px] bg-white px-8 py-9 shadow-[0_1px_3px_0_rgba(0,0,0,0.30),0_4px_8px_3px_rgba(0,0,0,0.15)] lg:min-h-[820px] lg:px-14">
      <div className="relative mx-auto w-full max-w-[860px]">
        <img
          src="/loginlogo.png"
          alt="Nova Bank"
          className="absolute left-0 top-0 hidden w-[128px] md:block"
        />

        <h1 className="mb-12 text-center text-[2.6rem] font-bold text-black text-balance">
          SIGN UP
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {FIELDS.map(({ key, label }) => {
            const fieldId = `sign-up-${key}`
            const isPassword = key === 'password' || key === 'confirmPassword'

            return (
              <div
                className="grid items-center gap-4 md:grid-cols-[180px_1fr]"
                key={key}
              >
                <label className="text-xl text-black" htmlFor={fieldId}>
                  {label} :
                </label>
                <input
                  id={fieldId}
                  type={
                    isPassword ? 'password' : key === 'email' ? 'email' : 'text'
                  }
                  value={form[key]}
                  onChange={(e) => update(key, e.target.value)}
                  className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none"
                />
              </div>
            )
          })}

          {error && (
            <p className="text-center text-sm font-semibold text-red-600">
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-col items-center gap-4">
            <AuthButton type="submit" disabled={submitting}>
              {submitting ? 'CREATING…' : 'SIGN UP'}
            </AuthButton>
            <Link href="/login" className="text-sm font-bold text-black">
              Already have an account? Log in
            </Link>
          </div>
        </form>
      </div>
    </section>
  )
}
