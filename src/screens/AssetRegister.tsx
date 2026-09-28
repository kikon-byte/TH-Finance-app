import { useState } from 'react'
import { downloadCSV } from '../utils/downloadCSV'

/* ── types ──────────────────────────────────────────────────── */
type Category = 'Utensils & Crockery' | 'Serving Equipment' | 'Vehicles' | 'Machinery & Equipment' | 'Furniture & Fixtures'

type Asset = {
  slno: number
  name: string
  category: Category
  purchaseDate: string
  quantity: number
  unit: string
  ratePerUnit: number
  grossValue: number       // quantity × ratePerUnit
  depreciationPct: number  // % per annum (WDV method)
  yearsHeld: number
  netBookValue: number     // computed on add
  condition: 'Good' | 'Fair' | 'Poor'
  remarks: string
}

/* ── depreciation calc (WDV) ────────────────────────────────── */
const calcNBV = (gross: number, pct: number, years: number) =>
  Math.round(gross * Math.pow(1 - pct / 100, years))

/* ── colour map per category ─────────────────────────────────── */
const CAT_COLOR: Record<Category, string> = {
  'Utensils & Crockery':    '#f0b429',
  'Serving Equipment':      '#00d4aa',
  'Vehicles':               '#1a8cff',
  'Machinery & Equipment':  '#a78bfa',
  'Furniture & Fixtures':   '#fb923c',
}

const CAT_ICON: Record<Category, string> = {
  'Utensils & Crockery':   '🍳',
  'Serving Equipment':     '🍽',
  'Vehicles':              '🚐',
  'Machinery & Equipment': '⚙️',
  'Furniture & Fixtures':  '🪑',
}

/* Standard depreciation rates (Income Tax / WDV) */
const DEP_RATES: Record<Category, number> = {
  'Utensils & Crockery':   15,
  'Serving Equipment':     15,
  'Vehicles':              15,
  'Machinery & Equipment': 15,
  'Furniture & Fixtures':  10,
}

/* ── seed data: Clean baseline reset to zero ── */
const seed: Omit<Asset, 'slno' | 'grossValue' | 'netBookValue'>[] = []

const initialAssets: Asset[] = []

const CATEGORIES = Object.keys(CAT_COLOR) as Category[]

const fmt  = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const conditionBadge = (c: Asset['condition']) => {
  const map = { Good: ['#3fb95022','#3fb950','#3fb95044'], Fair: ['#f0b42922','#f0b429','#f0b42944'], Poor: ['#f8514922','#f85149','#f8514944'] }
  const [bg, color, border] = map[c]
  return <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{c}</span>
}

