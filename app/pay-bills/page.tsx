'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Sidebar from '../../components/sidebar'

type Biller = { id: string; name: string; logo: string }

const billers: Biller[] = [
  { id: 'water', name: 'Water Board', logo: '/billers/water-board.png' },
  { id: 'cable', name: 'Cable TV', logo: '/billers/cable-tv.png' },
  { id: 'ceb', name: 'CEB', logo: '/billers/ceb.png' },
  { id: 'airtel', name: 'Airtel', logo: '/billers/airtel.png' },
  { id: 'dialog', name: 'Dialog', logo: '/billers/dialog.png' },
  { id: 'slt', name: 'Sri Lanka Telecom', logo: '/billers/electricity.png' },
  { id: 'peotv', name: 'PEO TV', logo: '/billers/mpesa.png' },
  { id: 'hutch', name: 'Hutch', logo: '/billers/hutch.png' },
  { id: 'aia', name: 'AIA', logo: '/billers/aia.png' },
  { id: 'lolc', name: 'LOLC', logo: '/billers/lolc.png' },
  { id: 'insurance2', name: 'Insurance', logo: '/billers/insurance2.png' },
  { id: 'hsbc', name: 'HSBC', logo: '/billers/hsbc.png' }
]

type Screen = 'select' | 'form' | 'success' | 'failed'
type Account = { account_number: string; account_name: string; balance: string | number }
type FormErrors = { fromAccount?: string; billId?: string; dueAmount?: string }

