import { useState } from 'react'
import { downloadCSV } from '../utils/downloadCSV'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

/* ── Types ───────────────────────────────────────────────────── */
type LoanStatus = 'Cleared' | 'Pending'
const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

export type Loan = {
  slno: number
  memberId: string
  name: string
  acNo: string
  address: string
  phone: string
  disburseDate: string
  amount: number
  interestRate: string
  repayDate: string
  principalPaid: number
  interestPaid: number
  principalOutstanding: number
  payments: (number | null)[]
}

/* ── Clean baseline: All dummy loans reset to 0 ──────────────── */
const initialLoans: Loan[] = []

type Tab = 'disbursement' | 'repayment' | 'ledger'

/* ── Shared badge ────────────────────────────────────────────── */
const StatusBadge = ({ s }: { s: LoanStatus }) => (
  <span
    className={s === 'Cleared' ? 'badge-green' : 'badge-yellow'}
    style={{
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      fontFamily: 'var(--font-display)',
    }}
  >
    {s}
  </span>
)

/* ════════════════════════════════════════════════════════════════ */
export default function LoanRegister() {
  const [loans, setLoans] = useState<Loan[]>(initialLoans)
  const [tab, setTab] = useState<Tab>('disbursement')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Loan | null>(loans[0] || null)
  const [showAdd, setShowAdd] = useState(false)
  const [newLoan, setNewLoan] = useState({
    memberId: '',
    name: '',
    acNo: '',
    address: 'Chümoukedima Town, Nagaland',
    phone: '',
    disburseDate: new Date().toISOString().split('T')[0],
    amount: 10000,
    interestRate: '10% p.a.',
    repayDate: '',
  })

  const filtered = loans.filter(l => l.name.toLowerCase().includes(search.toLowerCase()))

  const totalDisbursed = loans.reduce((s, l) => s + l.amount, 0)
  const totalRecovered = loans.reduce((s, l) => s + l.principalPaid, 0)
  const totalInterest = loans.reduce((s, l) => s + l.interestPaid, 0)
  const totalOutstanding = loans.reduce((s, l) => s + l.principalOutstanding, 0)

  const paidThisLoan = selected ? selected.payments.reduce<number>((s, p) => s + (p ?? 0), 0) : 0
  const outstanding = selected ? selected.amount - paidThisLoan : 0

  const handleDownload = () => {
    if (tab === 'disbursement') {
      downloadCSV(
        'thmcs-loan-disbursement.csv',
        ['Sl.No', 'Member ID', 'Name', 'A/C No', 'Disbursement Date', 'Amount (₹)', 'Interest Rate', 'Due Date', 'Status'],
        filtered.map(l => [
          l.slno,
          l.memberId,
          l.name,
          l.acNo,
          l.disburseDate,
          l.amount,
          l.interestRate,
          l.repayDate,
          l.principalOutstanding === 0 ? 'Cleared' : 'Pending',
        ])
      )
    } else if (tab === 'repayment') {
      downloadCSV(
        'thmcs-loan-repayment.csv',
        ['Sl.No', 'Name', 'Payment Date', 'Principal Paid', 'Interest Paid', 'Principal O/S'],
        filtered.map(l => [
          l.slno,
          l.name,
          l.principalPaid > 0 ? l.repayDate : 'NIL',
          l.principalPaid || 'NIL',
          l.interestPaid || 'NIL',
          l.principalOutstanding || 'Nil',
        ])
      )
    } else if (selected) {
      downloadCSV(
        `thmcs-loan-ledger-${selected.name}.csv`,
        ['Name', 'A/C No', 'Disbursed', 'Amount', 'Interest Rate', 'Repay Date', ...months, 'Total Paid', 'Outstanding'],
        [
          [
            selected.name,
            selected.acNo,
            selected.disburseDate,
            selected.amount,
            selected.interestRate,
            selected.repayDate,
            ...selected.payments.map(p => p ?? ''),
            paidThisLoan,
            outstanding,
          ],
        ]
      )
    }
  }

  const handleCreateLoan = () => {
    if (!newLoan.name || !newLoan.amount) return
    const l: Loan = {
      slno: loans.length + 1,
      memberId: newLoan.memberId || `M${String(loans.length + 1).padStart(3, '0')}`,
      name: newLoan.name,
      acNo: newLoan.acNo || `SB/${String(loans.length + 1).padStart(3, '0')}`,
      address: newLoan.address,
      phone: newLoan.phone,
      disburseDate: newLoan.disburseDate,
      amount: Number(newLoan.amount),
      interestRate: newLoan.interestRate,
      repayDate: newLoan.repayDate || 'One Year',
      principalPaid: 0,
      interestPaid: 0,
      principalOutstanding: Number(newLoan.amount),
      payments: months.map(() => null),
    }
    const updated = [...loans, l]
    setLoans(updated)
    setSelected(l)
    setShowAdd(false)
  }

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Page header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#e6edf3', margin: 0 }}>
          Loan Register &amp; Ledger
        </h1>
        <p style={{ color: '#8b949e', fontSize: 13, margin: '4px 0 0' }}>
          Own Funds · 10% p.a. · Disbursement, Repayment &amp; Monthly Ledger in one place
        </p>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Total Disbursed', value: totalDisbursed, color: '#1a8cff' },
          { label: 'Principal Recovered', value: totalRecovered, color: '#3fb950' },
          { label: 'Interest Collected', value: totalInterest, color: '#00d4aa' },
          { label: 'Outstanding', value: totalOutstanding, color: '#f0b429' },
        ].map(c => (
          <div key={c.label} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>{c.label}</div>
            <div className="amount" style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{fmt(c.value)}</div>
          </div>
        ))}
      </div>

      {/* Tab bar + controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 4, gap: 2 }}>
          {([
            ['disbursement', 'Disbursement Register'],
            ['repayment', 'Repayment Register'],
            ['ledger', 'Monthly Ledger'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                background: tab === id ? '#1a8cff' : 'transparent',
                color: tab === id ? 'white' : '#8b949e',
                border: 'none',
                borderRadius: 7,
                padding: '7px 18px',
                fontSize: 12.5,
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {tab !== 'ledger' && (
          <input
            placeholder="Search member..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: 200,
              background: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: 6,
              padding: '6px 12px',
              color: '#e6edf3',
              fontSize: 12,
            }}
          />
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={handleDownload}>
            ⬇ CSV
          </button>
          {tab === 'disbursement' && (
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
              + New Loan
            </button>
          )}
        </div>
      </div>

      {/* ── DISBURSEMENT ── */}
      {tab === 'disbursement' && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #30363d', fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600, color: '#8b949e' }}>
            Loan Disbursement · Own Funds
          </div>
          <div className="table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #30363d', background: '#0d1117', color: '#8b949e', fontSize: 12 }}>
                  <th style={{ padding: '10px 14px' }}>Sl.No</th>
                  <th style={{ padding: '10px 14px' }}>Member ID</th>
                  <th style={{ padding: '10px 14px' }}>Name</th>
                  <th style={{ padding: '10px 14px' }}>A/C No</th>
                  <th style={{ padding: '10px 14px' }}>Disbursement Date</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '10px 14px' }}>Interest Rate</th>
                  <th style={{ padding: '10px 14px' }}>Due Date</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: '#8b949e', fontSize: 13 }}>
                      No loan disbursement records found. All dummy data has been reset to zero.
                    </td>
                  </tr>
                ) : (
                  filtered.map(l => (
                    <tr key={l.slno} style={{ borderBottom: '1px solid #21262d' }}>
                      <td style={{ padding: '10px 14px', color: '#8b949e' }}>{l.slno}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#1a8cff' }}>{l.memberId}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#e6edf3' }}>{l.name}</td>
                      <td style={{ padding: '10px 14px', color: '#8b949e', fontSize: 12 }}>{l.acNo}</td>
                      <td style={{ padding: '10px 14px', color: '#8b949e', fontSize: 12 }}>{l.disburseDate}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#e6edf3' }}>{fmt(l.amount)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="badge-blue" style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{l.interestRate}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#8b949e', fontSize: 12 }}>{l.repayDate}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <StatusBadge s={l.principalOutstanding === 0 ? 'Cleared' : 'Pending'} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: '#0d1117', fontWeight: 700 }}>
                  <td colSpan={5} style={{ padding: '10px 14px', color: '#8b949e' }}>Total</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#1a8cff' }}>{fmt(totalDisbursed)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── REPAYMENT ── */}
      {tab === 'repayment' && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #30363d', fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600, color: '#8b949e' }}>
            Loan Re-payment Register
          </div>
          <div className="table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #30363d', background: '#0d1117', color: '#8b949e', fontSize: 12 }}>
                  <th style={{ padding: '10px 14px' }}>Sl.No</th>
                  <th style={{ padding: '10px 14px' }}>Name</th>
                  <th style={{ padding: '10px 14px' }}>Date of Payment</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Principal Paid</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Interest @10% p.a.</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Principal O/S</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Interest O/S</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#8b949e', fontSize: 13 }}>
                      No loan repayment records found. All dummy data has been reset to zero.
                    </td>
                  </tr>
                ) : (
                  filtered.map(l => (
                    <tr key={l.slno} style={{ borderBottom: '1px solid #21262d' }}>
                      <td style={{ padding: '10px 14px', color: '#8b949e' }}>{l.slno}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#e6edf3' }}>{l.name}</td>
                      <td style={{ padding: '10px 14px', color: '#8b949e', fontSize: 12 }}>{l.principalPaid > 0 ? l.repayDate : 'NIL'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: l.principalPaid > 0 ? '#3fb950' : '#8b949e' }}>
                        {l.principalPaid > 0 ? fmt(l.principalPaid) : 'NIL'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: l.interestPaid > 0 ? '#00d4aa' : '#8b949e' }}>
                        {l.interestPaid > 0 ? fmt(l.interestPaid) : 'NIL'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: l.principalOutstanding > 0 ? '#f0b429' : '#3fb950' }}>
                        {l.principalOutstanding > 0 ? fmt(l.principalOutstanding) : 'Nil'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#8b949e' }}>Nil</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: '#0d1117', fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: '10px 14px', color: '#8b949e' }}>Total</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#3fb950' }}>{fmt(totalRecovered)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#00d4aa' }}>{fmt(totalInterest)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#f0b429' }}>{fmt(totalOutstanding)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#8b949e' }}>Nil</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── MONTHLY LEDGER ── */}
      {tab === 'ledger' && (
        <div>
          {loans.length === 0 || !selected ? (
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 36, textAlign: 'center', color: '#8b949e' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>₹</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3', marginBottom: 6 }}>No Loan Ledger Accounts Active</div>
              <p style={{ fontSize: 13, maxWidth: 450, margin: '0 auto' }}>
                All dummy loan records have been reset to zero. Use the Disbursement Register to register a new loan when disbursed.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 18 }}>
              {/* Member sidebar */}
              <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden', alignSelf: 'start' }}>
                <div style={{ padding: '11px 16px', borderBottom: '1px solid #30363d', fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600, color: '#8b949e' }}>
                  Members ({loans.length})
                </div>
                {loans.map(l => {
                  const paid: number = l.payments.reduce<number>((s, p) => s + (p ?? 0), 0)
                  return (
                    <button
                      key={l.slno}
                      onClick={() => setSelected(l)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        background: selected.slno === l.slno ? 'linear-gradient(135deg,#1a8cff22,#00d4aa11)' : 'transparent',
                        borderTop: 'none',
                        borderRight: 'none',
                        borderBottom: '1px solid #21262d',
                        borderLeft: selected.slno === l.slno ? '3px solid #1a8cff' : '3px solid transparent',
                        padding: '11px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: selected.slno === l.slno ? '#1a8cff' : '#e6edf3' }}>{l.name}</div>
                      <div style={{ fontSize: 11, color: '#8b949e', marginTop: 1 }}>{l.acNo} · {l.disburseDate}</div>
                      <div style={{ marginTop: 4 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            fontFamily: 'var(--font-display)',
                            padding: '1px 6px',
                            borderRadius: 3,
                            ...(paid > 0
                              ? { background: '#3fb95022', color: '#3fb950', border: '1px solid #3fb95044' }
                              : { background: '#f0b42922', color: '#f0b429', border: '1px solid #f0b42944' }),
                          }}
                        >
                          {paid > 0 ? 'Repaid' : 'Pending'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Detail */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '18px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#e6edf3' }}>{selected.name}</div>
                      <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>{selected.address} · {selected.phone}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {[
                        { label: 'A/C No.', value: selected.acNo },
                        { label: 'Disbursed', value: selected.disburseDate },
                        { label: 'Repay By', value: selected.repayDate },
                        { label: 'Interest', value: selected.interestRate },
                      ].map(f => (
                        <div key={f.label} style={{ background: '#1c2330', border: '1px solid #30363d', borderRadius: 8, padding: '8px 14px' }}>
                          <div style={{ fontSize: 10, color: '#8b949e' }}>{f.label}</div>
                          <div className="amount" style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginTop: 1 }}>{f.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: '#8b949e' }}>Repayment Progress</span>
                      <span className="amount" style={{ color: '#00d4aa', fontWeight: 600 }}>{fmt(paidThisLoan)} / {fmt(selected.amount)}</span>
                    </div>
                    <div style={{ height: 7, background: '#1c2330', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, (paidThisLoan / selected.amount) * 100)}%`,
                          background: 'linear-gradient(90deg,#1a8cff,#00d4aa)',
                          borderRadius: 4,
                          transition: 'width 0.4s',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
                      <span style={{ color: '#3fb950' }}>Paid: {fmt(paidThisLoan)}</span>
                      <span style={{ color: outstanding > 0 ? '#f0b429' : '#3fb950' }}>Outstanding: {fmt(outstanding)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid #30363d', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: '#8b949e' }}>
                    Monthly Payment Schedule (Apr → Mar)
                  </div>
                  <div className="table-wrap" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #30363d', background: '#0d1117', color: '#8b949e', fontSize: 12 }}>
                          {months.map(m => (
                            <th key={m} style={{ padding: '8px 10px', textAlign: 'right', minWidth: 70 }}>{m}</th>
                          ))}
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>O/S</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {selected.payments.map((p, i) => (
                            <td key={i} className="amount" style={{ padding: '10px 10px', textAlign: 'right', color: p ? '#3fb950' : '#8b949e' }}>
                              {p ? fmt(p) : '—'}
                            </td>
                          ))}
                          <td className="amount" style={{ padding: '10px 10px', textAlign: 'right', color: '#00d4aa', fontWeight: 700 }}>{fmt(paidThisLoan)}</td>
                          <td className="amount" style={{ padding: '10px 10px', textAlign: 'right', color: outstanding > 0 ? '#f0b429' : '#3fb950', fontWeight: 700 }}>{fmt(outstanding)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Loan Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 24, width: '100%', maxWidth: 480 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, color: '#e6edf3', fontFamily: 'var(--font-display)' }}>Disburse New Member Loan</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Member Name</label>
                <input
                  style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                  value={newLoan.name}
                  onChange={e => setNewLoan(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. MS AKUMNARO SUYA"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Member ID</label>
                  <input
                    style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                    value={newLoan.memberId}
                    onChange={e => setNewLoan(p => ({ ...p, memberId: e.target.value }))}
                    placeholder="THMCS/MID/001/2025"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Loan A/C No.</label>
                  <input
                    style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                    value={newLoan.acNo}
                    onChange={e => setNewLoan(p => ({ ...p, acNo: e.target.value }))}
                    placeholder="LN-001"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Principal Amount (₹)</label>
                  <input
                    type="number"
                    style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                    value={newLoan.amount}
                    onChange={e => setNewLoan(p => ({ ...p, amount: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Disbursement Date</label>
                  <input
                    type="date"
                    style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                    value={newLoan.disburseDate}
                    onChange={e => setNewLoan(p => ({ ...p, disburseDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateLoan}>Confirm Loan</button>
            </div>
          </div>
        </div>
      )}

      {/* Audit note */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '11px 18px', fontSize: 12, color: '#8b949e' }}>
        <strong style={{ color: '#e6edf3' }}>Audit Notes:</strong> Members against loan in record · 1% above Bank Loan rate applies · NSCU = Yearly ₹100.
      </div>
    </div>
  )
}