/* ════════════════════════════════════════════════════════════════ */
export default function AssetRegister() {
  const [assets, setAssets]         = useState<Asset[]>(initialAssets)
  const [catFilter, setCatFilter]   = useState<Category | 'All'>('All')
  const [search, setSearch]         = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [draft, setDraft]           = useState<Partial<Asset>>({
    category: 'Utensils & Crockery', condition: 'Good', depreciationPct: 15, yearsHeld: 1,
  })

  const filtered = assets.filter(a => {
    if (catFilter !== 'All' && a.category !== catFilter) return false
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  /* category totals for summary cards */
  const totalGross = assets.reduce((s, a) => s + a.grossValue, 0)
  const totalNBV   = assets.reduce((s, a) => s + a.netBookValue, 0)
  const totalDep   = totalGross - totalNBV

  const byCategory = CATEGORIES.map(cat => ({
    cat,
    gross: assets.filter(a => a.category === cat).reduce((s, a) => s + a.grossValue, 0),
    nbv:   assets.filter(a => a.category === cat).reduce((s, a) => s + a.netBookValue, 0),
    count: assets.filter(a => a.category === cat).length,
  }))

  const saveAsset = () => {
    const gross = (draft.quantity || 0) * (draft.ratePerUnit || 0)
    const nbv   = calcNBV(gross, draft.depreciationPct || 15, draft.yearsHeld || 1)
    setAssets(prev => [...prev, {
      slno: prev.length + 1,
      name: draft.name || '',
      category: draft.category as Category,
      purchaseDate: draft.purchaseDate || '',
      quantity: draft.quantity || 0,
      unit: draft.unit || 'nos',
      ratePerUnit: draft.ratePerUnit || 0,
      grossValue: gross,
      depreciationPct: draft.depreciationPct || 15,
      yearsHeld: draft.yearsHeld || 1,
      netBookValue: nbv,
      condition: draft.condition as Asset['condition'] || 'Good',
      remarks: draft.remarks || '',
    }])
    setDraft({ category: 'Utensils & Crockery', condition: 'Good', depreciationPct: 15, yearsHeld: 1 })
    setShowAdd(false)
  }

  const pct = (v: number, total: number) => total ? ((v / total) * 100).toFixed(1) + '%' : '0%'

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#e6edf3', margin: 0 }}>
            Asset Register
          </h1>
          <p style={{ color: '#8b949e', fontSize: 13, margin: '4px 0 0' }}>
            Fixed Assets Ledger · Catering Division · WDV Depreciation @ 10–15% p.a.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() =>
            downloadCSV(
              'impcs-asset-register.csv',
              ['Sl.No','Asset Name','Category','Purchase Date','Quantity','Unit','Rate per Unit (₹)','Gross Value (₹)','Dep %','Years Held','Acc. Depreciation (₹)','Net Book Value (₹)','Condition','Remarks'],
              [filtered.map(a => [a.slno, a.name, a.category, a.purchaseDate, a.quantity, a.unit, a.ratePerUnit, a.grossValue, a.depreciationPct, a.yearsHeld, a.grossValue - a.netBookValue, a.netBookValue, a.condition, a.remarks])],
            )
          }>⬇ CSV</button>
          <button className="btn-primary" onClick={() => setShowAdd(v => !v)}>+ Add Asset</button>
        </div>
      </div>

      {/* ── Top-level KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { label: 'Gross Block (Cost)',      value: totalGross, color: '#1a8cff',  sub: `${assets.length} assets` },
          { label: 'Accumulated Depreciation', value: totalDep,  color: '#f85149',  sub: pct(totalDep, totalGross) + ' of cost' },
          { label: 'Net Book Value (WDV)',     value: totalNBV,   color: '#00d4aa',  sub: pct(totalNBV, totalGross) + ' remaining' },
        ].map(c => (
          <div key={c.label} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '18px 22px' }}>
            <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 6 }}>{c.label}</div>
            <div className="amount" style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{fmt(c.value)}</div>
            <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Category breakdown cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {byCategory.map(({ cat, gross, nbv, count }) => {
          const dep = gross - nbv
          const depPct = gross ? (dep / gross) * 100 : 0
          const color = CAT_COLOR[cat]
          return (
            <button
              key={cat}
              onClick={() => setCatFilter(catFilter === cat ? 'All' : cat)}
              style={{
                background: catFilter === cat ? color + '18' : '#161b22',
                border: `1px solid ${catFilter === cat ? color + '88' : '#30363d'}`,
                borderRadius: 12, padding: '16px 18px', textAlign: 'left', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{CAT_ICON[cat]}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: catFilter === cat ? color : '#e6edf3' }}>{cat}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>{count}</span>
              </div>
              <div className="amount" style={{ fontSize: 18, fontWeight: 700, color }}>{fmt(gross)}</div>
              <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>Gross · WDV: {fmt(nbv)}</div>
              {/* mini progress bar */}
              <div style={{ height: 3, background: '#1c2330', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${100 - depPct}%`, background: color, borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 10, color: '#8b949e', marginTop: 4 }}>{(100 - depPct).toFixed(1)}% book value remaining</div>
            </button>
          )
        })}
      </div>

      {/* ── Add asset form ── */}
      {showAdd && (
        <div style={{ background: '#161b22', border: '1px solid #1a8cff44', borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#e6edf3', marginBottom: 16 }}>New Asset Entry</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { label: 'Asset Name',          key: 'name',             type: 'text' },
              { label: 'Category',            key: 'category',         type: 'select' },
              { label: 'Purchase Date',       key: 'purchaseDate',     type: 'date' },
              { label: 'Quantity',            key: 'quantity',         type: 'number' },
              { label: 'Unit (nos/sets/kg)',  key: 'unit',             type: 'text' },
              { label: 'Rate per Unit (₹)',   key: 'ratePerUnit',      type: 'number' },
              { label: 'Depreciation % p.a.', key: 'depreciationPct',  type: 'number' },
              { label: 'Years Held',          key: 'yearsHeld',        type: 'number' },
              { label: 'Condition',           key: 'condition',        type: 'select2' },
              { label: 'Remarks',             key: 'remarks',          type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>{f.label}</div>
                {f.type === 'select' ? (
                  <select value={(draft as Record<string,unknown>)[f.key] as string || ''} onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value as Category }))} style={{ width: '100%' }}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                ) : f.type === 'select2' ? (
                  <select value={(draft as Record<string,unknown>)[f.key] as string || 'Good'} onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))} style={{ width: '100%' }}>
                    {['Good', 'Fair', 'Poor'].map(c => <option key={c}>{c}</option>)}
                  </select>
                ) : (
                  <input type={f.type} value={(draft as Record<string,unknown>)[f.key] as string || ''} onChange={e => setDraft(d => ({ ...d, [f.key]: f.type === 'number' ? +e.target.value : e.target.value }))} style={{ width: '100%' }} />
                )}
              </div>
            ))}
          </div>
          {/* Preview computed values */}
          {(draft.quantity && draft.ratePerUnit) ? (
            <div style={{ marginTop: 14, display: 'flex', gap: 20, flexWrap: 'wrap', padding: '12px 16px', background: '#1a8cff0d', border: '1px solid #1a8cff33', borderRadius: 8 }}>
              {[
                { label: 'Gross Value',      value: fmt(draft.quantity * draft.ratePerUnit) },
                { label: 'Depreciation',     value: fmt(draft.quantity * draft.ratePerUnit - calcNBV(draft.quantity * draft.ratePerUnit, draft.depreciationPct || 15, draft.yearsHeld || 1)) },
                { label: 'Net Book Value',   value: fmt(calcNBV(draft.quantity * draft.ratePerUnit, draft.depreciationPct || 15, draft.yearsHeld || 1)) },
              ].map(v => (
                <div key={v.label}>
                  <div style={{ fontSize: 10, color: '#8b949e' }}>{v.label}</div>
                  <div className="amount" style={{ fontSize: 15, fontWeight: 700, color: '#1a8cff' }}>{v.value}</div>
                </div>
              ))}
            </div>
          ) : null}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn-primary" onClick={saveAsset}>Save Asset</button>
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Search asset..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
        {catFilter !== 'All' && (
          <button className="btn-ghost" onClick={() => setCatFilter('All')} style={{ fontSize: 12 }}>
            ✕ {catFilter}
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#8b949e' }}>{filtered.length} assets shown</div>
      </div>

      {/* ── Main ledger table ── */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '13px 20px', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#e6edf3' }}>
            Fixed Assets Accounting Ledger
          </span>
          <span style={{ fontSize: 12, color: '#8b949e' }}>WDV Method · Depreciation computed annually</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 50 }}>Sl.No</th>
                <th>Asset Name</th>
                <th>Category</th>
                <th>Purchase Date</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th>Unit</th>
                <th style={{ textAlign: 'right' }}>Rate (₹)</th>
                <th style={{ textAlign: 'right' }}>Gross Value</th>
                <th style={{ textAlign: 'right' }}>Dep %</th>
                <th style={{ textAlign: 'right' }}>Yrs</th>
                <th style={{ textAlign: 'right' }}>Acc. Dep.</th>
                <th style={{ textAlign: 'right' }}>Net Book Value</th>
                <th>Condition</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={14} style={{ textAlign: 'center', padding: '36px 20px', color: '#8b949e' }}>
                    No fixed assets recorded yet. All data is reset to zero. Click "+ Add Asset" above to record society assets.
                  </td>
                </tr>
              ) : (
                filtered.map(a => {
                  const accDep = a.grossValue - a.netBookValue
                  const color  = CAT_COLOR[a.category]
                  return (
                    <tr key={a.slno}>
                    <td className="amount" style={{ color: '#8b949e' }}>{a.slno}</td>
                    <td style={{ fontWeight: 600, minWidth: 180 }}>{a.name}</td>
                    <td>
                      <span style={{
                        background: color + '18', color, border: `1px solid ${color}44`,
                        borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600,
                        fontFamily: 'var(--font-display)', whiteSpace: 'nowrap',
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        {CAT_ICON[a.category]} {a.category}
                      </span>
                    </td>
                    <td className="amount" style={{ fontSize: 12, color: '#8b949e' }}>{a.purchaseDate}</td>
                    <td className="amount" style={{ textAlign: 'right' }}>{a.quantity}</td>
                    <td style={{ color: '#8b949e', fontSize: 12 }}>{a.unit}</td>
                    <td className="amount" style={{ textAlign: 'right' }}>{fmt(a.ratePerUnit)}</td>
                    <td className="amount" style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(a.grossValue)}</td>
                    <td className="amount" style={{ textAlign: 'right', color: '#8b949e' }}>{a.depreciationPct}%</td>
                    <td className="amount" style={{ textAlign: 'right', color: '#8b949e' }}>{a.yearsHeld}</td>
                    <td className="amount" style={{ textAlign: 'right', color: '#f85149' }}>{fmt(accDep)}</td>
                    <td className="amount" style={{ textAlign: 'right', fontWeight: 700, color: '#00d4aa' }}>{fmt(a.netBookValue)}</td>
                    <td>{conditionBadge(a.condition)}</td>
                    <td style={{ fontSize: 12, color: '#8b949e', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.remarks || '—'}</td>
                  </tr>
                )
              }))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7} style={{ color: '#8b949e' }}>Grand Total ({filtered.length} assets)</td>
                <td className="amount" style={{ textAlign: 'right', color: '#1a8cff' }}>
                  {fmt(filtered.reduce((s, a) => s + a.grossValue, 0))}
                </td>
                <td colSpan={2} />
                <td className="amount" style={{ textAlign: 'right', color: '#f85149' }}>
                  {fmt(filtered.reduce((s, a) => s + (a.grossValue - a.netBookValue), 0))}
                </td>
                <td className="amount" style={{ textAlign: 'right', color: '#00d4aa' }}>
                  {fmt(filtered.reduce((s, a) => s + a.netBookValue, 0))}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Depreciation note */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 20px', fontSize: 12, color: '#8b949e', lineHeight: 1.7 }}>
        <strong style={{ color: '#e6edf3' }}>Depreciation Policy:</strong>&nbsp;
        Written Down Value (WDV) method. Rate: 15% p.a. on Plant &amp; Machinery, Utensils, Serving Equipment, and Vehicles;&nbsp;
        10% p.a. on Furniture &amp; Fixtures — in line with Income Tax Act Schedule II.&nbsp;
        Net Book Value = Cost × (1 − Rate)ⁿ where n = years held.
      </div>
    </div>
  )
}
