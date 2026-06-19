'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/sidebar'

type Activity = {
  id: number
  event_type: string
  description: string
  metadata: Record<string, unknown>
  ip_address: string
  device_type: string
  created_at: string
}

const EVENT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  LOGIN: { label: 'Login', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', icon: '🔐' },
  LOGIN_FAILED: { label: 'Failed Login', color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: '⚠️' },
  LOGOUT: { label: 'Logout', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: '🚪' },
  SIGNUP: { label: 'Sign Up', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: '✨' },
  PASSWORD_RESET: { label: 'Password Reset', color: '#fb923c', bg: 'rgba(251,146,60,0.12)', icon: '🔑' },
  TRANSFER: { label: 'Transfer', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '💸' },
  PAY_BILL: { label: 'Bill Payment', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', icon: '🧾' },
  VIEW_STATEMENT: { label: 'View Statement', color: '#b8c8dc', bg: 'rgba(184,200,220,0.08)', icon: '📄' },
  ADD_ACCOUNT: { label: 'Add Account', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', icon: '➕' },
  DELETE_ACCOUNT: { label: 'Delete Account', color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: '🗑️' },
}

const DeviceIcon = ({ type }: { type: string }) => {
  if (type === 'mobile') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="18" r="1" fill="currentColor"/>
    </svg>
  )
  if (type === 'tablet') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="18.5" r="0.8" fill="currentColor"/>
    </svg>
  )
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 22h8M12 18v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}

