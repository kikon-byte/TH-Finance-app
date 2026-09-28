import { useState } from 'react'
import { downloadCSV } from '../utils/downloadCSV'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export type StockCategory = 'Poultry Feed' | 'Piggery Feed' | 'Medicines & Vaccines' | 'Livestock' | 'Produce' | 'Equipment'

export type StockItem = {
  id: string
  code: string
  name: string
  category: StockCategory
  unit: string
  quantity: number
  unitPrice: number
  totalValue: number
  lastUpdated: string
  location: string
  reorderLevel: number
}

export type Investment = {
  id: string
  institution: string
  instrument: string
  accountNo: string
  depositDate: string
  maturityDate: string
  principalAmount: number
  interestRate: string
  accruedInterest: number
  status: 'Active' | 'Matured' | 'Renewed'
}

/* ── Clean baseline: All dummy stock and investments reset to zero ── */
const initialStock: StockItem[] = []
const initialInvestments: Investment[] = []

export default function StockRegister() {
  const [tab, setTab] = useState<'stock' | 'investments'>('stock')
  const [stockList, setStockList] = useState<StockItem[]>(initialStock)
  const [investments, setInvestments] = useState<Investment[]>(initialInvestments)
  const [search, setSearch] = useState('')
  const [showAddStock, setShowAddStock] = useState(false)
  const [showAddInv, setShowAddInv] = useState(false)

  const [newStock, setNewStock] = useState<Partial<StockItem>>({
    category: 'Poultry Feed',
    unit: 'Bags',
    quantity: 0,
    unitPrice: 0,
    location: 'Central Shed, Chümoukedima',
    reorderLevel: 10,
  })

  const [newInv, setNewInv] = useState<Partial<Investment>>({
    institution: 'Nagaland State Co-operative Bank (NSCB)',
    instrument: 'Fixed Deposit (FD)',
    principalAmount: 0,
    interestRate: '6.5% p.a.',
    status: 'Active',
  })

  const totalStockValue = stockList.reduce((s, i) => s + i.totalValue, 0)
  const totalStockUnits = stockList.reduce((s, i) => s + i.quantity, 0)
  const totalInvestments = investments.reduce((s, i) => s + i.principalAmount, 0)
  const totalAccrued = investments.reduce((s, i) => s + i.accruedInterest, 0)

  const filteredStock = stockList.filter(
    s => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  )

  const filteredInv = investments.filter(
    i => i.institution.toLowerCase().includes(search.toLowerCase()) || i.instrument.toLowerCase().includes(search.toLowerCase())
  )

  const handleExportCSV = () => {
    if (tab === 'stock') {
      downloadCSV(
        'thmcs-stock-register.csv',
        ['Item Code', 'Item Name', 'Category', 'Unit', 'Quantity', 'Unit Rate (₹)', 'Total Value (₹)', 'Location', 'Last Updated'],
        filteredStock.map(s => [s.code, s.name, s.category, s.unit, s.quantity, s.unitPrice, s.totalValue, s.location, s.lastUpdated])
      )
    } else {
      downloadCSV(
        'thmcs-investments-register.csv',
        ['Institution', 'Instrument', 'Account / FD No.', 'Deposit Date', 'Maturity Date', 'Principal (₹)', 'Rate', 'Accrued (₹)', 'Status'],
        filteredInv.map(i => [i.institution, i.instrument, i.accountNo, i.depositDate, i.maturityDate, i.principalAmount, i.interestRate, i.accruedInterest, i.status])
      )
    }
  }

  const handleSaveStock = () => {
    if (!newStock.name || !newStock.quantity) return
    const qty = Number(newStock.quantity) || 0
    const price = Number(newStock.unitPrice) || 0
    const item: StockItem = {
      id: `stk_${Date.now()}`,
      code: newStock.code || `STK-${String(stockList.length + 1).padStart(3, '0')}`,
      name: newStock.name,
      category: newStock.category || 'Poultry Feed',
      unit: newStock.unit || 'Kg',
      quantity: qty,
      unitPrice: price,
      totalValue: qty * price,
      lastUpdated: new Date().toISOString().split('T')[0],
      location: newStock.location || 'Central Shed',
      reorderLevel: Number(newStock.reorderLevel) || 5,
    }
    setStockList(prev => [...prev, item])
    setShowAddStock(false)
  }

  const handleSaveInvestment = () => {
    if (!newInv.institution || !newInv.principalAmount) return
    const principal = Number(newInv.principalAmount) || 0
    const inv: Investment = {
      id: `inv_${Date.now()}`,
      institution: newInv.institution,
      instrument: newInv.instrument || 'Fixed Deposit',
      accountNo: newInv.accountNo || `FD-${String(investments.length + 1).padStart(3, '0')}`,
      depositDate: newInv.depositDate || new Date().toISOString().split('T')[0],
      maturityDate: newInv.maturityDate || '1 Year',
      principalAmount: principal,
      interestRate: newInv.interestRate || '6.5% p.a.',
      accruedInterest: Number(newInv.accruedInterest) || 0,
      status: newInv.status || 'Active',
    }
    setInvestments(prev => [...prev, inv])
    setShowAddInv(false)
  }

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#e6edf3', margin: 0 }}>
          Stock &amp; Investment Register
        </h1>
        <p style={{ color: '#8b949e', fontSize: 13, margin: '4px 0 0' }}>
          Tribal Harvest Co-operative · Inventories, Feeds, Livestock &amp; Financial Bank Deposits
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Total Stock Valuation', value: fmt(totalStockValue), color: '#1a8cff' },
          { label: 'Stock Items on Hand', value: `${totalStockUnits} units`, color: '#00d4aa' },
          { label: 'Society Bank Investments', value: fmt(totalInvestments), color: '#3fb950' },
          { label: 'Accrued Term Interest', value: fmt(totalAccrued), color: '#f0b429' },
        ].map(k => (
          <div key={k.label} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>{k.label}</div>
            <div className="amount" style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 4, gap: 2 }}>
          <button
            onClick={() => setTab('stock')}
            style={{
              background: tab === 'stock' ? '#1a8cff' : 'transparent',
              color: tab === 'stock' ? 'white' : '#8b949e',
              border: 'none',
              borderRadius: 7,
              padding: '7px 18px',
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
            }}
          >
            📦 Stock Register ({stockList.length})
          </button>
          <button
            onClick={() => setTab('investments')}
            style={{
              background: tab === 'investments' ? '#1a8cff' : 'transparent',
              color: tab === 'investments' ? 'white' : '#8b949e',
              border: 'none',
              borderRadius: 7,
              padding: '7px 18px',
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
            }}
          >
            🏦 Society Investments ({investments.length})
          </button>
        </div>

        <input
          placeholder={tab === 'stock' ? 'Search stock items...' : 'Search investments...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: 220,
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: 6,
            padding: '6px 12px',
            color: '#e6edf3',
            fontSize: 12,
          }}
        />

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={handleExportCSV}>
            ⬇ Export CSV
          </button>
          {tab === 'stock' ? (
            <button className="btn-primary" onClick={() => setShowAddStock(true)}>
              + New Stock Item
            </button>
          ) : (
            <button className="btn-primary" onClick={() => setShowAddInv(true)}>
              + New Investment
            </button>
          )}
        </div>
      </div>

      {/* Stock Tab */}
      {tab === 'stock' && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #30363d', fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600, color: '#8b949e' }}>
            Current Warehouse &amp; Livestock Inventory
          </div>
          <div className="table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #30363d', background: '#0d1117', color: '#8b949e', fontSize: 12 }}>
                  <th style={{ padding: '10px 14px' }}>Item Code</th>
                  <th style={{ padding: '10px 14px' }}>Name / Description</th>
                  <th style={{ padding: '10px 14px' }}>Category</th>
                  <th style={{ padding: '10px 14px' }}>Unit</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Quantity</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Unit Rate</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Value</th>
                  <th style={{ padding: '10px 14px' }}>Location</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: '#8b949e', fontSize: 13 }}>
                      No stock items in inventory. All dummy data has been reset to zero.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #21262d' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#1a8cff' }}>{s.code}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#e6edf3' }}>{s.name}</td>
                      <td style={{ padding: '10px 14px', color: '#8b949e' }}>{s.category}</td>
                      <td style={{ padding: '10px 14px', color: '#8b949e' }}>{s.unit}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#e6edf3' }}>{s.quantity}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#8b949e' }}>{fmt(s.unitPrice)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#00d4aa' }}>{fmt(s.totalValue)}</td>
                      <td style={{ padding: '10px 14px', color: '#8b949e' }}>{s.location}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: s.quantity <= s.reorderLevel ? '#f8514922' : '#3fb95022', color: s.quantity <= s.reorderLevel ? '#f85149' : '#3fb950' }}>
                          {s.quantity <= s.reorderLevel ? 'Reorder' : 'Adequate'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: '#0d1117', fontWeight: 700 }}>
                  <td colSpan={6} style={{ padding: '10px 14px', color: '#8b949e' }}>Total Stock Valuation</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#00d4aa' }}>{fmt(totalStockValue)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Investments Tab */}
      {tab === 'investments' && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #30363d', fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600, color: '#8b949e' }}>
            Fixed Deposits, Co-operative Bank Shares &amp; Term Reserves
          </div>
          <div className="table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #30363d', background: '#0d1117', color: '#8b949e', fontSize: 12 }}>
                  <th style={{ padding: '10px 14px' }}>Institution</th>
                  <th style={{ padding: '10px 14px' }}>Instrument</th>
                  <th style={{ padding: '10px 14px' }}>A/C or FD No.</th>
                  <th style={{ padding: '10px 14px' }}>Deposit Date</th>
                  <th style={{ padding: '10px 14px' }}>Maturity Date</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Principal (₹)</th>
                  <th style={{ padding: '10px 14px' }}>Interest Rate</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Accrued Interest</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInv.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: '#8b949e', fontSize: 13 }}>
                      No investment or fixed deposit records found. All dummy data has been reset to zero.
                    </td>
                  </tr>
                ) : (
                  filteredInv.map(i => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #21262d' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#e6edf3' }}>{i.institution}</td>
                      <td style={{ padding: '10px 14px', color: '#8b949e' }}>{i.instrument}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#1a8cff' }}>{i.accountNo}</td>
                      <td style={{ padding: '10px 14px', color: '#8b949e' }}>{i.depositDate}</td>
                      <td style={{ padding: '10px 14px', color: '#8b949e' }}>{i.maturityDate}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#3fb950' }}>{fmt(i.principalAmount)}</td>
                      <td style={{ padding: '10px 14px', color: '#00d4aa' }}>{i.interestRate}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#f0b429' }}>{fmt(i.accruedInterest)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: '#3fb95022', color: '#3fb950' }}>{i.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: '#0d1117', fontWeight: 700 }}>
                  <td colSpan={5} style={{ padding: '10px 14px', color: '#8b949e' }}>Total Active Investments</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#3fb950' }}>{fmt(totalInvestments)}</td>
                  <td style={{ padding: '10px 14px' }} />
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#f0b429' }}>{fmt(totalAccrued)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStock && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 24, width: '100%', maxWidth: 480 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, color: '#e6edf3', fontFamily: 'var(--font-display)' }}>Add Stock Inventory Item</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Item Name</label>
                <input
                  style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                  value={newStock.name || ''}
                  onChange={e => setNewStock(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Grower Mash Feed (50kg)"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Category</label>
                  <select
                    style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                    value={newStock.category}
                    onChange={e => setNewStock(p => ({ ...p, category: e.target.value as StockCategory }))}
                  >
                    <option value="Poultry Feed">Poultry Feed</option>
                    <option value="Piggery Feed">Piggery Feed</option>
                    <option value="Medicines & Vaccines">Medicines &amp; Vaccines</option>
                    <option value="Livestock">Livestock</option>
                    <option value="Produce">Produce</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Unit</label>
                  <input
                    style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                    value={newStock.unit || ''}
                    onChange={e => setNewStock(p => ({ ...p, unit: e.target.value }))}
                    placeholder="Bags, Kgs, Nos."
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Quantity</label>
                  <input
                    type="number"
                    style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                    value={newStock.quantity ?? 0}
                    onChange={e => setNewStock(p => ({ ...p, quantity: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Rate Per Unit (₹)</label>
                  <input
                    type="number"
                    style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                    value={newStock.unitPrice ?? 0}
                    onChange={e => setNewStock(p => ({ ...p, unitPrice: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-ghost" onClick={() => setShowAddStock(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveStock}>Add Stock Item</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Investment Modal */}
      {showAddInv && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 24, width: '100%', maxWidth: 480 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, color: '#e6edf3', fontFamily: 'var(--font-display)' }}>Add Investment Record</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Financial Institution</label>
                <input
                  style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                  value={newInv.institution || ''}
                  onChange={e => setNewInv(p => ({ ...p, institution: e.target.value }))}
                  placeholder="e.g. Nagaland State Co-op Bank Ltd."
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Instrument</label>
                  <input
                    style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                    value={newInv.instrument || ''}
                    onChange={e => setNewInv(p => ({ ...p, instrument: e.target.value }))}
                    placeholder="Fixed Deposit / Share"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Principal Amount (₹)</label>
                  <input
                    type="number"
                    style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3' }}
                    value={newInv.principalAmount ?? 0}
                    onChange={e => setNewInv(p => ({ ...p, principalAmount: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-ghost" onClick={() => setShowAddInv(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveInvestment}>Save Investment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
