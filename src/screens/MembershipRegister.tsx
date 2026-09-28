import { useState } from 'react'
import { useRegisters, type Member, type Gender, type MemberStatus } from '../context/RegistersContext'
import { downloadCSV } from '../utils/downloadCSV'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

/* ── Donut chart ─────────────────────────────────────────────── */
type Slice = { label: string; value: number; color: string }

function DonutChart({ data, size = 148, title, subtitle }: { data: Slice[]; size?: number; title: string; subtitle?: string }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  const cx = size / 2, cy = size / 2
  const R = size * 0.40, r = size * 0.26, gap = 0.018

  let cursor = -Math.PI / 2
  const slices = data.map((d, i) => {
    const sweep = total ? (d.value / total) * (2 * Math.PI) - gap : 0
    const sa = cursor + gap / 2, ea = sa + sweep
    const cos = (a: number) => Math.cos(a), sin = (a: number) => Math.sin(a)
    const large = sweep > Math.PI ? 1 : 0
    const path = [
      `M ${cx + R * cos(sa)} ${cy + R * sin(sa)}`,
      `A ${R} ${R} 0 ${large} 1 ${cx + R * cos(ea)} ${cy + R * sin(ea)}`,
      `L ${cx + r * cos(ea)} ${cy + r * sin(ea)}`,
      `A ${r} ${r} 0 ${large} 0 ${cx + r * cos(sa)} ${cy + r * sin(sa)}`,
      'Z',
    ].join(' ')
    cursor += sweep + gap
    return { ...d, path, i }
  })

  const active = hovered !== null ? slices[hovered] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#e6edf3' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            {slices.map((s) => (
              <path key={s.i} d={s.path}
                fill={s.color}
                opacity={hovered === null || hovered === s.i ? 1 : 0.35}
                style={{ transition: 'opacity 0.15s, transform 0.15s', transformOrigin: `${cx}px ${cy}px`,
                  transform: hovered === s.i ? `scale(1.06)` : 'scale(1)', cursor: 'pointer' }}
                onMouseEnter={() => setHovered(s.i)}
                onMouseLeave={() => setHovered(null)}
              >
                <title>{s.label}: {s.value} ({total ? ((s.value / total) * 100).toFixed(1) : 0}%)</title>
              </path>
            ))}
            {active ? (
              <>
                <text x={cx} y={cy - 6} textAnchor="middle" fill={active.color} fontSize={16} fontWeight={800} fontFamily="var(--font-display)">{active.value}</text>
                <text x={cx} y={cy + 9} textAnchor="middle" fill="#8b949e" fontSize={9} fontFamily="var(--font-display)">{active.label.toUpperCase()}</text>
              </>
            ) : (
              <>
                <text x={cx} y={cy - 6} textAnchor="middle" fill="#e6edf3" fontSize={18} fontWeight={800} fontFamily="var(--font-display)">{total}</text>
                <text x={cx} y={cy + 9} textAnchor="middle" fill="#8b949e" fontSize={9} fontFamily="var(--font-display)">{subtitle?.toUpperCase() || 'TOTAL'}</text>
              </>
            )}
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {slices.map((s) => (
            <div key={s.i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: hovered === null || hovered === s.i ? 1 : 0.4, transition: 'opacity 0.15s' }}
              onMouseEnter={() => setHovered(s.i)} onMouseLeave={() => setHovered(null)}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#8b949e', fontFamily: 'var(--font-display)' }}>{s.label}</span>
              <span className="amount" style={{ fontSize: 12, fontWeight: 700, color: '#e6edf3', marginLeft: 'auto' }}>{s.value}</span>
              <span style={{ fontSize: 11, color: s.color, fontWeight: 600, minWidth: 38, textAlign: 'right' }}>
                {total ? ((s.value / total) * 100).toFixed(0) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Status badges ───────────────────────────────────────────── */
const statusBadge = (s: MemberStatus) => {
  const map: Record<MemberStatus, string> = { Active: 'badge-green', Inactive: 'badge-yellow', Suspended: 'badge-red' }
  return (
    <span className={map[s]} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
      {s}
    </span>
  )
}

const genderIcon = (g: Gender) => g === 'Female' ? '♀' : g === 'Male' ? '♂' : '⚧'

const calcAge = (dob?: string): number => {
  if (!dob) return 0
  const parts = dob.includes('/') ? dob.split('/') : dob.split('-')
  if (parts.length < 3) return 0
  const year = parts[2].length === 4 ? +parts[2] : +parts[0]
  const month = parts[2].length === 4 ? +parts[1] - 1 : +parts[1] - 1
  const day = parts[2].length === 4 ? +parts[0] : +parts[2]
  const birthDate = new Date(year, month, day)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return isNaN(age) || age < 0 ? 0 : age
}

export default function MembershipRegister() {
  const { members, addMember, updateMember, deleteMember, resetMembersToDefault } = useRegisters()

  const [search, setSearch]       = useState('')
  const [statusF, setStatusF]     = useState<MemberStatus | 'All'>('All')
  const [genderF, setGenderF]     = useState<Gender | 'All'>('All')
  const [selected, setSelected]   = useState<Member | null>(null)
  
  /* Modals */
  const [showAdd, setShowAdd]     = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [deletingMember, setDeletingMember] = useState<Member | null>(null)

  /* Draft state for Add/Edit */
  const [formData, setFormData] = useState<Partial<Member>>({})

  const filtered = members.filter(m => {
    if (statusF !== 'All' && m.status !== statusF) return false
    if (genderF !== 'All' && m.gender !== genderF) return false
    const q = search.toLowerCase()
    return (
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.memberId.toLowerCase().includes(q) ||
      m.fatherName.toLowerCase().includes(q) ||
      m.receiptNo.toLowerCase().includes(q) ||
      m.certificateNo.toLowerCase().includes(q) ||
      (m.phone && m.phone.includes(q)) ||
      (m.remarks && m.remarks.toLowerCase().includes(q))
    )
  })

  const totalFees = members.reduce((s, m) => s + (m.admissionFee || 0), 0)
  const totalShares = members.reduce((s, m) => s + (m.shares || 0), 0)
  const activeCount = members.filter(m => m.status === 'Active').length
  const maleCount = members.filter(m => m.gender === 'Male').length
  const femaleCount = members.filter(m => m.gender === 'Female').length

  const handleOpenAdd = () => {
    const nextSeq = String(members.length + 1).padStart(3, '0')
    setFormData({
      memberId: `THMCS/MID/${nextSeq}/2026`,
      name: '',
      fatherName: '',
      gender: 'Male',
      dateOfAdmission: '08-05-2026',
      dateOfBirth: '01/01/1990',
      spouse: '',
      address: 'Chümoukedima Town, Nagaland',
      nominee: '',
      aadharNo: '',
      phone: '',
      admissionFee: 100,
      shares: 0,
      amountPaid: 0,
      receiptNo: `THMCS/REC/${nextSeq}/2026`,
      certificateNo: `THMCS/SC/${nextSeq}/2026`,
      signatureType: 'Signature',
      status: 'Active',
      remarks: 'NEW MEMBER',
      outstandingLoan: 0,
    })
    setShowAdd(true)
  }

  const handleOpenEdit = (m: Member, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingMember(m)
    setFormData({ ...m })
  }

  const handleOpenDelete = (m: Member, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setDeletingMember(m)
  }

  const handleSaveAdd = () => {
    if (!formData.name?.trim()) {
      alert('Please enter member name.')
      return
    }
    addMember({
      memberId: formData.memberId || `THMCS/MID/${String(members.length + 1).padStart(3, '0')}/2026`,
      name: formData.name.trim().toUpperCase(),
      fatherName: formData.fatherName?.trim().toUpperCase() || '',
      phone: formData.phone || '',
      dateOfAdmission: formData.dateOfAdmission || '08-05-2026',
      dateOfBirth: formData.dateOfBirth || '',
      spouse: formData.spouse || '',
      gender: (formData.gender as Gender) || 'Male',
      address: formData.address || 'Chümoukedima Town, Nagaland',
      nominee: formData.nominee || '',
      aadharNo: formData.aadharNo || '',
      admissionFee: formData.admissionFee ?? 100,
      signatureType: formData.signatureType || 'Signature',
      status: (formData.status as MemberStatus) || 'Active',
      shares: Number(formData.shares) || 0,
      amountPaid: Number(formData.amountPaid) || 0,
      receiptNo: formData.receiptNo || '',
      certificateNo: formData.certificateNo || '',
      remarks: formData.remarks || '',
      outstandingLoan: Number(formData.outstandingLoan) || 0,
    })
    setShowAdd(false)
  }

  const handleSaveEdit = () => {
    if (!editingMember) return
    if (!formData.name?.trim()) {
      alert('Please enter member name.')
      return
    }
    updateMember(editingMember.id, {
      ...formData,
      name: formData.name?.trim().toUpperCase(),
      fatherName: formData.fatherName?.trim().toUpperCase(),
      shares: Number(formData.shares) || 0,
      amountPaid: Number(formData.amountPaid) || 0,
      admissionFee: Number(formData.admissionFee) || 100,
    })
    if (selected?.id === editingMember.id) {
      setSelected({ ...selected, ...formData } as Member)
    }
    setEditingMember(null)
  }

  const handleConfirmDelete = () => {
    if (!deletingMember) return
    deleteMember(deletingMember.id)
    if (selected?.id === deletingMember.id) {
      setSelected(null)
    }
    setDeletingMember(null)
  }

  const Field = ({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) => (
    <div style={{ borderBottom: '1px solid #21262d', paddingBottom: 8 }}>
      <div style={{ fontSize: 10, color: '#8b949e', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#e6edf3', fontWeight: 500, fontFamily: mono ? 'var(--font-mono)' : undefined }}>
        {value || '—'}
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#e6edf3', margin: 0 }}>
              Revised Membership Register — 2026
            </h1>
            <span style={{ background: '#1a8cff22', color: '#1a8cff', border: '1px solid #1a8cff44', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
              Official THMCS Register
            </span>
          </div>
          <p style={{ color: '#8b949e', fontSize: 13, margin: '4px 0 0' }}>
            Tribal Harvest Marketing Cooperative Society Ltd. · Chümoukedima Town, Nagaland
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn-ghost"
            style={{ fontSize: 12 }}
            onClick={() => {
              if (window.confirm('Reset members to the official 22 register entries?')) {
                resetMembersToDefault()
              }
            }}
          >
            ↺ Reset Register
          </button>
          <button
            className="btn-ghost"
            style={{ fontSize: 12 }}
            onClick={() =>
              downloadCSV('thmcs-membership-register-2026.csv', [
                'Sl.No', 'Member ID', 'Name of Member', "Father's / Spouse's Name", 'Phone No.',
                'Date of Admission', 'No. of Shares', 'Receipt No.', 'Share Certificate No.',
                'Remarks', 'Status', 'Gender', 'Detailed Address'
              ], [filtered.map(m => [
                m.slno, m.memberId, m.name, m.fatherName, m.phone || 'N/A',
                m.dateOfAdmission, m.shares, m.receiptNo, m.certificateNo,
                m.remarks || '', m.status, m.gender, m.address
              ])])
            }
          >
            ⬇ Export CSV
          </button>
          <button className="btn-primary" onClick={handleOpenAdd}>
            + Add Member
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total Enrolled Members', value: String(members.length), color: '#1a8cff', mono: false },
          { label: 'Total Share Holdings', value: totalShares + ' shares', color: '#a78bfa', mono: false },
          { label: 'Female Members', value: String(femaleCount), color: '#f472b6', mono: false },
          { label: 'Male Members', value: String(maleCount), color: '#60a5fa', mono: false },
          { label: 'Active Members', value: String(activeCount), color: '#3fb950', mono: false },
          { label: 'Admission Fees Collected', value: fmt(totalFees), color: '#00d4aa', mono: true },
        ].map(c => (
          <div key={c.label} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>{c.label}</div>
            <div className={c.mono ? 'amount' : ''} style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Summary Chart + Quick Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 20px' }}>
          <DonutChart
            title="Gender Ratio"
            subtitle="members"
            data={[
              { label: 'Female', value: femaleCount, color: '#f472b6' },
              { label: 'Male', value: maleCount, color: '#1a8cff' },
            ]}
          />
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#e6edf3' }}>
            2026 Revised Admission Status
          </div>
          <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.6 }}>
            • <strong style={{ color: '#00d4aa' }}>14 Founder Members (2025 batch)</strong> with 73 total subscribed shares.<br />
            • <strong style={{ color: '#f0b429' }}>8 New Members (08-05-2026 batch)</strong> admitted under Revised Register with share accounts allotted.<br />
            • Society resolution covers Nagaland Cooperative Act compliance.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <span className="badge-green" style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
              ✓ 100% KYC Verified
            </span>
            <span className="badge-blue" style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
              ✓ Share Certificates Assigned
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Search member, ID (THMCS/MID...), father, receipt..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 340, maxWidth: '100%' }}
        />
        <div style={{ display: 'flex', background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 3, gap: 1 }}>
          {(['All', 'Active', 'Inactive', 'Suspended'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusF(s)}
              style={{
                background: statusF === s ? '#1a8cff' : 'transparent',
                color: statusF === s ? 'white' : '#8b949e',
                border: 'none',
                borderRadius: 5,
                padding: '5px 10px',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 3, gap: 1 }}>
          {(['All', 'Female', 'Male'] as const).map(g => (
            <button
              key={g}
              onClick={() => setGenderF(g)}
              style={{
                background: genderF === g ? '#1a8cff' : 'transparent',
                color: genderF === g ? 'white' : '#8b949e',
                border: 'none',
                borderRadius: 5,
                padding: '5px 10px',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
              }}
            >
              {g}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#8b949e' }}>
          Showing <strong>{filtered.length}</strong> of {members.length} members
        </div>
      </div>

      {/* Main Table + Detail Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16 }}>
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: '#8b949e' }}>
              REVISED MEMBERSHIP REGISTER — 2026 (PAGES 1 &amp; 2)
            </span>
            <span style={{ fontSize: 11, color: '#8b949e' }}>Click any row to inspect details</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>Sl.</th>
                  <th>Member ID</th>
                  <th>Name of Member</th>
                  <th>Father’s / Spouse’s Name</th>
                  <th>Admission Date</th>
                  <th>Phone No.</th>
                  <th style={{ textAlign: 'right' }}>Shares</th>
                  <th>Receipt No.</th>
                  <th>Certificate No.</th>
                  <th>Remarks</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center', minWidth: 110 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr
                    key={m.id}
                    onClick={() => setSelected(selected?.id === m.id ? null : m)}
                    style={{
                      cursor: 'pointer',
                      background: selected?.id === m.id ? '#1a8cff12' : undefined,
                    }}
                  >
                    <td className="amount" style={{ color: '#8b949e' }}>{m.slno}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#1a8cff', fontWeight: 600 }}>
                      {m.memberId}
                    </td>
                    <td style={{ fontWeight: 700, whiteSpace: 'nowrap', color: '#ffffff' }}>
                      <span style={{ marginRight: 6 }}>{genderIcon(m.gender)}</span>
                      {m.name}
                    </td>
                    <td style={{ color: '#8b949e', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {m.fatherName || '—'}
                    </td>
                    <td className="amount" style={{ fontSize: 12, color: '#8b949e' }}>
                      {m.dateOfAdmission || '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#8b949e' }}>
                      {m.phone || '—'}
                    </td>
                    <td className="amount" style={{ textAlign: 'right', fontWeight: 700, color: m.shares > 0 ? '#a78bfa' : '#8b949e' }}>
                      {m.shares > 0 ? `${m.shares} Nos.` : '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00d4aa' }}>
                      {m.receiptNo || '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#f0b429' }}>
                      {m.certificateNo || '—'}
                    </td>
                    <td>
                      {m.remarks ? (
                        <span style={{ background: '#fb923c22', color: '#fb923c', border: '1px solid #fb923c44', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                          {m.remarks}
                        </span>
                      ) : (
                        <span style={{ color: '#30363d' }}>—</span>
                      )}
                    </td>
                    <td>{statusBadge(m.status)}</td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button
                          title="Edit Member"
                          onClick={e => handleOpenEdit(m, e)}
                          style={{
                            background: '#1c2330',
                            border: '1px solid #30363d',
                            color: '#1a8cff',
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          title="Delete Member"
                          onClick={e => handleOpenDelete(m, e)}
                          style={{
                            background: '#f8514915',
                            border: '1px solid #f8514933',
                            color: '#f85149',
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} style={{ color: '#8b949e' }}>Total ({filtered.length} members shown)</td>
                  <td className="amount" style={{ textAlign: 'right', color: '#a78bfa', fontWeight: 700 }}>
                    {filtered.reduce((s, m) => s + (m.shares || 0), 0)} Nos.
                  </td>
                  <td colSpan={5} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Selected Member Detail Drawer */}
        {selected && (
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 20, alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#e6edf3', lineHeight: 1.2 }}>
                  {selected.name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#1a8cff', marginTop: 3 }}>
                  {selected.memberId}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8b949e',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {statusBadge(selected.status)}
              <span style={{ background: '#1a8cff18', color: '#1a8cff', border: '1px solid #1a8cff44', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                {genderIcon(selected.gender)} {selected.gender}
              </span>
              {selected.remarks && (
                <span style={{ background: '#fb923c22', color: '#fb923c', border: '1px solid #fb923c44', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                  {selected.remarks}
                </span>
              )}
            </div>

            {/* Quick Actions in Detail View */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-primary"
                style={{ flex: 1, padding: '6px 12px', fontSize: 12 }}
                onClick={() => handleOpenEdit(selected)}
              >
                ✏️ Edit Member
              </button>
              <button
                className="btn-ghost"
                style={{ color: '#f85149', borderColor: '#f8514944', padding: '6px 12px', fontSize: 12 }}
                onClick={() => handleOpenDelete(selected)}
              >
                🗑️ Delete
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Field label="Father's / Spouse's Name" value={selected.fatherName} />
              <Field label="Date of Admission" value={selected.dateOfAdmission} />
              <Field label="Phone No." value={selected.phone} mono />
              <Field label="Detailed Address" value={selected.address} />
              <Field label="Receipt No." value={selected.receiptNo} mono />
              <Field label="Share Certificate No." value={selected.certificateNo} mono />
              <Field label="Aadhar No." value={selected.aadharNo || 'On file'} mono />
              <Field label="Nominee" value={selected.nominee || '—'} />
            </div>

            {/* Shares & NStCB Banking Card */}
            <div style={{ background: '#1c2330', border: '1px solid #00d4aa33', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#00d4aa' }}>🏦 NStCB Deposit &amp; Share Book</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#1a8cff', fontWeight: 600 }}>
                  {selected.shareBookNo || `SB-${String(selected.slno).padStart(3, '0')}`}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                <div>
                  <div style={{ color: '#8b949e', fontSize: 10 }}>NStCB Deposit (₹)</div>
                  <div className="amount" style={{ color: '#00d4aa', fontWeight: 700, fontSize: 14 }}>
                    {fmt(selected.totalAmountDeposit ?? (selected.nstcbDepositAmount || selected.shares * 1000))}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#8b949e', fontSize: 10 }}>Deposit Date</div>
                  <div style={{ color: '#e6edf3', fontWeight: 600 }}>
                    {selected.nstcbDepositDate || selected.dateOfAdmission || '—'}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2', background: '#161b22', padding: '6px 10px', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#8b949e' }}>Entitlement (@ ₹1,000):</span>
                  <strong style={{ color: '#f0b429' }}>
                    {Math.floor((selected.totalAmountDeposit ?? (selected.nstcbDepositAmount || selected.shares * 1000)) / 1000)} Shares Entitled
                  </strong>
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8b949e' }}>Actual Shares Allotted:</span>
                  <strong style={{ color: '#a78bfa' }}>{selected.shares} Shares</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: ADD MEMBER ── */}
      {showAdd && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: '#161b22', border: '1px solid #30363d', borderRadius: 14,
            width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#e6edf3', margin: 0 }}>
                Add New Member (Revised Register)
              </h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'transparent', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Member ID *</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.memberId || ''}
                  onChange={e => setFormData({ ...formData, memberId: e.target.value })}
                  placeholder="e.g. THMCS/MID/023/2026"
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Name of Member *</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. MS ARENLA JAMIR"
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Father’s / Spouse’s Name</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.fatherName || ''}
                  onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                  placeholder="e.g. LATE I. JAMIR"
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Gender</div>
                <select
                  style={{ width: '100%' }}
                  value={formData.gender || 'Male'}
                  onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Date of Admission</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.dateOfAdmission || ''}
                  onChange={e => setFormData({ ...formData, dateOfAdmission: e.target.value })}
                  placeholder="e.g. 08-05-2026"
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Phone No.</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9862000000"
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>No. of Shares</div>
                <input
                  type="number"
                  style={{ width: '100%' }}
                  value={formData.shares ?? 0}
                  onChange={e => setFormData({ ...formData, shares: Number(e.target.value) })}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Admission Fee (₹)</div>
                <input
                  type="number"
                  style={{ width: '100%' }}
                  value={formData.admissionFee ?? 100}
                  onChange={e => setFormData({ ...formData, admissionFee: Number(e.target.value) })}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Receipt No.</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.receiptNo || ''}
                  onChange={e => setFormData({ ...formData, receiptNo: e.target.value })}
                  placeholder="e.g. THMCS/REC/023/2026"
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Share Certificate No.</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.certificateNo || ''}
                  onChange={e => setFormData({ ...formData, certificateNo: e.target.value })}
                  placeholder="e.g. THMCS/SC/023/2026"
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Status</div>
                <select
                  style={{ width: '100%' }}
                  value={formData.status || 'Active'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Remarks</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.remarks || ''}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="e.g. NEW MEMBER"
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Detailed Address</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.address || ''}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Ward 4, Chümoukedima Town, Nagaland"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveAdd}>Save New Member</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT MEMBER ── */}
      {editingMember && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: '#161b22', border: '1px solid #30363d', borderRadius: 14,
            width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#e6edf3', margin: 0 }}>
                  Edit Member Details
                </h2>
                <div style={{ fontSize: 12, color: '#1a8cff', marginTop: 2 }}>{editingMember.memberId}</div>
              </div>
              <button onClick={() => setEditingMember(null)} style={{ background: 'transparent', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Member ID *</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.memberId || ''}
                  onChange={e => setFormData({ ...formData, memberId: e.target.value })}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Name of Member *</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Father’s / Spouse’s Name</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.fatherName || ''}
                  onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Gender</div>
                <select
                  style={{ width: '100%' }}
                  value={formData.gender || 'Male'}
                  onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Admission Date</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.dateOfAdmission || ''}
                  onChange={e => setFormData({ ...formData, dateOfAdmission: e.target.value })}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Phone No.</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>No. of Shares</div>
                <input
                  type="number"
                  style={{ width: '100%' }}
                  value={formData.shares ?? 0}
                  onChange={e => setFormData({ ...formData, shares: Number(e.target.value) })}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Receipt No.</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.receiptNo || ''}
                  onChange={e => setFormData({ ...formData, receiptNo: e.target.value })}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Share Certificate No.</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.certificateNo || ''}
                  onChange={e => setFormData({ ...formData, certificateNo: e.target.value })}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Status</div>
                <select
                  style={{ width: '100%' }}
                  value={formData.status || 'Active'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Remarks</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.remarks || ''}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="e.g. NEW MEMBER"
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Admission Fee (₹)</div>
                <input
                  type="number"
                  style={{ width: '100%' }}
                  value={formData.admissionFee ?? 100}
                  onChange={e => setFormData({ ...formData, admissionFee: Number(e.target.value) })}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Detailed Address</div>
                <input
                  style={{ width: '100%' }}
                  value={formData.address || ''}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button className="btn-ghost" onClick={() => setEditingMember(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE CONFIRMATION ── */}
      {deletingMember && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: '#161b22', border: '1px solid #f8514955', borderRadius: 14,
            width: '100%', maxWidth: 440, padding: 24, display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#f85149', margin: 0 }}>
              Confirm Delete Member
            </h2>
            <p style={{ color: '#e6edf3', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>{deletingMember.name}</strong> ({deletingMember.memberId}) from the Membership Register?
            </p>
            <div style={{ background: '#f8514915', border: '1px solid #f8514933', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#f85149' }}>
              Warning: This member will be permanently deleted from the register.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-ghost" onClick={() => setDeletingMember(null)}>Cancel</button>
              <button
                style={{ background: '#f85149', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                onClick={handleConfirmDelete}
              >
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
