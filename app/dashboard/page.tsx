'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '../../components/sidebar'

type Account = {
  account_number: string
  account_name: string
  balance: string | number
}

type Txn = {
  id: number
  from_account: string
  to_account: string
  amount: string | number
  description: string | null
  created_at: string
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function Dashboard() {
  const [firstName, setFirstName] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Txn[]>([])

  useEffect(() => {
    let active = true

    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (active && d.ok) setFirstName(String(d.user.full_name || '').split(' ')[0]) })
      .catch(() => {})

    fetch('/api/accounts')
      .then((r) => r.json())
      .then((d) => {
        if (!active || !d.ok) return
        const list: Account[] = d.accounts || []
        setAccounts(list)
        const primary = list[0]?.account_number
        if (primary) {
          return fetch(`/api/transactions?account=${encodeURIComponent(primary)}`)
            .then((r) => r.json())
            .then((td) => { if (active && td.ok) setTransactions((td.transactions || []).slice(0, 6)) })
        }
      })
      .catch(() => {})

    return () => { active = false }
  }, [])

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0)
  const primaryAccount = accounts[0]?.account_number || ''

  return (
    <div className="shell">
      <Sidebar />

      <main className="main">
        {/* Header */}
        <header className="topbar">
          <div>
            <p className="greeting">Good day{firstName ? `, ${firstName}` : ''} 👋</p>
            <h1 className="page-title">Dashboard</h1>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
                <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
            <button className="icon-btn" aria-label="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <span className="notif-dot" />
            </button>
            <Link href="/profile" className="avatar-wrap" aria-label="Profile" title="View profile">
              <img src="/person-logo.png" alt="profile" className="avatar" />
            </Link>
          </div>
        </header>

        {/* Balance hero */}
        <div className="hero-card glass">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-inner">
            <div>
              <p className="hero-label">Total Balance</p>
              <p className="hero-amount">Rs. {totalBalance.toLocaleString()}</p>
              <p className="hero-sub">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="hero-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="3" stroke="rgba(180,195,215,0.65)" strokeWidth="1.5" />
                <path d="M2 10h20" stroke="rgba(180,195,215,0.65)" strokeWidth="1.5" />
                <path d="M6 15h4" stroke="rgba(180,195,215,0.65)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="accounts-row">
            {accounts.slice(0, 3).map((a) => (
              <div key={a.account_number} className="acct-chip">
                <span className="acct-num">••••{String(a.account_number).slice(-4)}</span>
                <span className="acct-bal">Rs. {Number(a.balance).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="section-row">
          <h2 className="section-title">Quick Actions</h2>
        </div>
        <div className="actions-grid">
          {[
            { label: 'Transfer', href: '/bank-transfer', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M7 16H20M20 16L17 13M20 16L17 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 8H4M4 8L7 5M4 8L7 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>, color: 'rgba(180,200,225,0.12)', border: 'rgba(180,200,225,0.22)' },
            { label: 'Pay Bills', href: '/pay-bills', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 4v16l2-2 2 2 2-2 2 2 2-2 2 2 2-2V4l-2 2-2-2-2 2-2-2-2 2-2-2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M9 10h6M9 14h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>, color: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.3)' },
            { label: 'Accounts', href: '/bank-accounts', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.6"/><path d="M2 10h20" stroke="currentColor" strokeWidth="1.6"/><path d="M6 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>, color: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.3)' },
            { label: 'Statement', href: '/e-statement', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8L14 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>, color: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)' }
          ].map(({ label, href, icon, color, border }) => (
            <a key={label} href={href} className="action-card glass">
              <span className="action-icon" style={{ background: color, border: `1px solid ${border}` }}>
                {icon}
              </span>
              <span className="action-label">{label}</span>
            </a>
          ))}
        </div>

        {/* Transactions */}
        <div className="section-row">
          <h2 className="section-title">Recent Transactions</h2>
          <a href="/e-statement" className="view-all-link">View all →</a>
        </div>

        <div className="txn-card glass">
          {transactions.length === 0 && (
            <p className="empty">No recent transactions.</p>
          )}
          {transactions.map((t) => {
            const outgoing = t.from_account === primaryAccount
            const counterparty = outgoing ? t.to_account : t.from_account
            const sign = outgoing ? '-' : '+'
            const isPositive = !outgoing
            return (
              <div key={t.id} className="txn-row">
                <div className="txn-avatar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="txn-info">
                  <p className="txn-desc">{t.description || `••••${String(counterparty).slice(-4)}`}</p>
                  <p className="txn-date">{formatDate(t.created_at)}</p>
                </div>
                <div className="txn-right">
                  <span className={`txn-amount ${isPositive ? 'positive' : 'negative'}`}>
                    {sign}Rs. {Number(t.amount).toLocaleString()}
                  </span>
                  <span className="txn-badge">Success</span>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      <style jsx>{`
        .shell {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg,#050505 0%,#0a0a0a 50%,#111114 100%);
          background-attachment: fixed;
        }

        .main {
          flex: 1;
          padding: 28px 32px 80px;
          overflow-y: auto;
          min-width: 0;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .greeting {
          font-size: 13px;
          color: rgba(180,195,215,0.45);
          margin-bottom: 3px;
        }

        .page-title {
          font-size: 26px;
          font-weight: 800;
          color: rgba(240,245,252,0.95);
          letter-spacing: -0.5px;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(180,192,210,0.07);
          border: 1px solid rgba(180,192,210,0.16);
          color: rgba(180,195,215,0.65);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        .icon-btn:hover { background: rgba(200,215,235,0.09); color: rgba(240,245,252,0.90) }

        .notif-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #b8c8dc;
          box-shadow: 0 0 6px rgba(180,200,225,0.28);
          border: 1.5px solid #0a0a0a;
        }

        .avatar-wrap {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          overflow: hidden;
          border: 1.5px solid rgba(180,200,225,0.30);
          box-shadow: 0 0 14px rgba(180,200,225,0.08);
        }
        .avatar { width: 100%; height: 100%; object-fit: cover; display: block }

        /* Hero card */
        .hero-card {
          border-radius: 24px;
          padding: 28px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(50px);
          pointer-events: none;
        }
        .hero-orb-1 { width: 250px; height: 250px; background: rgba(148,163,184,0.12); top: -80px; right: -40px }
        .hero-orb-2 { width: 180px; height: 180px; background: rgba(56,189,248,0.08); bottom: -40px; left: -20px }

        .hero-inner {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .hero-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(180,195,215,0.45);
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .hero-amount {
          font-size: 36px;
          font-weight: 800;
          color: rgba(240,245,252,0.95);
          letter-spacing: -1px;
          line-height: 1;
          margin-bottom: 6px;
        }

        .hero-sub { font-size: 12px; color: rgba(180,195,215,0.38) }

        .hero-badge {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: rgba(180,192,210,0.07);
          border: 1px solid rgba(180,192,210,0.16);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .accounts-row {
          position: relative;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .acct-chip {
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: rgba(180,192,210,0.07);
          border: 1px solid rgba(180,192,210,0.16);
          border-radius: 10px;
          padding: 8px 14px;
        }

        .acct-num { font-size: 11px; color: rgba(180,195,215,0.45); font-family: monospace }
        .acct-bal { font-size: 13px; font-weight: 700; color: rgba(240,245,252,0.90) }

        /* Quick actions */
        .section-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: rgba(180,195,215,0.65);
          letter-spacing: 0.2px;
        }

        .view-all-link {
          font-size: 12px;
          font-weight: 600;
          color: rgba(180,200,225,0.65);
          text-decoration: none;
          transition: color 0.2s;
        }
        .view-all-link:hover { color: #b8c8dc }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }

        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 20px 12px;
          border-radius: 18px;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
          cursor: pointer;
        }
        .action-card:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,0.4) }

        .action-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(240,245,252,0.90);
          flex-shrink: 0;
        }

        .action-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(180,195,215,0.65);
          text-align: center;
        }

        /* Transactions */
        .txn-card {
          border-radius: 22px;
          overflow: hidden;
          padding: 8px 0;
        }

        .empty {
          text-align: center;
          color: rgba(180,195,215,0.32);
          padding: 40px 20px;
          font-size: 14px;
        }

        .txn-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 22px;
          border-bottom: 1px solid rgba(180,192,210,0.07);
          transition: background 0.15s;
        }
        .txn-row:last-child { border-bottom: none }
        .txn-row:hover { background: rgba(220,230,245,0.07) }

        .txn-avatar {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(180,192,210,0.07);
          border: 1px solid rgba(180,192,210,0.16);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(180,195,215,0.45);
          flex-shrink: 0;
        }

        .txn-info { flex: 1; min-width: 0 }

        .txn-desc {
          font-size: 13px;
          font-weight: 600;
          color: rgba(240,245,252,0.90);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
        }

        .txn-date { font-size: 11px; color: rgba(180,195,215,0.32) }

        .txn-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .txn-amount {
          font-size: 14px;
          font-weight: 700;
        }
        .txn-amount.positive { color: #30d158 }
        .txn-amount.negative { color: rgba(180,195,215,0.58) }

        .txn-badge {
          font-size: 10px;
          font-weight: 600;
          color: #30d158;
          background: rgba(48,209,88,0.12);
          border: 1px solid rgba(48,209,88,0.25);
          border-radius: 6px;
          padding: 2px 7px;
        }

        @media (max-width: 768px) {
          .main { padding: 20px 16px 96px }
          .hero-amount { font-size: 28px }
          .actions-grid { grid-template-columns: repeat(2, 1fr) }
        }

        @media (max-width: 480px) {
          .main { padding: 16px 12px 96px }
          .actions-grid { gap: 10px }
          .txn-row { padding: 12px 14px }
        }
      `}</style>
    </div>
  )
}
