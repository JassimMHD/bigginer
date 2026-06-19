'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

type IconProps = { size?: number }

const LayoutGrid = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

const CreditCard = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M2 10h20" stroke="currentColor" strokeWidth="1.6" />
    <path d="M6 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const ArrowLeftRight = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M7 16H20M20 16L17 13M20 16L17 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 8H4M4 8L7 5M4 8L7 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Receipt = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 4v16l2-2 2 2 2-2 2 2 2-2 2 2 2-2V4l-2 2-2-2-2 2-2-2-2 2-2-2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M9 10h6M9 14h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const TrendingUp = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 17l5-5 4 4 7-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 8h5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const FileText = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8L14 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const Settings = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="1.2" />
  </svg>
)

const HelpCircle = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9.5 10a2.5 2.5 0 1 1 5 0c0 1.75-2 2.25-2 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const LogOut = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', Icon: LayoutGrid },
  { label: 'Accounts', path: '/bank-accounts', Icon: CreditCard },
  { label: 'Bank Transfer', path: '/bank-transfer', Icon: ArrowLeftRight },
  { label: 'Pay Bills', path: '/pay-bills', Icon: Receipt },
  { label: 'Smart Spend', path: '/smart-spend', Icon: TrendingUp },
  { label: 'E-Statement', path: '/e-statement', Icon: FileText }
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [helpOpen, setHelpOpen] = useState(false)

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    router.push('/login')
  }

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-inner">
          {/* Logo */}
          <div className="logo-area">
            <div className="logo-ring">
              <img src="/loginlogo.png" alt="Nova Bank" className="logo-img" />
            </div>
            <div>
              <p className="brand">NOVA BANK</p>
              <p className="brand-sub">Digital Banking</p>
            </div>
          </div>

          <div className="divider" />

          {/* Nav */}
          <nav className="nav">
            {menuItems.map(({ label, path, Icon }) => {
              const active = pathname === path
              return (
                <Link key={path} href={path} className="nav-link">
                  <span className={`nav-item ${active ? 'active' : ''}`}>
                    <span className="nav-icon">
                      <Icon size={17} />
                    </span>
                    <span className="nav-label">{label}</span>
                    {active && <span className="active-dot" />}
                  </span>
                </Link>
              )
            })}
          </nav>

          <div className="spacer" />

          {/* Footer */}
          <div className="sidebar-footer">
            <Link href="/profile" className="footer-btn" aria-label="Settings" title="Settings">
              <Settings size={18} />
            </Link>
            <button type="button" className="footer-btn" aria-label="Help" title="Help" onClick={() => setHelpOpen(true)}>
              <HelpCircle size={18} />
            </button>
            <button type="button" className="footer-btn logout" onClick={handleLogout} aria-label="Log out" title="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {menuItems.map(({ label, path, Icon }) => {
          const active = pathname === path
          return (
            <Link key={path} href={path} className={`mobile-nav-item ${active ? 'active' : ''}`}>
              <Icon size={20} />
              <span>{label.split(' ')[0]}</span>
            </Link>
          )
        })}
        <Link href="/profile" className={`mobile-nav-item ${pathname === '/profile' ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <span>Profile</span>
        </Link>
      </nav>

      {/* Help modal */}
      {helpOpen && (
        <div className="modal-overlay" onClick={() => setHelpOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#b8c8dc" strokeWidth="1.7"/>
                <path d="M12 17h.01" stroke="#b8c8dc" strokeWidth="1.7" strokeLinecap="round"/>
                <path d="M9.5 10a2.5 2.5 0 1 1 5 0c0 1.75-2 2.25-2 3.5" stroke="#b8c8dc" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="modal-title">Need Help?</h3>
            <p className="modal-text">
              Nova Bank support is available 24/7.
            </p>
            <div className="modal-contact">
              <div className="contact-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.7"/><path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.7"/></svg>
                <span>support@novabank.lk</span>
              </div>
              <div className="contact-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.61 19a19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3-8.18A2 2 0 0 1 4.11 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.92z" stroke="currentColor" strokeWidth="1.7"/></svg>
                <span>+94 11 234 5678</span>
              </div>
            </div>
            <button className="modal-close" onClick={() => setHelpOpen(false)}>Close</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .sidebar {
          width: 240px;
          min-height: 100vh;
          flex-shrink: 0;
          position: relative;
          z-index: 10;
        }

        .sidebar-inner {
          position: sticky;
          top: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 24px 16px 20px;
          background: linear-gradient(180deg, rgba(28,28,35,0.55) 0%, rgba(8,8,12,0.82) 100%);
          border-right: 1px solid rgba(220,230,245,0.07);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 6px 4px;
        }

        .logo-ring {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: rgba(180,200,225,0.12);
          border: 1px solid rgba(200,215,235,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          padding: 4px;
          box-shadow: 0 0 18px rgba(180,200,225,0.22);
        }

        .logo-img {
          width: 100%;
          height: 100%;
          border-radius: 10px;
          object-fit: cover;
        }

        .brand {
          color: rgba(240,245,252,0.95);
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 1.2px;
          line-height: 1.2;
        }

        .brand-sub {
          color: rgba(180,195,215,0.38);
          font-size: 10px;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        .divider {
          height: 1px;
          background: rgba(180,192,210,0.07);
          margin: 20px 0;
        }

        .nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-link {
          text-decoration: none;
          display: block;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 12px;
          color: rgba(180,195,215,0.52);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.2px;
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
          cursor: pointer;
          position: relative;
        }

        .nav-item:hover {
          background: rgba(180,192,210,0.07);
          color: rgba(240,245,252,0.88);
          transform: translateX(2px);
        }

        .nav-item.active {
          background: rgba(180,200,225,0.12);
          border: 1px solid rgba(200,215,235,0.22);
          color: rgba(240,245,252,0.95);
          box-shadow: 0 0 20px rgba(180,200,225,0.15);
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          flex-shrink: 0;
          background: rgba(255,255,255,0.05);
          transition: all 0.2s;
        }

        .nav-item.active .nav-icon {
          background: rgba(180,200,225,0.18);
        }

        .nav-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .active-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #b8c8dc;
          box-shadow: 0 0 8px rgba(180,200,225,0.8);
          flex-shrink: 0;
        }

        .spacer { flex: 1 }

        .sidebar-footer {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 6px 0;
          border-top: 1px solid rgba(180,192,210,0.07);
        }

        .footer-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(180,192,210,0.07);
          border: 1px solid rgba(180,192,210,0.07);
          color: rgba(180,195,215,0.45);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .footer-btn:hover {
          background: rgba(200,215,235,0.09);
          color: rgba(240,245,252,0.85);
          border-color: rgba(180,192,210,0.16);
        }
        .footer-btn.logout:hover {
          background: rgba(255,69,58,0.15);
          border-color: rgba(255,69,58,0.3);
          color: #ff6b63;
        }

        /* Mobile bottom nav */
        .mobile-nav {
          display: none;
        }

        /* Help modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-box {
          background: rgba(10,10,14,0.95);
          border: 1px solid rgba(180,192,210,0.16);
          border-radius: 24px;
          padding: 32px 28px;
          max-width: 340px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(220,230,245,0.07);
        }

        .modal-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: rgba(180,200,225,0.12);
          border: 1px solid rgba(180,192,210,0.16);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 800;
          color: rgba(240,245,252,0.95);
          letter-spacing: -0.3px;
        }

        .modal-text {
          font-size: 13px;
          color: rgba(180,195,215,0.45);
          line-height: 1.5;
        }

        .modal-contact {
          background: rgba(180,192,210,0.07);
          border: 1px solid rgba(180,192,210,0.07);
          border-radius: 14px;
          padding: 14px 18px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .contact-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: rgba(180,195,215,0.65);
          font-weight: 500;
        }

        .modal-close {
          background: linear-gradient(135deg, #c8d8e8, #7a90a8);
          border: none;
          border-radius: 999px;
          color: #0a0c10;
          font-size: 13px;
          font-weight: 700;
          padding: 11px 32px;
          cursor: pointer;
          margin-top: 4px;
          transition: all 0.2s;
          box-shadow: 0 0 20px rgba(180,200,225,0.35);
        }
        .modal-close:hover { filter: brightness(1.1); transform: translateY(-1px) }

        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }

          .mobile-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 100;
            background: rgba(8,8,12,0.92);
            border-top: 1px solid rgba(180,192,210,0.16);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            padding: 8px 0 max(8px, env(safe-area-inset-bottom));
          }

          .mobile-nav-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            color: rgba(180,195,215,0.45);
            text-decoration: none;
            font-size: 10px;
            font-weight: 600;
            padding: 6px 4px;
            border-radius: 10px;
            transition: all 0.2s;
          }

          .mobile-nav-item.active {
            color: #b8c8dc;
          }

          .mobile-nav-item:hover {
            color: rgba(240,245,252,0.8);
          }
        }
      `}</style>
    </>
  )
}
