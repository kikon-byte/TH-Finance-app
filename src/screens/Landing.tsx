import { Link } from 'react-router'
import { useRegisters } from '../context/RegistersContext'
import { useAccounting } from '../context/AccountingContext'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function Landing() {
  const { members, shareEntries } = useRegisters()
  const { cashBook, getBankBook, trialBalance } = useAccounting()

  const totalShareCapital = shareEntries.reduce((s, e) => s + (e.balance || e.noShares * 1000 || 0), 0)
  const totalSharesAllotted = shareEntries.reduce((s, e) => s + (e.noShares || 0), 0)
  const cashBalance = cashBook.closingBalance
  const bankBalance = getBankBook('acc_nstcb').closingBalance + getBankBook('acc_sbi').closingBalance

  const modules = [
    {
      to: '/dashboard',
      title: 'Executive Financial Dashboard',
      desc: 'High-level financial KPIs, liquidity status, trial balance & register overviews',
      icon: '⬡',
      tag: 'FINANCIAL COCKPIT',
      color: '#1a8cff',
      statLabel: 'Liquid Capital',
      statValue: fmt(cashBalance + bankBalance),
    },
    {
      to: '/members',
      title: 'Membership Master Register',
      desc: 'Revised 2026 roll of 22 tribal members with KYC, admission dates & share folios',
      icon: '👥',
      tag: 'MASTER REGISTER',
      color: '#00d4aa',
      statLabel: 'Enrolled Members',
      statValue: `${members.length} Members`,
    },
    {
      to: '/shares',
      title: 'Shareholder Ledger & NStCB Bank',
      desc: 'Official share allotment ledger, NStCB deposit challans & certificate records',
      icon: '📋',
      tag: 'STATUTORY CAPITAL',
      color: '#f0b429',
      statLabel: 'Paid-Up Shares',
      statValue: `${totalSharesAllotted} Shares (${fmt(totalShareCapital)})`,
    },
    {
      to: '/daybook',
      title: 'Daily Day Book & Double-Entry Cash',
      desc: 'Dual-pane Receipts & Payments, automated double-entry postings & trial balance',
      icon: '📒',
      tag: 'CORE ACCOUNTING',
      color: '#3fb950',
      statLabel: 'Day Book Audited',
      statValue: '₹1,35,531 (49 Entries)',
    },
    {
      to: '/migration',
      title: 'Historical Data Migration & Reconciliation',
      desc: 'Controlled 11-step audit migration of FY 2025-26 Day Book with exception handling',
      icon: '📥',
      tag: 'PHASE 2 MIGRATION',
      color: '#00d4aa',
      statLabel: 'Batch Status',
      statValue: '49 Extracted Rows',
    },
    {
      to: '/loans',
      title: 'Loan Register & Monthly Ledger',
      desc: 'Member loan disbursements, 10% p.a. interest, repayment schedules & ledgers',
      icon: '₹',
      tag: 'CREDIT OPERATIONS',
      color: '#a78bfa',
      statLabel: 'Active Loans O/S',
      statValue: '₹0 (Clean Baseline)',
    },
    {
      to: '/projects',
      title: 'Project Infrastructure Register',
      desc: 'Shed construction, infrastructure development works & grant tracking ledger',
      icon: '🏗',
      tag: 'INFRASTRUCTURE',
      color: '#fb923c',
      statLabel: 'Project Balance',
      statValue: '₹0 (Clean Baseline)',
    },
    {
      to: '/stock',
      title: 'Stock & Investment Register',
      desc: 'Warehouse feed inventory, livestock assets & society bank term deposits',
      icon: '📦',
      tag: 'SUPPLY & RESERVES',
      color: '#38bdf8',
      statLabel: 'Stock Valuation',
      statValue: '₹0 (Clean Baseline)',
    },
    {
      to: '/assets',
      title: 'Asset & Depreciation Register',
      desc: 'Fixed society assets, equipment, utensils & Income Tax WDV depreciation',
      icon: '🏛',
      tag: 'FIXED ASSETS',
      color: '#f43f5e',
      statLabel: 'Net Book Value',
      statValue: '₹0 (Clean Baseline)',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <header style={{ borderBottom: '1px solid #30363d', background: 'linear-gradient(180deg, #161b22 0%, #0d1117 100%)', padding: '48px 24px 36px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  background: 'linear-gradient(135deg, #1a8cff, #00d4aa)',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 26,
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(26,140,255,0.25)',
                }}
              >
                ₹
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, margin: 0, letterSpacing: -0.5 }}>
                  Tribal Harvest Co-operative Multipurpose Society Ltd.
                </h1>
                <p style={{ margin: '4px 0 0', color: '#8b949e', fontSize: 13 }}>
                  Regd. Office: Chümoukedima Town, Nagaland · Banker: Nagaland State Co-operative Bank Ltd.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ background: '#3fb95022', color: '#3fb950', border: '1px solid #3fb95044', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700 }}>
                ● SYSTEM OPERATIONAL
              </span>
              <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: 13 }}>
                Enter Dashboard →
              </Link>
            </div>
          </div>

          {/* Quick status bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: '#8b949e' }}>Preserved Member Master</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3', marginTop: 2 }}>{members.length} Registered Members</div>
            </div>
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: '#8b949e' }}>Statutory Share Capital (NStCB)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f0b429', marginTop: 2 }}>{fmt(totalShareCapital)}</div>
            </div>
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: '#8b949e' }}>Audited Day Book Register</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#00d4aa', marginTop: 2 }}>FY 2025–26 (₹55,410.13)</div>
            </div>
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: '#8b949e' }}>Accounting Engine</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#00d4aa', marginTop: 2 }}>Double-Entry Verified</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid: Operational Registers */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', flex: 1, width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, margin: 0, color: '#e6edf3' }}>
            Society Management Registers &amp; Books
          </h2>
          <p style={{ color: '#8b949e', fontSize: 13, margin: '4px 0 0' }}>
            Select an operational book below to inspect records, post double-entry vouchers, or generate CSV export statements.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
          {modules.map(m => (
            <Link
              key={m.to}
              to={m.to}
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 12,
                padding: '20px',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16,
                transition: 'transform 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = m.color
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#30363d'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: `${m.color}22`,
                      color: m.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    {m.icon}
                  </div>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      fontFamily: 'var(--font-display)',
                      color: m.color,
                      background: `${m.color}15`,
                      padding: '2px 8px',
                      borderRadius: 4,
                      letterSpacing: 0.5,
                    }}
                  >
                    {m.tag}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#e6edf3', margin: '0 0 6px' }}>
                  {m.title}
                </h3>
                <p style={{ fontSize: 12, color: '#8b949e', margin: 0, lineHeight: 1.45 }}>
                  {m.desc}
                </p>
              </div>

              <div style={{ borderTop: '1px solid #21262d', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#8b949e' }}>{m.statLabel}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.statValue}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #30363d', padding: '20px 24px', textAlign: 'center', fontSize: 12, color: '#8b949e' }}>
        Tribal Harvest Co-operative Multipurpose Society Ltd. (THMCS) · Registered under Nagaland Co-operative Societies Act · Clean Zero Baseline Configuration
      </footer>
    </div>
  )
}
