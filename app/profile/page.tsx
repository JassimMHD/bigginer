'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import Link from 'next/link'

type User = {
  id: number
  username: string
  role: string
  full_name: string
  email: string
}

type Account = {
  id: number
  account_number: string
  account_name: string
  balance: string | number
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/accounts').then((r) => r.json())
    ])
      .then(([meData, acctData]) => {
        if (!active) return
        if (meData.ok) setUser(meData.user)
        if (acctData.ok) setAccounts(acctData.accounts || [])
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function handleLogout() {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    router.push('/login')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0)

  return (
    <div className="shell">
      <Sidebar />

      <main className="main">
        {/* Header */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="back-btn" onClick={() => router.back()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <h1 className="page-title">Profile</h1>
          </div>
          <Link href="/profile" className="avatar-wrap" aria-label="Profile">
            <img src="/person-logo.png" alt="profile" className="avatar" />
          </Link>
        </header>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading profile…</p>
          </div>
        ) : (
          <div className="profile-layout">
            {/* Left — identity card */}
            <div className="identity-card glass">
              <div className="avatar-hero">
                <div className="avatar-circle">
                  <span className="avatar-initials">{initials}</span>
                </div>
                <div className="avatar-glow" />
              </div>

              <h2 className="user-name">{user?.full_name || user?.username || '—'}</h2>
              <p className="user-role">{user?.role === 'admin' ? 'Administrator' : 'Account Holder'}</p>

              <div className="balance-pill">
                <span className="balance-label">Total Balance</span>
                <span className="balance-val">Rs. {totalBalance.toLocaleString()}</span>
              </div>

              <button className="logout-btn" onClick={handleLogout}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sign Out
              </button>
            </div>

            {/* Right — details */}
            <div className="details-col">
              {/* Personal info */}
              <div className="section-card glass">
                <h3 className="section-title">
                  <span className="section-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    </svg>
                  </span>
                  Personal Information
                </h3>
                <div className="info-rows">
                  <div className="info-row">
                    <span className="info-key">Full Name</span>
                    <span className="info-val">{user?.full_name || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Username</span>
                    <span className="info-val mono">{user?.username || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Email</span>
                    <span className="info-val">{user?.email || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Role</span>
                    <span className="info-val">
                      <span className={`role-badge ${user?.role === 'admin' ? 'admin' : 'user'}`}>
                        {user?.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked accounts */}
              <div className="section-card glass">
                <h3 className="section-title">
                  <span className="section-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.7"/>
                      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.7"/>
                      <path d="M6 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    </svg>
                  </span>
                  Linked Accounts
                  <span className="count-badge">{accounts.length}</span>
                </h3>

                {accounts.length === 0 ? (
                  <p className="empty-msg">No accounts linked.</p>
                ) : (
                  <div className="account-list">
                    {accounts.map((a, i) => {
                      const colors = ['rgba(180,200,225,0.12)', 'rgba(56,189,248,0.15)', 'rgba(52,211,153,0.15)', 'rgba(251,191,36,0.15)']
                      const borders = ['rgba(200,215,235,0.22)', 'rgba(56,189,248,0.28)', 'rgba(52,211,153,0.28)', 'rgba(251,191,36,0.28)']
                      return (
                        <div key={a.id} className="account-row" style={{ background: colors[i % colors.length], border: `1px solid ${borders[i % borders.length]}` }}>
                          <div className="account-row-left">
                            <span className="account-name">{a.account_name}</span>
                            <span className="account-num mono">••••{String(a.account_number).slice(-4)}</span>
                          </div>
                          <span className="account-bal">Rs. {Number(a.balance).toLocaleString()}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="section-card glass">
                <h3 className="section-title">
                  <span className="section-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/>
                      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    </svg>
                  </span>
                  Quick Actions
                </h3>
                <div className="actions-row">
                  <Link href="/bank-transfer" className="action-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 16H20M20 16L17 13M20 16L17 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 8H4M4 8L7 5M4 8L7 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Transfer
                  </Link>
                  <Link href="/bank-accounts" className="action-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 10h20" stroke="currentColor" strokeWidth="1.8"/><path d="M6 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    Accounts
                  </Link>
                  <Link href="/e-statement" className="action-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8L14 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    Statement
                  </Link>
                  <Link href="/reset-password" className="action-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    Change Password
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .shell { display: flex; min-height: 100vh; background: linear-gradient(135deg,#050505 0%,#0a0a0a 50%,#111114 100%); background-attachment: fixed }
        .main { flex: 1; padding: 28px 32px 80px; overflow-y: auto; min-width: 0 }

        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px }
        .topbar-left { display: flex; align-items: center; gap: 16px }

        .back-btn { display: inline-flex; align-items: center; gap: 6px; background: rgba(180,192,210,0.07); border: 1px solid rgba(180,192,210,0.16); border-radius: 10px; color: rgba(180,195,215,0.65); font-size: 13px; font-weight: 600; padding: 8px 14px; cursor: pointer; transition: all 0.2s }
        .back-btn:hover { background: rgba(200,215,235,0.09); color: rgba(240,245,252,0.85) }

        .page-title { font-size: 26px; font-weight: 800; color: rgba(240,245,252,0.95); letter-spacing: -0.5px }

        .avatar-wrap { width: 40px; height: 40px; border-radius: 12px; overflow: hidden; border: 1.5px solid rgba(200,215,235,0.22); box-shadow: 0 0 14px rgba(180,200,225,0.25); display: block }
        .avatar { width: 100%; height: 100%; object-fit: cover; display: block }

        .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 80px 0; color: rgba(180,195,215,0.45) }
        .spinner { width: 36px; height: 36px; border: 3px solid rgba(180,192,210,0.16); border-top-color: #b8c8dc; border-radius: 50%; animation: spin 0.8s linear infinite }
        @keyframes spin { to { transform: rotate(360deg) } }

        .profile-layout { display: grid; grid-template-columns: 280px 1fr; gap: 20px; align-items: start }

        /* Identity card */
        .identity-card { border-radius: 24px; padding: 32px 24px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0; position: sticky; top: 20px }

        .avatar-hero { position: relative; margin-bottom: 20px }

        .avatar-circle { width: 88px; height: 88px; border-radius: 50%; background: linear-gradient(135deg, rgba(180,200,225,0.3), rgba(100,116,139,0.4)); border: 2px solid rgba(200,215,235,0.22); display: flex; align-items: center; justify-content: center; position: relative; z-index: 1 }

        .avatar-initials { font-size: 32px; font-weight: 800; color: rgba(240,245,252,0.95); letter-spacing: -1px }

        .avatar-glow { position: absolute; inset: -8px; border-radius: 50%; background: radial-gradient(circle, rgba(180,200,225,0.2) 0%, transparent 70%); z-index: 0 }

        .user-name { font-size: 18px; font-weight: 800; color: rgba(240,245,252,0.95); margin-bottom: 4px; letter-spacing: -0.3px }

        .user-role { font-size: 12px; color: rgba(180,195,215,0.38); margin-bottom: 24px; letter-spacing: 0.3px }

        .balance-pill { background: rgba(180,200,225,0.09); border: 1px solid rgba(180,192,210,0.16); border-radius: 14px; padding: 14px 20px; width: 100%; margin-bottom: 20px; display: flex; flex-direction: column; gap: 4px }
        .balance-label { font-size: 10px; font-weight: 600; color: rgba(180,195,215,0.38); text-transform: uppercase; letter-spacing: 0.6px }
        .balance-val { font-size: 20px; font-weight: 800; color: rgba(240,245,252,0.95); letter-spacing: -0.5px }

        .logout-btn { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,69,58,0.1); border: 1px solid rgba(255,69,58,0.25); border-radius: 999px; color: #ff6b63; font-size: 13px; font-weight: 700; padding: 10px 22px; cursor: pointer; transition: all 0.2s; width: 100%; justify-content: center }
        .logout-btn:hover { background: rgba(255,69,58,0.18); border-color: rgba(255,69,58,0.4) }

        /* Details */
        .details-col { display: flex; flex-direction: column; gap: 16px }

        .section-card { border-radius: 20px; padding: 24px }

        .section-title { font-size: 14px; font-weight: 700; color: rgba(180,195,215,0.65); margin-bottom: 18px; display: flex; align-items: center; gap: 8px }

        .section-icon { width: 28px; height: 28px; border-radius: 8px; background: rgba(180,200,225,0.12); border: 1px solid rgba(180,192,210,0.16); display: flex; align-items: center; justify-content: center; color: #b8c8dc; flex-shrink: 0 }

        .count-badge { margin-left: auto; background: rgba(180,200,225,0.12); border: 1px solid rgba(180,192,210,0.16); border-radius: 6px; padding: 2px 8px; font-size: 11px; color: #b8c8dc; font-weight: 700 }

        /* Info rows */
        .info-rows { display: flex; flex-direction: column; gap: 0 }

        .info-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(180,192,210,0.07) }
        .info-row:last-child { border-bottom: none }

        .info-key { font-size: 12px; color: rgba(180,195,215,0.38); font-weight: 500 }
        .info-val { font-size: 13px; color: rgba(240,245,252,0.85); font-weight: 600; text-align: right }
        .mono { font-family: monospace; letter-spacing: 0.3px }

        .role-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 6px }
        .role-badge.admin { background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3) }
        .role-badge.user { background: rgba(180,200,225,0.12); color: #b8c8dc; border: 1px solid rgba(180,192,210,0.16) }

        /* Account list */
        .empty-msg { font-size: 13px; color: rgba(180,195,215,0.32); text-align: center; padding: 16px 0 }

        .account-list { display: flex; flex-direction: column; gap: 10px }

        .account-row { border-radius: 12px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center }

        .account-row-left { display: flex; flex-direction: column; gap: 3px }
        .account-name { font-size: 13px; font-weight: 700; color: rgba(240,245,252,0.88) }
        .account-num { font-size: 11px; color: rgba(180,195,215,0.38) }
        .account-bal { font-size: 14px; font-weight: 800; color: rgba(240,245,252,0.92) }

        /* Actions */
        .actions-row { display: flex; flex-wrap: wrap; gap: 10px }

        .action-pill { display: inline-flex; align-items: center; gap: 7px; background: rgba(180,192,210,0.07); border: 1px solid rgba(180,192,210,0.16); border-radius: 999px; color: rgba(180,195,215,0.65); font-size: 13px; font-weight: 600; padding: 9px 18px; text-decoration: none; transition: all 0.2s }
        .action-pill:hover { background: rgba(200,215,235,0.09); border-color: rgba(200,215,235,0.22); color: rgba(240,245,252,0.95) }

        /* Responsive */
        @media (max-width: 900px) {
          .profile-layout { grid-template-columns: 1fr }
          .identity-card { position: static }
        }

        @media (max-width: 768px) {
          .main { padding: 20px 16px 96px }
          .page-title { font-size: 22px }
        }
      `}</style>
    </div>
  )
}
