'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/sidebar'

type Account = {
  account_number: string
  account_name: string
  balance: string | number
}

type Errors = Partial<{
  fromAccount: string
  amount: string
  accountNumber: string
  accountName: string
  bank: string
}>

const STEPS = ['Details', 'Confirm', 'Done']

export default function BankTransferPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [fromAccount, setFromAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [bank, setBank] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [step, setStep] = useState<'form' | 'confirm' | 'success' | 'failure'>('form')
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [failureMessage, setFailureMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/accounts')
      .then((r) => r.json())
      .then((d) => {
        if (!active || !d.ok) return
        const list: Account[] = d.accounts || []
        setAccounts(list)
        if (list.length > 0) setFromAccount(list[0].account_number)
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  function validate() {
    const e: Errors = {}
    if (!fromAccount) e.fromAccount = 'Select a source account'
    if (!amount) e.amount = 'Amount is required'
    else if (Number(amount) <= 0 || isNaN(Number(amount))) e.amount = 'Enter a valid positive amount'
    if (!accountNumber) e.accountNumber = 'Account number is required'
    else if (!/^\d{6,}$/.test(accountNumber)) e.accountNumber = 'Enter a valid account number'
    if (!accountName) e.accountName = 'Account name is required'
    if (!bank) e.bank = 'Select a bank'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) setStep('confirm')
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAccount, toAccount: accountNumber, amount: Number(amount), description })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        setConfirmation(String(data.transaction?.id ?? ''))
        setStep('success')
      } else {
        setFailureMessage(data.message || 'Transfer failed. Please try again.')
        setStep('failure')
      }
    } catch {
      setFailureMessage('Network error. Please try again.')
      setStep('failure')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setAmount('')
    setAccountNumber('')
    setAccountName('')
    setBank('')
    setDescription('')
    setErrors({})
    setConfirmation(null)
    setFailureMessage(null)
    setStep('form')
  }

  const stepIndex = step === 'form' ? 0 : step === 'confirm' ? 1 : 2

  return (
    <div className="shell">
      <Sidebar />

      <main className="main">
        {/* Header */}
        <header className="topbar">
          <div>
            <h1 className="page-title">Bank Transfer</h1>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            </button>
            <Link href="/profile" className="avatar-wrap" aria-label="Profile" title="View profile">
              <img src="/person-logo.png" alt="profile" className="avatar" />
            </Link>
          </div>
        </header>

        {/* Step indicator */}
        <div className="stepper">
          {STEPS.map((s, i) => (
            <div key={s} className="step-item">
              <div className={`step-circle ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`}>
                {i < stepIndex
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <span>{i + 1}</span>
                }
              </div>
              <span className={`step-label ${i === stepIndex ? 'active' : ''}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`step-line ${i < stepIndex ? 'done' : ''}`} />}
            </div>
          ))}
        </div>

        {/* Form step */}
        {step === 'form' && (
          <form onSubmit={handleNext} className="card glass">
            <h2 className="card-title">Transfer Details</h2>

            <div className="fields">
              <div className="field-row">
                <label className="label">From Account</label>
                <div className="input-col">
                  <select
                    value={fromAccount}
                    onChange={(e) => setFromAccount(e.target.value)}
                    className="glass-select"
                    aria-label="from account"
                  >
                    {accounts.length === 0 && <option value="">No accounts available</option>}
                    {accounts.map((a) => (
                      <option key={a.account_number} value={a.account_number}>
                        {a.account_name} ({a.account_number}) — Rs. {Number(a.balance).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {errors.fromAccount && <span className="err">{errors.fromAccount}</span>}
                </div>
              </div>

              <div className="field-row">
                <label className="label">Amount (Rs.)</label>
                <div className="input-col">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="glass-input"
                    placeholder="0.00"
                    aria-label="amount"
                  />
                  {errors.amount && <span className="err">{errors.amount}</span>}
                </div>
              </div>

              <div className="field-row">
                <label className="label">Account Number</label>
                <div className="input-col">
                  <input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="glass-input"
                    placeholder="Recipient account number"
                  />
                  {errors.accountNumber && <span className="err">{errors.accountNumber}</span>}
                </div>
              </div>

              <div className="field-row">
                <label className="label">Account Name</label>
                <div className="input-col">
                  <input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="glass-input"
                    placeholder="Recipient name"
                  />
                  {errors.accountName && <span className="err">{errors.accountName}</span>}
                </div>
              </div>

              <div className="field-row">
                <label className="label">Bank</label>
                <div className="input-col">
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="glass-select"
                  >
                    <option value="">Choose bank</option>
                    <option>First National</option>
                    <option>Global Trust</option>
                    <option>Union Bank</option>
                  </select>
                  {errors.bank && <span className="err">{errors.bank}</span>}
                </div>
              </div>

              <div className="field-row">
                <label className="label">Description</label>
                <div className="input-col">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="glass-input"
                    style={{ resize: 'vertical', height: 'auto' }}
                    placeholder="Optional note"
                  />
                </div>
              </div>
            </div>

            <div className="card-footer">
              <button type="submit" className="btn-accent btn-lg">Next →</button>
            </div>
          </form>
        )}

        {/* Confirm step */}
        {step === 'confirm' && (
          <div className="card glass">
            <h2 className="card-title">Confirm Transfer</h2>
            <div className="confirm-box">
              <div className="confirm-row">
                <span className="confirm-key">From</span>
                <span className="confirm-val">{fromAccount}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-key">To</span>
                <span className="confirm-val">{accountNumber} · {accountName}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-key">Bank</span>
                <span className="confirm-val">{bank}</span>
              </div>
              <div className="confirm-row highlight">
                <span className="confirm-key">Amount</span>
                <span className="confirm-amount">Rs. {amount || '0'}</span>
              </div>
              {description && (
                <div className="confirm-row">
                  <span className="confirm-key">Note</span>
                  <span className="confirm-val">{description}</span>
                </div>
              )}
              <p className="confirm-fee">An additional fee of Rs. 50 will be charged.</p>
            </div>
            <div className="card-footer gap">
              <button onClick={() => setStep('form')} className="btn-ghost btn-lg" disabled={submitting}>← Back</button>
              <button onClick={handleTransfer} className="btn-accent btn-lg" disabled={submitting}>
                {submitting ? 'Processing…' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="card glass status-card">
            <div className="status-icon success">
              <svg viewBox="0 0 60 60" width="60" height="60" fill="none">
                <circle cx="30" cy="30" r="28" fill="rgba(48,209,88,0.15)" stroke="rgba(48,209,88,0.4)" strokeWidth="1.5"/>
                <path d="M18 31l8 8 16-16" stroke="#30d158" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="status-title">Transfer Successful!</h2>
            <p className="status-sub">Confirmation #{confirmation}</p>
            <button onClick={resetForm} className="btn-accent btn-lg">← Back to Home</button>
          </div>
        )}

        {/* Failure */}
        {step === 'failure' && (
          <div className="card glass status-card">
            <div className="status-icon error">
              <svg viewBox="0 0 60 60" width="60" height="60" fill="none">
                <circle cx="30" cy="30" r="28" fill="rgba(255,69,58,0.15)" stroke="rgba(255,69,58,0.4)" strokeWidth="1.5"/>
                <path d="M22 22l16 16M38 22L22 38" stroke="#ff453a" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="status-title">Transfer Failed</h2>
            <p className="status-sub">{failureMessage}</p>
            <button onClick={resetForm} className="btn-accent btn-lg">← Try Again</button>
          </div>
        )}
      </main>

      <style jsx>{`
        .shell { display: flex; min-height: 100vh; background: linear-gradient(135deg,#050505 0%,#0a0a0a 50%,#111114 100%); background-attachment: fixed }
        .main { flex: 1; padding: 28px 32px 80px; overflow-y: auto; min-width: 0 }

        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px }
        .page-title { font-size: 26px; font-weight: 800; color: rgba(240,245,252,0.95); letter-spacing: -0.5px }
        .topbar-right { display: flex; align-items: center; gap: 10px }

        .icon-btn { width: 40px; height: 40px; border-radius: 12px; background: rgba(180,192,210,0.07); border: 1px solid rgba(180,192,210,0.16); color: rgba(180,195,215,0.65); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s }
        .icon-btn:hover { background: rgba(200,215,235,0.09) }
        .avatar-wrap { width: 40px; height: 40px; border-radius: 12px; overflow: hidden; border: 1.5px solid rgba(180,200,225,0.30) }
        .avatar { width: 100%; height: 100%; object-fit: cover; display: block }

        /* Stepper */
        .stepper { display: flex; align-items: center; margin-bottom: 28px; gap: 0 }

        .step-item { display: flex; align-items: center; gap: 8px }

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
          background: rgba(180,192,210,0.07);
          border: 1.5px solid rgba(180,192,210,0.16);
          color: rgba(180,195,215,0.45);
          transition: all 0.25s;
        }
        .step-circle.active { background: rgba(184,200,220,0.2); border-color: rgba(184,200,220,0.6); color: #b8c8dc; box-shadow: 0 0 16px rgba(180,200,225,0.3) }
        .step-circle.done { background: rgba(48,209,88,0.15); border-color: rgba(48,209,88,0.4); color: #30d158 }

        .step-label { font-size: 12px; font-weight: 600; color: rgba(180,195,215,0.38) }
        .step-label.active { color: rgba(240,245,252,0.95) }

        .step-line { flex: 1; height: 1.5px; background: rgba(180,192,210,0.16); min-width: 40px; margin: 0 10px }
        .step-line.done { background: rgba(48,209,88,0.4) }

        /* Card */
        .card {
          border-radius: 24px;
          padding: 32px 36px;
          max-width: 680px;
        }

        .card-title {
          font-size: 20px;
          font-weight: 800;
          color: rgba(240,245,252,0.95);
          margin-bottom: 28px;
          letter-spacing: -0.3px;
        }

        .fields { display: flex; flex-direction: column; gap: 22px }

        .field-row { display: grid; grid-template-columns: 160px 1fr; gap: 16px; align-items: start }

        .label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(180,195,215,0.45);
          padding-top: 14px;
        }

        .input-col { display: flex; flex-direction: column; gap: 6px }

        .err { font-size: 12px; color: #ff6b63; font-weight: 500 }

        .card-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 32px;
        }
        .card-footer.gap { gap: 12px }

        .btn-accent {
          background: linear-gradient(135deg,#c8d8e8 0%,#7a90a8 100%);
          border: none;
          border-radius: 999px;
          color: #0a0c10;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
          box-shadow: 0 0 28px rgba(180,200,225,0.38);
        }
        .btn-accent:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px) }
        .btn-accent:disabled { opacity: 0.5; cursor: not-allowed }

        .btn-ghost {
          background: rgba(180,192,210,0.07);
          border: 1px solid rgba(180,192,210,0.16);
          border-radius: 999px;
          color: rgba(180,195,215,0.65);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ghost:hover:not(:disabled) { background: rgba(200,215,235,0.09) }

        .btn-lg { padding: 13px 32px; font-size: 14px }

        /* Confirm */
        .confirm-box {
          background: rgba(180,192,210,0.07);
          border: 1px solid rgba(180,192,210,0.16);
          border-radius: 16px;
          overflow: hidden;
        }

        .confirm-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(180,192,210,0.16);
        }
        .confirm-row:last-of-type { border-bottom: none }
        .confirm-row.highlight { background: rgba(184,200,220,0.06) }

        .confirm-key { font-size: 13px; color: rgba(180,195,215,0.45); font-weight: 500 }
        .confirm-val { font-size: 13px; color: rgba(240,245,252,0.95); font-weight: 600; text-align: right; max-width: 60% }
        .confirm-amount { font-size: 18px; font-weight: 800; color: rgba(240,245,252,0.95) }

        .confirm-fee {
          font-size: 12px;
          color: rgba(180,195,215,0.32);
          margin-top: 12px;
          text-align: center;
        }

        /* Status */
        .status-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 48px 36px;
        }

        .status-icon { margin-bottom: 20px }

        .status-title {
          font-size: 22px;
          font-weight: 800;
          color: rgba(240,245,252,0.95);
          margin-bottom: 8px;
          letter-spacing: -0.3px;
        }

        .status-sub {
          font-size: 13px;
          color: rgba(180,195,215,0.38);
          margin-bottom: 28px;
        }

        @media (max-width: 768px) {
          .main { padding: 20px 16px 96px }
          .card { padding: 24px 20px }
          .field-row { grid-template-columns: 1fr; gap: 6px }
          .label { padding-top: 0 }
          .step-line { min-width: 20px }
        }
      `}</style>
    </div>
  )
}
