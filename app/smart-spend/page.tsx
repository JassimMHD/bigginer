'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/sidebar'

type Account = { account_number: string; account_name: string; balance: string | number }
type Txn = { id: number; from_account: string; to_account: string; amount: string | number; description: string | null; created_at: string }

export default function SmartSpendPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Txn[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/accounts')
        const data = await res.json()
        if (!active || !data.ok) return
        const list: Account[] = data.accounts || []
        setAccounts(list)

        const all: Txn[] = []
        for (const a of list) {
          const txRes = await fetch(`/api/transactions?account=${encodeURIComponent(a.account_number)}`)
          const txData = await txRes.json()
          if (txData.ok) all.push(...(txData.transactions || []))
        }
        if (!active) return
        const byId = new Map<number, Txn>()
        for (const t of all) byId.set(t.id, t)
        setTransactions([...byId.values()])
      } catch {
        // leave empty on failure
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  const ownNumbers = useMemo(() => new Set(accounts.map((a) => a.account_number)), [accounts])

  const { totalSpent, totalReceived, byCategory } = useMemo(() => {
    let spent = 0
    let received = 0
    const cats = new Map<string, number>()
    for (const t of transactions) {
      const amount = Number(t.amount)
      const outgoing = ownNumbers.has(t.from_account)
      const incoming = ownNumbers.has(t.to_account)
      if (outgoing && incoming) continue
      if (outgoing) {
        spent += amount
        const label = t.description?.trim() || 'Other'
        cats.set(label, (cats.get(label) || 0) + amount)
      } else if (incoming) {
        received += amount
      }
    }
    return { totalSpent: spent, totalReceived: received, byCategory: [...cats.entries()].sort((a, b) => b[1] - a[1]) }
  }, [transactions, ownNumbers])

  const maxCat = byCategory.length > 0 ? byCategory[0][1] : 0
  const netFlow = totalReceived - totalSpent

  const CAT_COLORS = ['#94b8d4', '#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#4ade80']

  return (
    <div className="shell">
      <Sidebar />

      <main className="main">
        <header className="topbar">
          <div>
            <h1 className="page-title">Smart Spend</h1>
            <p className="page-sub">Your spending at a glance</p>
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

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading your spending data…</p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="stats-grid">
              <div className="stat-card glass spent">
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M7 16H20M20 16L17 13M20 16L17 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p className="stat-label">Total Spent</p>
                <p className="stat-val spent-val">Rs. {totalSpent.toLocaleString()}</p>
                <p className="stat-meta">{byCategory.length} categories</p>
              </div>

              <div className="stat-card glass received">
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 8H4M4 8L7 5M4 8L7 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p className="stat-label">Total Received</p>
                <p className="stat-val received-val">Rs. {totalReceived.toLocaleString()}</p>
                <p className="stat-meta">{transactions.filter(t => ownNumbers.has(t.to_account) && !ownNumbers.has(t.from_account)).length} credits</p>
              </div>

              <div className="stat-card glass net">
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17l5-5 4 4 7-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 8h5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p className="stat-label">Net Flow</p>
                <p className={`stat-val ${netFlow >= 0 ? 'net-positive' : 'net-negative'}`}>
                  {netFlow >= 0 ? '+' : ''}Rs. {netFlow.toLocaleString()}
                </p>
                <p className="stat-meta">{netFlow >= 0 ? 'Surplus' : 'Deficit'} this period</p>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="cat-card glass">
              <h2 className="cat-title">Spending by Category</h2>
              {byCategory.length === 0 ? (
                <p className="empty">No spending data yet.</p>
              ) : (
                <ul className="cat-list">
                  {byCategory.map(([label, value], i) => {
                    const pct = maxCat ? (value / maxCat) * 100 : 0
                    const color = CAT_COLORS[i % CAT_COLORS.length]
                    return (
                      <li key={label} className="cat-item">
                        <div className="cat-row">
                          <div className="cat-dot" style={{ background: color }} />
                          <span className="cat-label">{label}</span>
                          <span className="cat-pct">{pct.toFixed(0)}%</span>
                          <span className="cat-val">Rs. {value.toLocaleString()}</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </main>

      <style jsx>{`
        .shell { display: flex; min-height: 100vh; background: linear-gradient(135deg,#050505 0%,#0a0a0a 50%,#111114 100%); background-attachment: fixed }
        .main { flex: 1; padding: 28px 32px 80px; overflow-y: auto; min-width: 0 }

        .topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 12px }
        .page-title { font-size: 26px; font-weight: 800; color: rgba(240,245,252,0.95); letter-spacing: -0.5px; margin-bottom: 3px }
        .page-sub { font-size: 13px; color: rgba(180,195,215,0.38) }
        .topbar-right { display: flex; align-items: center; gap: 10px }
        .icon-btn { width: 40px; height: 40px; border-radius: 12px; background: rgba(180,192,210,0.07); border: 1px solid rgba(180,192,210,0.16); color: rgba(180,195,215,0.65); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s }
        .avatar-wrap { width: 40px; height: 40px; border-radius: 12px; overflow: hidden; border: 1.5px solid rgba(180,200,225,0.30) }
        .avatar { width: 100%; height: 100%; object-fit: cover; display: block }

        .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 80px 0; color: rgba(180,195,215,0.4) }
        .spinner { width: 36px; height: 36px; border: 3px solid rgba(180,192,210,0.16); border-top-color: #b8c8dc; border-radius: 50%; animation: spin 0.8s linear infinite }
        @keyframes spin { to { transform: rotate(360deg) } }

        .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 24px }

        .stat-card { border-radius: 20px; padding: 24px; position: relative; overflow: hidden }

        .stat-icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(180,192,210,0.07); border: 1px solid rgba(180,192,210,0.16); display: flex; align-items: center; justify-content: center; color: rgba(180,195,215,0.65); margin-bottom: 16px }

        .stat-label { font-size: 11px; font-weight: 600; color: rgba(180,195,215,0.38); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px }

        .stat-val { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px }
        .spent-val { color: #ff6b63 }
        .received-val { color: #30d158 }
        .net-positive { color: #30d158 }
        .net-negative { color: #ff6b63 }

        .stat-meta { font-size: 11px; color: rgba(180,195,215,0.38) }

        .cat-card { border-radius: 22px; padding: 28px }

        .cat-title { font-size: 17px; font-weight: 800; color: rgba(240,245,252,0.95); margin-bottom: 24px; letter-spacing: -0.3px }

        .empty { color: rgba(180,195,215,0.38); font-size: 14px; text-align: center; padding: 32px 0 }

        .cat-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 20px }

        .cat-item {}

        .cat-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px }

        .cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0 }

        .cat-label { flex: 1; font-size: 13px; font-weight: 600; color: rgba(180,195,215,0.65); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }

        .cat-pct { font-size: 11px; color: rgba(180,195,215,0.38); font-weight: 600; min-width: 36px; text-align: right }

        .cat-val { font-size: 13px; font-weight: 700; color: rgba(240,245,252,0.95); min-width: 120px; text-align: right }

        .bar-track { height: 6px; background: rgba(180,192,210,0.07); border-radius: 999px; overflow: hidden }

        .bar-fill { height: 100%; border-radius: 999px; transition: width 0.6s cubic-bezier(.4,0,.2,1); opacity: 0.85 }

        @media (max-width: 768px) {
          .main { padding: 20px 16px 96px }
          .stats-grid { grid-template-columns: 1fr 1fr }
          .stat-val { font-size: 20px }
        }

        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr }
          .cat-val { min-width: auto }
        }
      `}</style>
    </div>
  )
}
