'use client'

import { useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/sidebar'

type Txn = {
  id: number
  from_account: string
  to_account: string
  amount: string | number
  description: string | null
  created_at: string
}

type Account = {
  account_number: string
  account_name: string
  balance: string | number
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-GB')
  } catch {
    return iso
  }
}

export default function EStatementPage() {
  const [accountNumber, setAccountNumber] = useState('')
  const [account, setAccount] = useState<Account | null>(null)
  const [transactions, setTransactions] = useState<Txn[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const acct = accountNumber.trim()
    if (!acct) { setError('Enter an account number.'); return }

    setLoading(true)
    try {
      const accountsRes = await fetch('/api/accounts')
      const accountsData = await accountsRes.json()
      const match: Account | undefined = (accountsData.accounts || []).find(
        (a: Account) => a.account_number === acct
      )
      if (!match) {
        setAccount(null)
        setTransactions([])
        setError('Account not found among your accounts.')
        return
      }
      setAccount(match)

      const txRes = await fetch(`/api/transactions?account=${encodeURIComponent(acct)}`)
      const txData = await txRes.json()
      if (txData.ok) {
        setTransactions(txData.transactions || [])
      } else {
        setError(txData.message || 'Could not load transactions.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const closing = account ? Number(account.balance) : 0
  let totalCredits = 0
  let totalDebits = 0
  for (const t of transactions) {
    if (t.to_account === accountNumber.trim()) totalCredits += Number(t.amount)
    if (t.from_account === accountNumber.trim()) totalDebits += Number(t.amount)
  }
  const opening = closing - totalCredits + totalDebits

  return (
    <div className="shell">
      <Sidebar />

      <main className="main">
        <header className="topbar">
          <h1 className="page-title">E-Statement</h1>
          <div className="topbar-right">
            <button className="icon-btn" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            </button>
            <Link href="/profile" className="avatar-wrap" aria-label="Profile" title="View profile">
              <img src="/person-logo.png" alt="profile" className="avatar" />
            </Link>
          </div>
        </header>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="search-card glass">
          <label htmlFor="stmt-acct" className="search-label">Account Number</label>
          <div className="search-row">
            <input
              id="stmt-acct"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter your account number"
              className="glass-input search-input"
            />
            <button type="submit" disabled={loading} className="btn-accent btn-search">
              {loading ? 'Loading…' : 'View'}
            </button>
          </div>
          {error && <p className="err-msg">{error}</p>}
        </form>

        {/* Statement panel */}
        {account && (
          <div className="statement glass">
            {/* Statement header */}
            <div className="stmt-header">
              <div className="stmt-logo-wrap">
                <img src="/loginlogo.png" alt="Nova Bank" className="stmt-logo" />
              </div>
              <div>
                <h2 className="stmt-bank">Nova Bank</h2>
                <p className="stmt-tagline">Bank Statement</p>
              </div>
            </div>

            <div className="stmt-divider" />

            {/* Account info */}
            <div className="stmt-info-grid">
              <div className="info-block">
                <span className="info-label">Account Holder</span>
                <span className="info-val">{account.account_name}</span>
              </div>
              <div className="info-block">
                <span className="info-label">Account Number</span>
                <span className="info-val mono">{account.account_number}</span>
              </div>
              <div className="info-block">
                <span className="info-label">Branch</span>
                <span className="info-val">Nova Bank</span>
              </div>
            </div>

            {/* Summary cards */}
            <div className="summary-grid">
              {[
                { label: 'Opening Balance', val: opening, color: 'rgba(180,200,225,0.10)', border: 'rgba(200,215,235,0.2)' },
                { label: 'Total Credits', val: totalCredits, color: 'rgba(48,209,88,0.1)', border: 'rgba(48,209,88,0.2)' },
                { label: 'Total Debits', val: totalDebits, color: 'rgba(255,69,58,0.1)', border: 'rgba(255,69,58,0.2)' },
                { label: 'Closing Balance', val: closing, color: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.2)' }
              ].map(({ label, val, color, border }) => (
                <div key={label} className="summary-card" style={{ background: color, border: `1px solid ${border}` }}>
                  <span className="summary-label">{label}</span>
                  <span className="summary-val">Rs. {val.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Transaction table */}
            <div className="stmt-divider" />
            <h3 className="txn-heading">Transaction History</h3>

            {transactions.length === 0 ? (
              <p className="empty">No transactions for this account.</p>
            ) : (
              <div className="table-wrap">
                <table className="txn-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Reference</th>
                      <th>Debit</th>
                      <th>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => {
                      const debit = t.from_account === accountNumber.trim()
                      return (
                        <tr key={t.id}>
                          <td>{formatDate(t.created_at)}</td>
                          <td>{t.description || '—'}</td>
                          <td className="mono">#{t.id}</td>
                          <td className={debit ? 'debit' : ''}>
                            {debit ? `Rs. ${Number(t.amount).toLocaleString()}` : ''}
                          </td>
                          <td className={!debit ? 'credit' : ''}>
                            {!debit ? `Rs. ${Number(t.amount).toLocaleString()}` : ''}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
        .avatar-wrap { width: 40px; height: 40px; border-radius: 12px; overflow: hidden; border: 1.5px solid rgba(180,200,225,0.30) }
        .avatar { width: 100%; height: 100%; object-fit: cover; display: block }

        .search-card { border-radius: 20px; padding: 24px 28px; margin-bottom: 24px }
        .search-label { font-size: 11px; font-weight: 600; color: rgba(180,195,215,0.38); letter-spacing: 0.6px; text-transform: uppercase; display: block; margin-bottom: 10px }
        .search-row { display: flex; gap: 12px; align-items: center }
        .search-input { flex: 1 }
        .err-msg { font-size: 13px; color: #ff6b63; font-weight: 600; margin-top: 10px; background: rgba(255,69,58,0.08); border: 1px solid rgba(255,69,58,0.2); border-radius: 8px; padding: 8px 12px }

        .btn-accent { background: linear-gradient(135deg,#c8d8e8 0%,#7a90a8 100%); border: none; border-radius: 999px; color: #0a0c10; font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(.4,0,.2,1); box-shadow: 0 0 24px rgba(180,200,225,0.25) }
        .btn-accent:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px) }
        .btn-accent:disabled { opacity: 0.5; cursor: not-allowed }
        .btn-search { padding: 13px 24px; font-size: 14px; white-space: nowrap }

        .statement { border-radius: 24px; padding: 32px }

        .stmt-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px }
        .stmt-logo-wrap { width: 52px; height: 52px; border-radius: 14px; overflow: hidden; border: 1px solid rgba(180,192,210,0.16) }
        .stmt-logo { width: 100%; height: 100%; object-fit: cover }
        .stmt-bank { font-size: 18px; font-weight: 800; color: rgba(240,245,252,0.95); margin-bottom: 2px }
        .stmt-tagline { font-size: 12px; color: rgba(180,195,215,0.38) }

        .stmt-divider { height: 1px; background: rgba(180,192,210,0.07); margin: 20px 0 }

        .stmt-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px }
        .info-block { display: flex; flex-direction: column; gap: 4px }
        .info-label { font-size: 11px; color: rgba(180,195,215,0.38); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px }
        .info-val { font-size: 14px; font-weight: 600; color: rgba(240,245,252,0.95) }
        .mono { font-family: monospace }

        .summary-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 8px }
        .summary-card { border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px }
        .summary-label { font-size: 10px; font-weight: 600; color: rgba(180,195,215,0.38); text-transform: uppercase; letter-spacing: 0.5px }
        .summary-val { font-size: 15px; font-weight: 700; color: rgba(240,245,252,0.95) }

        .txn-heading { font-size: 15px; font-weight: 700; color: rgba(180,195,215,0.65); margin-bottom: 16px }

        .empty { color: rgba(180,195,215,0.38); font-size: 14px; text-align: center; padding: 32px 0 }

        .table-wrap { overflow-x: auto }

        .txn-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 600px }

        .txn-table th {
          text-align: left;
          padding: 0 14px 10px 0;
          font-size: 11px;
          font-weight: 600;
          color: rgba(180,195,215,0.38);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(180,192,210,0.16);
        }

        .txn-table td {
          padding: 12px 14px 12px 0;
          color: rgba(180,195,215,0.65);
          border-bottom: 1px solid rgba(180,192,210,0.07);
        }

        .txn-table tr:last-child td { border-bottom: none }
        .txn-table tr:hover td { background: rgba(180,192,210,0.07) }

        .debit { color: #ff6b63 !important; font-weight: 600 }
        .credit { color: #30d158 !important; font-weight: 600 }

        @media (max-width: 900px) {
          .summary-grid { grid-template-columns: repeat(2,1fr) }
          .stmt-info-grid { grid-template-columns: 1fr 1fr }
        }

        @media (max-width: 768px) {
          .main { padding: 20px 16px 96px }
          .summary-grid { grid-template-columns: 1fr 1fr }
        }
      `}</style>
    </div>
  )
}
