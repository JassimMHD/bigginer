export default function AccountsLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '32px 16px',
        background: 'linear-gradient(135deg, #050505 0%, #0a0a0a 50%, #111114 100%)'
      }}
    >
      {/* background orbs */}
      <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0, width: 600, height: 600, background: 'rgba(148,163,184,0.12)', top: -150, left: -150 }} />
      <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0, width: 500, height: 500, background: 'rgba(180,200,225,0.08)', bottom: -100, right: -100 }} />
      <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0, width: 350, height: 350, background: 'rgba(56,189,248,0.08)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1100 }}>
        {children}
      </div>
    </main>
  )
}
