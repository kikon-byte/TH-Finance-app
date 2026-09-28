import { useState } from 'react'
import { useRegisters } from '../context/RegistersContext'
import { downloadCSV } from '../utils/downloadCSV'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function ProjectRegister() {
  const { projectEntries, addProjectEntry } = useRegisters()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    projectName: '',
    receipt: '',
    payment: '',
  })

  const filtered = projectEntries.filter(p =>
    p.projectName.toLowerCase().includes(search.toLowerCase())
  )

  const totalReceipts = projectEntries.reduce((s, p) => s + (p.receipt || 0), 0)
  const totalPayments = projectEntries.reduce((s, p) => s + (p.payment || 0), 0)
  const netBalance = totalReceipts - totalPayments

  const handleExportCSV = () => {
    downloadCSV(
      'thmcs-project-register.csv',
      ['Sl.No', 'Date', 'Project Name / Description', 'Receipt Grant (₹)', 'Expenditure Payment (₹)', 'Net (₹)'],
      filtered.map(p => [
        p.slno,
        p.date,
        p.projectName,
        p.receipt || 0,
        p.payment || 0,
        (p.receipt || 0) - (p.payment || 0),
      ])
    )
  }

  const handleSave = () => {
    if (!newEntry.projectName) return
    const receiptVal = newEntry.receipt ? Number(newEntry.receipt) : null
    const paymentVal = newEntry.payment ? Number(newEntry.payment) : null

    addProjectEntry({
      date: newEntry.date,
      projectName: newEntry.projectName,
      receipt: receiptVal,
      payment: paymentVal,
    })

    setShowAdd(false)
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      projectName: '',
      receipt: '',
      payment: '',
    })
  }

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#e6edf3', margin: 0 }}>
          Project Infrastructure Register
        </h1>
        <p style={{ color: '#8b949e', fontSize: 13, margin: '4px 0 0' }}>
          Tribal Harvest Co-operative · Shed Construction, Development Works &amp; Grant Utilization
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Project Entries', value: projectEntries.length, color: '#1a8cff' },
          { label: 'Total Grants Received', value: fmt(totalReceipts), color: '#3fb950' },
          { label: 'Total Project Expenditure', value: fmt(totalPayments), color: '#f85149' },
          { label: 'Net Project Balance', value: fmt(netBalance), color: '#00d4aa' },
        ].map(c => (
          <div key={c.label} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>{c.label}</div>
            <div className="amount" style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="Search project entries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: 260,
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: 6,
            padding: '7px 12px',
            color: '#e6edf3',
            fontSize: 12,
          }}
        />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={handleExportCSV}>
            ⬇ Export CSV
          </button>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            + Record Project Entry
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #30363d', fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600, color: '#8b949e' }}>
          Project Activity &amp; Expenditure Ledger
        </div>
        <div className="table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #30363d', background: '#0d1117', color: '#8b949e', fontSize: 12 }}>
                <th style={{ padding: '10px 14px' }}>Sl.No</th>
                <th style={{ padding: '10px 14px' }}>Date</th>
                <th style={{ padding: '10px 14px' }}>Project Name &amp; Description</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Receipt / Grant</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Payment / Expenditure</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Net Impact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px', color: '#8b949e', fontSize: 13 }}>
                    No project entries recorded yet. All dummy data has been reset to zero.
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const diff = (p.receipt || 0) - (p.payment || 0)
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #21262d' }}>
                      <td style={{ padding: '10px 14px', color: '#8b949e' }}>{p.slno}</td>
                      <td style={{ padding: '10px 14px', color: '#8b949e', fontSize: 12 }}>{p.date}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#e6edf3' }}>{p.projectName}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: p.receipt ? '#3fb950' : '#8b949e' }}>
                        {p.receipt ? fmt(p.receipt) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: p.payment ? '#f85149' : '#8b949e' }}>
                        {p.payment ? fmt(p.payment) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: diff >= 0 ? '#3fb950' : '#f85149' }}>
                        {fmt(diff)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#0d1117', fontWeight: 700 }}>
                <td colSpan={3} style={{ padding: '10px 14px', color: '#8b949e' }}>Total</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#3fb950' }}>{fmt(totalReceipts)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#f85149' }}>{fmt(totalPayments)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#00d4aa' }}>{fmt(netBalance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 24, width: '100%', maxWidth: 480 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, color: '#e6edf3', fontFamily: 'var(--font-display)' }}>Record Project Activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Date</label>
                <input
                  type="date"
                  style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                  value={newEntry.date}
                  onChange={e => setNewEntry(p => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Project Work &amp; Description</label>
                <input
                  style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                  value={newEntry.projectName}
                  onChange={e => setNewEntry(p => ({ ...p, projectName: e.target.value }))}
                  placeholder="e.g. Shed Roof CGI Sheet Installation"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Receipt / Grant (₹)</label>
                  <input
                    type="number"
                    style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                    value={newEntry.receipt}
                    onChange={e => setNewEntry(p => ({ ...p, receipt: e.target.value }))}
                    placeholder="Leave blank if 0"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Payment / Cost (₹)</label>
                  <input
                    type="number"
                    style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                    value={newEntry.payment}
                    onChange={e => setNewEntry(p => ({ ...p, payment: e.target.value }))}
                    placeholder="Leave blank if 0"
                  />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>Save Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
