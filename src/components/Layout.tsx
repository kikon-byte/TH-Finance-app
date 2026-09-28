import { NavLink, Outlet, useLocation } from 'react-router'

const NAV = [
  { to: '/dashboard', label: 'Dashboard',          icon: '⬡' },
  { to: '/members',   label: 'Members',             icon: '👥' },
  { to: '/daybook',   label: 'Day Book',            icon: '📒' },
  { to: '/migration', label: 'Historical Migration', icon: '📥' },
  { to: '/loans',     label: 'Loan Register',       icon: '₹' },
  { to: '/shares',    label: 'Share Ledger',        icon: '📋' },
  { to: '/projects',  label: 'Project Register',    icon: '🏗' },
  { to: '/stock',     label: 'Stock & Investment',  icon: '📦' },
  { to: '/assets',    label: 'Asset Register',      icon: '🏛' },
]

export default function Layout() {
  const loc = useLocation()
  const isHome = loc.pathname === '/'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0d1117' }}>
      {!isHome && (
        <header style={{
          background: '#161b22',
          borderBottom: '1px solid #30363d',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          height: 52,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 30, height: 30,
              background: 'linear-gradient(135deg, #1a8cff, #00d4aa)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'white',
            }}>₹</div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#e6edf3' }}>THMCS Ltd.</div>
              <div style={{ fontSize: 9, color: '#8b949e' }}>Tribal Harvest Finance</div>
            </div>
          </NavLink>

          <div style={{ width: 1, height: 24, background: '#30363d', flexShrink: 0 }} />

          <nav style={{ display: 'flex', gap: 0, overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
            {NAV.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  background: isActive ? 'linear-gradient(135deg,#1a8cff22,#00d4aa11)' : 'transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: isActive ? '2px solid #1a8cff' : '2px solid transparent',
                  color: isActive ? '#1a8cff' : '#8b949e',
                  borderRadius: '5px 5px 0 0',
                  padding: '6px 11px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  display: 'flex', alignItems: 'center', gap: 4,
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  transition: 'color 0.15s, background 0.15s',
                })}
              >
                <span style={{ fontSize: 11 }}>{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>

          <div style={{
            background: '#3fb95022', color: '#3fb950',
            border: '1px solid #3fb95044',
            borderRadius: 20, padding: '2px 9px',
            fontSize: 10, fontWeight: 700,
            fontFamily: 'var(--font-display)',
            flexShrink: 0,
          }}>● LIVE</div>
        </header>
      )}

      <main style={{ flex: 1, padding: isHome ? 0 : '24px 20px', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