export default function PayBillsPage() {
  const [screen, setScreen] = useState<Screen>('select')
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [fromAccount, setFromAccount] = useState('')
  const [billId, setBillId] = useState('')
  const [dueAmount, setDueAmount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [confirmationNumber, setConfirmationNumber] = useState('')
  const [failReason, setFailReason] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
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

  function handleSelectBiller(biller: Biller) {
    setSelectedBiller(biller)
    setErrors({})
    setScreen('form')
  }

  function validateForm(): boolean {
    const e: FormErrors = {}
    if (!fromAccount) e.fromAccount = 'Select an account'
    if (!billId.trim()) e.billId = 'Bill ID is required'
    else if (billId.trim().length < 3) e.billId = 'Bill ID looks too short'
    if (!dueAmount.trim()) e.dueAmount = 'Amount is required'
    else if (isNaN(Number(dueAmount)) || Number(dueAmount) <= 0) e.dueAmount = 'Enter a valid amount'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handlePayNow() {
    if (!validateForm() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/pay-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAccount, biller: selectedBiller?.name || '', billId: billId.trim(), amount: Number(dueAmount) })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        setConfirmationNumber(String(data.transaction?.id ?? ''))
        setScreen('success')
      } else {
        setFailReason(data.message || 'Payment could not be completed.')
        setScreen('failed')
      }
    } catch {
      setFailReason('Network error. Please try again.')
      setScreen('failed')
    } finally {
      setSubmitting(false)
    }
  }

  function resetToHome() {
    setScreen('select')
    setSelectedBiller(null)
    setBillId('')
    setDueAmount('')
    setRemarks('')
    setErrors({})
  }

  return (
    <div className="shell">
      <Sidebar />

      <main className="main">
        <header className="topbar">
          <div>
            <h1 className="page-title">Pay Bills</h1>
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

        {/* Biller grid */}
        {screen === 'select' && (
          <div className="card glass">
            <h2 className="card-title">Select Biller</h2>
            <div className="biller-grid">
              {billers.map((b) => (
                <button key={b.id} onClick={() => handleSelectBiller(b)} className="biller-btn">
                  <div className="biller-icon">
                    <Image src={b.logo} alt={b.name} width={36} height={36} style={{ objectFit: 'contain' }} />
                  </div>
                  <span className="biller-name">{b.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Payment form */}
        {screen === 'form' && selectedBiller && (
          <div className="card glass">
            <button className="back-btn" onClick={() => setScreen('select')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back to billers
            </button>

            <div className="biller-header">
              <div className="biller-icon small">
                <Image src={selectedBiller.logo} alt={selectedBiller.name} width={26} height={26} style={{ objectFit: 'contain' }} />
              </div>
              <span className="biller-header-name">{selectedBiller.name}</span>
            </div>

            <div className="form-fields">
              <div className="field">
                <label className="label">Pay from account</label>
                <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} className="glass-select">
                  {accounts.length === 0 && <option value="">No accounts</option>}
                  {accounts.map((a) => (
                    <option key={a.account_number} value={a.account_number}>
                      {a.account_name} ({a.account_number}) — Rs. {Number(a.balance).toLocaleString()}
                    </option>
                  ))}
                </select>
                {errors.fromAccount && <span className="err">{errors.fromAccount}</span>}
              </div>

              <div className="field">
                <label className="label">Bill ID</label>
                <input value={billId} onChange={(e) => setBillId(e.target.value)} placeholder="Enter bill ID" className="glass-input" />
                {errors.billId && <span className="err">{errors.billId}</span>}
              </div>

              <div className="field">
                <label className="label">Due Amount (Rs.)</label>
                <input type="number" value={dueAmount} onChange={(e) => setDueAmount(e.target.value)} placeholder="0.00" className="glass-input" />
                {errors.dueAmount && <span className="err">{errors.dueAmount}</span>}
              </div>

              <div className="field">
                <label className="label">Remarks (optional)</label>
                <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" className="glass-input" />
              </div>
            </div>

            <button className="btn-accent btn-full" onClick={handlePayNow} disabled={submitting}>
              {submitting ? 'Processing…' : 'Pay Now'}
            </button>
          </div>
        )}

        {/* Success */}
        {screen === 'success' && (
          <div className="card glass status-card">
            <div className="status-icon">
              <svg viewBox="0 0 60 60" width="72" height="72" fill="none">
                <circle cx="30" cy="30" r="28" fill="rgba(48,209,88,0.15)" stroke="rgba(48,209,88,0.4)" strokeWidth="1.5"/>
                <path d="M18 31l8 8 16-16" stroke="#30d158" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="status-title">Payment Successful!</h2>
            <p className="status-sub">Confirmation #{confirmationNumber}</p>
            <button className="btn-accent btn-lg" onClick={resetToHome}>← Back to Home</button>
          </div>
        )}

        {/* Failed */}
        {screen === 'failed' && (
          <div className="card glass status-card">
            <div className="status-icon">
              <svg viewBox="0 0 60 60" width="72" height="72" fill="none">
                <circle cx="30" cy="30" r="28" fill="rgba(255,69,58,0.15)" stroke="rgba(255,69,58,0.4)" strokeWidth="1.5"/>
                <path d="M22 22l16 16M38 22L22 38" stroke="#ff453a" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="status-title">Payment Failed</h2>
            <p className="status-sub">{failReason}</p>
            <button className="btn-accent btn-lg" onClick={resetToHome}>← Try Again</button>
          </div>
        )}
      </main>

      <style jsx>{`
        .shell { display: flex; min-height: 100vh; background: linear-gradient(135deg,#050505 0%,#0a0a0a 50%,#111114 100%); background-attachment: fixed }
        .main { flex: 1; padding: 28px 32px 80px; overflow-y: auto; min-width: 0; max-width: 780px }

        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px }
        .page-title { font-size: 26px; font-weight: 800; color: rgba(240,245,252,0.95); letter-spacing: -0.5px }
        .topbar-right { display: flex; align-items: center; gap: 10px }
        .icon-btn { width: 40px; height: 40px; border-radius: 12px; background: rgba(180,192,210,0.07); border: 1px solid rgba(180,192,210,0.16); color: rgba(180,195,215,0.65); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s }
        .avatar-wrap { width: 40px; height: 40px; border-radius: 12px; overflow: hidden; border: 1.5px solid rgba(180,200,225,0.30) }
        .avatar { width: 100%; height: 100%; object-fit: cover; display: block }

        .card { border-radius: 24px; padding: 32px; background: rgba(180,192,210,0.07); border: 1px solid rgba(180,192,210,0.16); backdrop-filter: blur(28px) saturate(160%); -webkit-backdrop-filter: blur(28px) saturate(160%); box-shadow: 0 8px 40px rgba(0,0,0,0.45) }

        .card-title { font-size: 18px; font-weight: 800; color: rgba(240,245,252,0.95); margin-bottom: 24px; letter-spacing: -0.3px }

        .biller-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px }

        .biller-btn { display: flex; flex-direction: column; align-items: center; gap: 10px; background: rgba(180,192,210,0.07); border: 1px solid rgba(180,192,210,0.16); border-radius: 18px; padding: 20px 12px; cursor: pointer; transition: all 0.2s cubic-bezier(.4,0,.2,1) }
        .biller-btn:hover { background: rgba(200,215,235,0.09); border-color: rgba(180,200,225,0.30); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.25) }

        .biller-icon { width: 60px; height: 60px; border-radius: 16px; background: rgba(220,230,245,0.07); border: 1px solid rgba(180,192,210,0.16); display: flex; align-items: center; justify-content: center }
        .biller-icon.small { width: 40px; height: 40px; border-radius: 12px }

        .biller-name { font-size: 11px; font-weight: 600; color: rgba(180,195,215,0.65); text-align: center; line-height: 1.3 }

        .back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: rgba(180,195,215,0.38); font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; margin-bottom: 20px; transition: color 0.2s }
        .back-btn:hover { color: rgba(180,195,215,0.65) }

        .biller-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px }
        .biller-header-name { font-size: 16px; font-weight: 700; color: rgba(240,245,252,0.95) }

        .form-fields { display: flex; flex-direction: column; gap: 18px }

        .field { display: flex; flex-direction: column; gap: 7px }

        .label { font-size: 11px; font-weight: 600; color: rgba(180,195,215,0.45); letter-spacing: 0.6px; text-transform: uppercase }

        .err { font-size: 12px; color: #ff6b63; font-weight: 500 }

        .btn-accent { background: linear-gradient(135deg,#c8d8e8 0%,#7a90a8 100%); border: none; border-radius: 999px; color: #0a0c10; font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(.4,0,.2,1); box-shadow: 0 0 28px rgba(180,200,225,0.38) }
        .btn-accent:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px) }
        .btn-accent:disabled { opacity: 0.5; cursor: not-allowed }
        .btn-full { width: 100%; padding: 14px; font-size: 15px; margin-top: 24px }
        .btn-lg { padding: 13px 32px; font-size: 14px }

        .status-card { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 52px 36px }
        .status-icon { margin-bottom: 20px }
        .status-title { font-size: 22px; font-weight: 800; color: rgba(240,245,252,0.95); margin-bottom: 8px; letter-spacing: -0.3px }
        .status-sub { font-size: 13px; color: rgba(180,195,215,0.38); margin-bottom: 28px }

        @media (max-width: 768px) {
          .main { padding: 20px 16px 96px; max-width: 100% }
          .biller-grid { grid-template-columns: repeat(3, 1fr); gap: 14px }
          .card { padding: 22px 18px }
        }

        @media (max-width: 480px) {
          .biller-grid { grid-template-columns: repeat(2, 1fr) }
        }
      `}</style>
    </div>
  )
}