const PAGE_SIZE = 20

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  async function fetchActivities(off: number) {
    setLoading(true)
    try {
      const res = await fetch(`/api/activity?limit=${PAGE_SIZE}&offset=${off}`)
      const data = await res.json()
      if (data.ok) {
        setActivities(data.activities)
        setTotal(data.total)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities(0)
  }, [])

  function goPage(off: number) {
    setOffset(off)
    fetchActivities(off)
  }

  const filtered = filter === 'ALL'
    ? activities
    : activities.filter(a => a.event_type === filter)

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  const eventTypes = ['ALL', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'TRANSFER', 'PAY_BILL', 'VIEW_STATEMENT', 'ADD_ACCOUNT', 'DELETE_ACCOUNT']

  return (
    <div className="page-root">
      <Sidebar />
      <main className="main">
        <div className="header">
          <div>
            <h1 className="title">Activity Log</h1>
            <p className="subtitle">Track all your account activity, logins, and transactions</p>
          </div>
          <div className="total-badge">{total} total events</div>
        </div>

        {/* Filter chips */}
        <div className="filters">
          {eventTypes.map(type => {
            const cfg = EVENT_CONFIG[type]
            const active = filter === type
            return (
              <button
                key={type}
                className={`filter-chip ${active ? 'active' : ''}`}
                style={active && cfg ? { background: cfg.bg, borderColor: cfg.color, color: cfg.color } : {}}
                onClick={() => setFilter(type)}
              >
                {cfg ? `${cfg.icon} ${cfg.label}` : 'All Events'}
              </button>
            )
          })}
        </div>

        {/* Activity list */}
        <div className="card">
          {loading ? (
            <div className="empty">
              <div className="spinner" />
              <p>Loading activity...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" opacity="0.3">
                <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z" stroke="#b8c8dc" strokeWidth="1.5"/>
                <path d="M12 8v5M12 16h.01" stroke="#b8c8dc" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p>No activity found</p>
            </div>
          ) : (
            <div className="activity-list">
              {filtered.map((a, i) => {
                const cfg = EVENT_CONFIG[a.event_type] ?? { label: a.event_type, color: '#b8c8dc', bg: 'rgba(184,200,220,0.08)', icon: '📋' }
                return (
                  <div key={a.id} className={`activity-item ${i < filtered.length - 1 ? 'bordered' : ''}`}>
                    <div className="event-badge" style={{ background: cfg.bg, borderColor: `${cfg.color}30` }}>
                      <span className="event-icon">{cfg.icon}</span>
                      <span className="event-label" style={{ color: cfg.color }}>{cfg.label}</span>
                    </div>
                    <div className="activity-body">
                      <p className="activity-desc">{a.description}</p>
                      <div className="activity-meta">
                        <span className="meta-chip">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                            <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          </svg>
                          {formatDate(a.created_at)}
                        </span>
                        <span className="meta-chip">
                          <DeviceIcon type={a.device_type} />
                          {a.device_type ?? 'unknown'}
                        </span>
                        <span className="meta-chip">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/>
                            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
                          </svg>
                          {a.ip_address ?? 'unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => goPage(offset - PAGE_SIZE)}
            >
              ← Prev
            </button>
            <span className="page-info">Page {currentPage} of {totalPages}</span>
            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => goPage(offset + PAGE_SIZE)}
            >
              Next →
            </button>
          </div>
        )}
      </main>

      <style jsx>{`
        .page-root {
          display: flex;
          min-height: 100vh;
          background: #07070a;
        }
        .main {
          flex: 1;
          padding: 40px 36px;
          max-width: 860px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .title {
          font-size: 26px;
          font-weight: 800;
          color: rgba(240,245,252,0.95);
          letter-spacing: -0.5px;
          margin: 0;
        }
        .subtitle {
          font-size: 13px;
          color: rgba(180,195,215,0.42);
          margin: 4px 0 0;
        }
        .total-badge {
          background: rgba(180,200,225,0.08);
          border: 1px solid rgba(180,200,225,0.14);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 12px;
          color: rgba(180,195,215,0.55);
          font-weight: 600;
          white-space: nowrap;
          align-self: center;
        }
        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .filter-chip {
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid rgba(180,192,210,0.12);
          background: rgba(180,192,210,0.05);
          color: rgba(180,195,215,0.45);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
        }
        .filter-chip:hover {
          background: rgba(180,192,210,0.1);
          color: rgba(240,245,252,0.7);
        }
        .filter-chip.active {
          font-weight: 700;
        }
        .card {
          background: rgba(16,16,22,0.7);
          border: 1px solid rgba(180,192,210,0.08);
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(20px);
        }
        .empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 64px 24px;
          color: rgba(180,195,215,0.35);
          font-size: 14px;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 2px solid rgba(180,200,225,0.15);
          border-top-color: rgba(180,200,225,0.6);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg) } }
        .activity-list {
          display: flex;
          flex-direction: column;
        }
        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 24px;
        }
        .activity-item.bordered {
          border-bottom: 1px solid rgba(180,192,210,0.06);
        }
        .event-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          border-radius: 999px;
          border: 1px solid transparent;
          white-space: nowrap;
          flex-shrink: 0;
          min-width: 130px;
        }
        .event-icon {
          font-size: 13px;
        }
        .event-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .activity-body {
          flex: 1;
          min-width: 0;
        }
        .activity-desc {
          font-size: 13.5px;
          color: rgba(220,230,245,0.82);
          font-weight: 500;
          margin: 0 0 8px;
          line-height: 1.4;
        }
        .activity-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .meta-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: rgba(180,195,215,0.38);
          font-weight: 500;
        }
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        .page-btn {
          padding: 8px 20px;
          border-radius: 10px;
          border: 1px solid rgba(180,192,210,0.12);
          background: rgba(180,192,210,0.06);
          color: rgba(180,195,215,0.65);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
        }
        .page-btn:hover:not(:disabled) {
          background: rgba(180,192,210,0.12);
          color: rgba(240,245,252,0.9);
        }
        .page-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .page-info {
          font-size: 13px;
          color: rgba(180,195,215,0.42);
          font-weight: 500;
        }
        @media (max-width: 768px) {
          .main {
            padding: 24px 16px 100px;
          }
          .activity-item {
            flex-direction: column;
            gap: 10px;
            padding: 16px;
          }
          .event-badge {
            min-width: unset;
          }
        }
      `}</style>
    </div>
  )
}
