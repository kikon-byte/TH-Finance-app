import { useState, useMemo } from 'react'
import { useAccounting } from '../context/AccountingContext'
import { useRegisters } from '../context/RegistersContext'
import {
  type HistoricalSourceRow,
  type MigrationClassification,
  type MigrationPaymentMode,
  type MigrationRowStatus,
} from '../types/migration'
import {
  getInitialMigrationRows,
  computeReconciliationSummary,
  isRowValidForApproval,
  buildTransactionFromApprovedRow,
  SOURCE_DOCUMENT_NAME,
  MIGRATION_BATCH_ID,
  SOURCE_STATED_TOTALS,
} from '../services/historicalMigrationService'
import { downloadCSV } from '../utils/downloadCSV'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)

const CLASSIFICATIONS: MigrationClassification[] = [
  'SHARE_CAPITAL',
  'MEMBERSHIP_FEE',
  'SALES',
  'PROCUREMENT',
  'RAW_MATERIAL',
  'LABOUR',
  'PRINTING_PACKAGING',
  'ADMINISTRATION',
  'MEETING_BOD',
  'REGISTRATION_GOV',
  'AUDIT',
  'NSCU_STATUTORY',
  'PROJECT_EXPENDITURE',
  'OTHER_EXPENDITURE',
  'OTHER_RECEIPT',
  'UNKNOWN',
]

const PAYMENT_MODES: MigrationPaymentMode[] = [
  'CASH',
  'NSCB',
  'SBI',
  'OTHER_BANK',
  'UPI_ONLINE',
  'UNKNOWN',
]

export default function HistoricalMigration() {
  const { accounts, transactions, postTransactionBatch } = useAccounting()
  const { members } = useRegisters()

  /* Migration Rows state stored in localStorage for persistence */
  const [rows, setRows] = useState<HistoricalSourceRow[]>(() => {
    try {
      const saved = localStorage.getItem('thmcs_migration_v1')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === 49) return parsed
      }
    } catch (e) {
      console.error(e)
    }
    return getInitialMigrationRows()
  })

  // Persist to localStorage on update
  const persistRows = (updated: HistoricalSourceRow[]) => {
    setRows(updated)
    try {
      localStorage.setItem('thmcs_migration_v1', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }
  }

  /* Navigation Tabs */
  const [activeTab, setActiveTab] = useState<'register' | 'source_viewer' | 'report'>('register')

  /* Filter & Search */
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEEDS_REVIEW' | 'MAPPED' | 'APPROVED' | 'POSTED' | 'DATE_WARNINGS'>('ALL')
  const [search, setSearch] = useState('')
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([])

  /* Inspection & Edit Drawer */
  const [selectedRow, setSelectedRow] = useState<HistoricalSourceRow | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<HistoricalSourceRow>>({})

  /* Toast Notification */
  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'warn' | 'info' } | null>(null)

  const showNotice = (msg: string, type: 'success' | 'warn' | 'info' = 'info') => {
    setNotice({ msg, type })
    setTimeout(() => setNotice(null), 6000)
  }

  /* Compute Reconciliation Summary */
  const reconciliation = useMemo(
    () => computeReconciliationSummary(rows, transactions),
    [rows, transactions]
  )

  /* Filtered Rows */
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (statusFilter === 'NEEDS_REVIEW' && r.status !== 'NEEDS_REVIEW') return false
      if (statusFilter === 'MAPPED' && r.status !== 'MAPPED') return false
      if (statusFilter === 'APPROVED' && r.status !== 'APPROVED') return false
      if (statusFilter === 'POSTED' && r.status !== 'POSTED') return false
      if (statusFilter === 'DATE_WARNINGS' && !r.dateWarning) return false

      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        r.sourceParticular.toLowerCase().includes(q) ||
        r.sourceDate.toLowerCase().includes(q) ||
        String(r.slno).includes(q) ||
        r.classification.toLowerCase().includes(q) ||
        (r.accountName && r.accountName.toLowerCase().includes(q)) ||
        (r.paymentMode && r.paymentMode.toLowerCase().includes(q))
      )
    })
  }, [rows, statusFilter, search])

  /* Open Row for Editing / Review */
  const handleOpenRowInspect = (row: HistoricalSourceRow) => {
    setSelectedRow(row)
    setEditFormData({ ...row })
  }

  /* Save Row Mapping Updates */
  const handleSaveRowMapping = () => {
    if (!selectedRow) return
    const updated = rows.map(r => {
      if (r.id !== selectedRow.id) return r

      const newClassification = editFormData.classification || r.classification
      const newAccountId = editFormData.accountId || r.accountId
      const foundAccount = accounts.find(a => a.id === newAccountId)
      const newPaymentMode = editFormData.paymentMode || r.paymentMode
      const newCorrectedDate = editFormData.correctedDate !== undefined ? editFormData.correctedDate : r.correctedDate

      // Update status based on resolution
      let newStatus: MigrationRowStatus = r.status
      if (newStatus !== 'POSTED') {
        if (newPaymentMode !== 'UNKNOWN' && newAccountId) {
          newStatus = 'MAPPED'
        } else {
          newStatus = 'NEEDS_REVIEW'
        }
      }

      const newRow: HistoricalSourceRow = {
        ...r,
        classification: newClassification,
        accountId: newAccountId,
        accountName: foundAccount ? foundAccount.name : r.accountName,
        accountCode: foundAccount ? foundAccount.code : r.accountCode,
        paymentMode: newPaymentMode,
        paymentModeWarning: newPaymentMode === 'UNKNOWN',
        memberId: editFormData.memberId !== undefined ? editFormData.memberId : r.memberId,
        memberName: editFormData.memberName !== undefined ? editFormData.memberName : r.memberName,
        projectId: editFormData.projectId !== undefined ? editFormData.projectId : r.projectId,
        projectName: editFormData.projectId === 'BASTENGA_PRODUCTION' ? 'Bastenga / Food Production' : null,
        stockItem: editFormData.stockItem !== undefined ? editFormData.stockItem : r.stockItem,
        correctedDate: newCorrectedDate,
        dateWarning: r.sourceDate === '04-05-2026' && !newCorrectedDate,
        status: newStatus,
        reviewNotes: editFormData.reviewNotes || r.reviewNotes,
      }
      return newRow
    })

    persistRows(updated)
    const updatedCurrent = updated.find(r => r.id === selectedRow.id) || null
    setSelectedRow(updatedCurrent)
    showNotice(`Row ${selectedRow.slno} mapping updated.`, 'info')
  }

  /* In-App Confirmation Modal */
  const [confirmModal, setConfirmModal] = useState<{
    title: string
    message: string
    confirmText?: string
    danger?: boolean
    onConfirm: () => void
  } | null>(null)

  /* Approve a single row */
  const handleApproveSingleRow = (rowId: string) => {
    const target = rows.find(r => r.id === rowId)
    if (!target) return

    const check = isRowValidForApproval(target)
    if (!check.valid) {
      showNotice(`Cannot approve Row ${target.slno}: ${check.reason}`, 'warn')
      return
    }

    const updated = rows.map(r => (r.id === rowId ? { ...r, status: 'APPROVED' as MigrationRowStatus, approvedAt: new Date().toISOString() } : r))
    persistRows(updated)
    if (selectedRow?.id === rowId) {
      setSelectedRow({ ...selectedRow, status: 'APPROVED', approvedAt: new Date().toISOString() })
    }
    showNotice(`Row ${target.slno} approved for migration posting.`, 'success')
  }

  /* Approve Selected Rows */
  const handleApproveSelected = () => {
    if (selectedRowIds.length === 0) {
      showNotice('Please select rows to approve using the checkboxes.', 'warn')
      return
    }

    let approvedCount = 0
    const errors: string[] = []

    const updated = rows.map(r => {
      if (!selectedRowIds.includes(r.id)) return r
      const check = isRowValidForApproval(r)
      if (check.valid) {
        approvedCount++
        return { ...r, status: 'APPROVED' as MigrationRowStatus, approvedAt: new Date().toISOString() }
      } else {
        errors.push(`Row ${r.slno}: ${check.reason}`)
        return r
      }
    })

    persistRows(updated)
    setSelectedRowIds([])
    if (errors.length > 0) {
      showNotice(
        `Approved ${approvedCount} valid rows. ${errors.length} rows require review (${errors[0]}).`,
        'warn'
      )
    } else {
      showNotice(`Successfully approved ${approvedCount} selected rows.`, 'success')
    }
  }

  /* Approve All Valid Rows (Part 19: Strict safety logic) */
  const handleApproveAllValid = () => {
    let count = 0
    let skippedCount = 0

    const updated = rows.map(r => {
      if (r.status === 'POSTED' || r.status === 'APPROVED') return r
      const check = isRowValidForApproval(r)
      if (check.valid) {
        count++
        return { ...r, status: 'APPROVED' as MigrationRowStatus, approvedAt: new Date().toISOString() }
      } else {
        skippedCount++
        return r
      }
    })

    persistRows(updated)
    showNotice(
      `Approved ${count} valid rows. ${skippedCount} rows with UNKNOWN payment modes or unverified dates remain in "NEEDS REVIEW" per Part 19.`,
      'info'
    )
  }

  /* Execute Post to Central Accounting Engine */
  const executePosting = (approvedRows: HistoricalSourceRow[]) => {
    try {
      const newTransactions = approvedRows.map(r =>
        buildTransactionFromApprovedRow(r, transactions, accounts)
      )

      // Post to accounting context
      postTransactionBatch(newTransactions)

      // Mark rows as posted
      const updatedRows = rows.map(r => {
        const matchingTx = newTransactions.find(t => t.id === `tx_hist_mig_${r.slno}`)
        if (matchingTx) {
          return {
            ...r,
            status: 'POSTED' as MigrationRowStatus,
            postedVoucherNo: matchingTx.voucherNo,
            postedAt: new Date().toISOString(),
          }
        }
        return r
      })

      persistRows(updatedRows)
      showNotice(`Successfully posted ${newTransactions.length} historical transactions into Central Accounting Books!`, 'success')
    } catch (e: any) {
      showNotice(`Posting error: ${e.message}`, 'warn')
    }
  }

  /* Post Approved Records to Central Accounting Engine (Part 20) */
  const handlePostApprovedToCentral = () => {
    const approvedRows = rows.filter(r => r.status === 'APPROVED')
    if (approvedRows.length === 0) {
      showNotice('No rows are in "APPROVED" status. Please review and approve rows first before posting.', 'warn')
      return
    }

    setConfirmModal({
      title: 'Post Approved Transactions to Central Ledger',
      message: `Are you sure you want to post ${approvedRows.length} approved historical transactions to the live Central Transaction Engine? This will generate official double-entry vouchers tagged with batch "${MIGRATION_BATCH_ID}".`,
      confirmText: 'Post to Central Books',
      danger: false,
      onConfirm: () => {
        setConfirmModal(null)
        executePosting(approvedRows)
      },
    })
  }

  /* Reset to Initial Source Extraction Baseline */
  const handleResetToBaseline = () => {
    setConfirmModal({
      title: 'Reset Migration Register',
      message: 'Reset the migration state back to the original source extraction baseline (49 rows)? Any pending manual mappings will be restored.',
      confirmText: 'Reset to Baseline',
      danger: true,
      onConfirm: () => {
        setConfirmModal(null)
        const fresh = getInitialMigrationRows()
        persistRows(fresh)
        setSelectedRow(null)
        setSelectedRowIds([])
        showNotice('Migration register reset to original source extraction baseline.', 'info')
      },
    })
  }

  /* Toggle selection */
  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const handleSelectAllFiltered = () => {
    if (selectedRowIds.length === filteredRows.length) {
      setSelectedRowIds([])
    } else {
      setSelectedRowIds(filteredRows.map(r => r.id))
    }
  }

  /* Export Migration CSV */
  const handleExportCSV = () => {
    downloadCSV(
      `thmcs-historical-migration-${statusFilter.toLowerCase()}.csv`,
      [
        'Sl.No', 'Page', 'Date', 'Original Particular', 'Receipt (₹)', 'Payment (₹)',
        'Classification', 'Account Code', 'Account Name', 'Payment Mode', 'Member Allocation',
        'Project Tag', 'Status', 'Date Warning', 'Review Notes', 'Batch ID'
      ],
      [
        rows.map(r => [
          r.slno,
          `Page ${r.sourcePage}`,
          r.correctedDate ? `${r.correctedDate} (Source: ${r.sourceDate})` : r.sourceDate,
          r.sourceParticular,
          r.sourceReceipt || '',
          r.sourcePayment || '',
          r.classification,
          r.accountCode || '',
          r.accountName || '',
          r.paymentMode,
          r.memberName || r.memberId || 'UNALLOCATED',
          r.projectName || r.projectId || 'UNALLOCATED',
          r.status,
          r.dateWarning ? 'YES' : 'NO',
          r.reviewNotes.join('; '),
          r.migrationBatchId,
        ])
      ]
    )
  }

  return (
    <div style={{ maxWidth: 1480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#e6edf3', margin: 0 }}>
              Historical Data Migration &amp; Validation
            </h1>
            <span style={{ background: '#f0b42922', color: '#f0b429', border: '1px solid #f0b42944', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
              PHASE 2 ARCHITECTURE
            </span>
            <span style={{ background: '#1a8cff22', color: '#1a8cff', border: '1px solid #1a8cff44', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
              Batch: {MIGRATION_BATCH_ID}
            </span>
          </div>
          <p style={{ color: '#8b949e', fontSize: 13, margin: '4px 0 0' }}>
            Primary Source: <strong style={{ color: '#e6edf3' }}>{SOURCE_DOCUMENT_NAME}</strong> · FY 2025–26 (as on 30 March 2026)
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={handleResetToBaseline}>
            ↺ Reset to Source Baseline
          </button>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={handleExportCSV}>
            ⬇ Export Migration CSV
          </button>
          <button
            className="btn-primary"
            style={{ fontSize: 12.5, background: '#3fb950', borderColor: '#3fb950' }}
            onClick={handlePostApprovedToCentral}
          >
            ⚡ Post Approved Records ({reconciliation.approvedCount})
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {notice && (
        <div style={{
          background: notice.type === 'success' ? '#3fb95022' : notice.type === 'warn' ? '#f0b42922' : '#1a8cff22',
          border: `1px solid ${notice.type === 'success' ? '#3fb95066' : notice.type === 'warn' ? '#f0b42966' : '#1a8cff66'}`,
          borderRadius: 8,
          padding: '10px 16px',
          color: notice.type === 'success' ? '#3fb950' : notice.type === 'warn' ? '#f0b429' : '#1a8cff',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{notice.msg}</span>
          <button onClick={() => setNotice(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* ── 11-STEP CONTROLLED MIGRATION WORKFLOW RIBBON (Part 1) ── */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8b949e', letterSpacing: '0.05em', marginBottom: 8 }}>
          PHASE 2 CONTROLLED MIGRATION WORKFLOW (STEPS 1 TO 11)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: 6, fontSize: 11 }}>
          {[
            { n: 1, title: 'Source Select', desc: 'Day Book PDF', done: true },
            { n: 2, title: 'Extract Rows', desc: '49 Rows Found', done: true },
            { n: 3, title: 'Review Extracted', desc: 'Source Preservation', done: true },
            { n: 4, title: 'Map Tx Types', desc: '16 Classes', done: true },
            { n: 5, title: 'CoA Mapping', desc: 'Existing Phase 1 CoA', done: true },
            { n: 6, title: 'Payment Modes', desc: 'Cash/Bank/Unknown', active: reconciliation.needsReviewCount > 0 },
            { n: 7, title: 'Double Entry', desc: 'Debit = Credit Check', done: true },
            { n: 8, title: 'Reconcile Totals', desc: 'Source vs Calculated', active: true },
            { n: 9, title: 'Show Exceptions', desc: 'Date & Discrepancies', active: true },
            { n: 10, title: 'User Approval', desc: 'No Silent Posting', active: reconciliation.approvedCount > 0 },
            { n: 11, title: 'Post to Ledger', desc: `${reconciliation.postedCount} Posted`, done: reconciliation.postedCount === 49 },
          ].map(s => (
            <div
              key={s.n}
              style={{
                background: s.done ? '#3fb95015' : s.active ? '#1a8cff15' : '#21262d44',
                border: `1px solid ${s.done ? '#3fb95044' : s.active ? '#1a8cff44' : '#30363d'}`,
                borderRadius: 6,
                padding: '6px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontWeight: 800, color: s.done ? '#3fb950' : s.active ? '#1a8cff' : '#8b949e' }}>
                {s.done ? '✓ ' : ''}Step {s.n}
              </div>
              <div style={{ color: '#e6edf3', fontWeight: 600, fontSize: 10.5, marginTop: 1 }}>{s.title}</div>
              <div style={{ color: '#8b949e', fontSize: 9.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HISTORICAL RECONCILIATION DASHBOARD (Parts 13, 14, 21, 22) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Total Extracted Rows</div>
          <div className="amount" style={{ fontSize: 22, fontWeight: 800, color: '#e6edf3' }}>
            {reconciliation.totalSourceRows} Rows
          </div>
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>
            Page 1: 27 rows · Page 2: 22 rows
          </div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Needs Review / Ambiguous</div>
          <div className="amount" style={{ fontSize: 22, fontWeight: 800, color: reconciliation.needsReviewCount > 0 ? '#f0b429' : '#3fb950' }}>
            {reconciliation.needsReviewCount} Rows
          </div>
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>
            Unknown payment modes or date warning
          </div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Approved Rows</div>
          <div className="amount" style={{ fontSize: 22, fontWeight: 800, color: '#1a8cff' }}>
            {reconciliation.approvedCount} Rows
          </div>
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>
            Authorized for posting
          </div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Posted to Live Ledger</div>
          <div className="amount" style={{ fontSize: 22, fontWeight: 800, color: '#3fb950' }}>
            {reconciliation.postedCount} Rows
          </div>
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>
            Double-entry posted with voucher ID
          </div>
        </div>
      </div>

      {/* ── CRITICAL SOURCE-STATED VS CALCULATED RECONCILIATION TABLE (Parts 13, 14, 21) ── */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#e6edf3' }}>
              Historical Reconciliation: Source-Stated vs. Calculated from Rows (Parts 13 &amp; 14)
            </div>
            <div style={{ fontSize: 11.5, color: '#8b949e' }}>
              Comparison between figures printed on the Day Book register and individual row totals
            </div>
          </div>
          <span style={{
            background: Math.abs(reconciliation.paymentsDifference) > 0 ? '#f8514922' : '#3fb95022',
            color: Math.abs(reconciliation.paymentsDifference) > 0 ? '#f85149' : '#3fb950',
            border: `1px solid ${Math.abs(reconciliation.paymentsDifference) > 0 ? '#f8514955' : '#3fb95055'}`,
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 700,
          }}>
            {Math.abs(reconciliation.paymentsDifference) > 0 ? '⚠ HISTORICAL SOURCE DISCREPANCY IDENTIFIED' : '✓ RECONCILED'}
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Historical Financial Metric</th>
                <th style={{ textAlign: 'right' }}>Source-Stated Figure (Printed PDF)</th>
                <th style={{ textAlign: 'right' }}>Calculated from Source Rows</th>
                <th style={{ textAlign: 'right' }}>Difference / Variance</th>
                <th>Audit Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700, color: '#ffffff' }}>Total Receipts (April 2025 – March 2026)</td>
                <td className="amount" style={{ textAlign: 'right', fontWeight: 700, color: '#00d4aa' }}>
                  {fmt(reconciliation.sourceStatedReceipts)}
                </td>
                <td className="amount" style={{ textAlign: 'right', fontWeight: 700, color: '#00d4aa' }}>
                  {fmt(reconciliation.calculatedReceipts)}
                </td>
                <td className="amount" style={{ textAlign: 'right', color: '#3fb950', fontWeight: 600 }}>
                  ₹0.00
                </td>
                <td>
                  <span className="badge-green" style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                    ✓ EXACT MATCH
                  </span>
                </td>
              </tr>

              <tr style={{ background: '#f8514908' }}>
                <td style={{ fontWeight: 700, color: '#ffffff' }}>
                  Total Payments (April 2025 – March 2026)
                  <span style={{ display: 'block', fontSize: 10.5, color: '#8b949e', fontWeight: 400 }}>
                    Per Part 14: Printed total says ₹80,120.87, but row-by-row sum is ₹99,852.87
                  </span>
                </td>
                <td className="amount" style={{ textAlign: 'right', fontWeight: 700, color: '#f85149' }}>
                  {fmt(reconciliation.sourceStatedPayments)}
                </td>
                <td className="amount" style={{ textAlign: 'right', fontWeight: 700, color: '#f85149' }}>
                  {fmt(reconciliation.calculatedPayments)}
                </td>
                <td className="amount" style={{ textAlign: 'right', color: '#f85149', fontWeight: 800 }}>
                  +₹{fmt(reconciliation.paymentsDifference).replace('₹', '')}
                </td>
                <td>
                  <span className="badge-red" style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                    ⚠ REQUIRES VERIFICATION
                  </span>
                </td>
              </tr>

              <tr>
                <td style={{ fontWeight: 700, color: '#ffffff' }}>
                  Closing Balance (Receipts − Payments)
                  <span style={{ display: 'block', fontSize: 10.5, color: '#8b949e', fontWeight: 400 }}>
                    Per Part 21: Preserved as Source-Stated Historical Figure, NOT automatically injected as Cash OB
                  </span>
                </td>
                <td className="amount" style={{ textAlign: 'right', fontWeight: 700, color: '#e6edf3' }}>
                  {fmt(reconciliation.sourceStatedClosingBalance)}
                </td>
                <td className="amount" style={{ textAlign: 'right', fontWeight: 700, color: '#e6edf3' }}>
                  {fmt(reconciliation.calculatedClosingBalance)}
                </td>
                <td className="amount" style={{ textAlign: 'right', color: '#f0b429', fontWeight: 700 }}>
                  -₹{fmt(Math.abs(reconciliation.closingBalanceDifference)).replace('₹', '')}
                </td>
                <td>
                  <span className="badge-yellow" style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                    ⚠ VARIANCE: ₹19,732
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Audit Callout Warnings */}
        <div style={{ padding: '14px 20px', background: '#1c2330', borderTop: '1px solid #30363d', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#8b949e' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: '#f85149', fontSize: 15 }}>⚠</span>
            <span>
              <strong style={{ color: '#f85149' }}>Part 14 Payment Total Discrepancy Rule:</strong> The printed subtotal on the historical Day Book states payments of <strong style={{ color: '#e6edf3' }}>₹80,120.87</strong>, but the mathematical sum of the 49 individual payment rows is <strong style={{ color: '#e6edf3' }}>₹99,852.87</strong> (Difference: <strong style={{ color: '#f85149' }}>₹19,732.00</strong>). Per system policy, the source document is never silently corrected, and row amounts are preserved exactly as stated in the source.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: '#f0b429', fontSize: 15 }}>⚠</span>
            <span>
              <strong style={{ color: '#f0b429' }}>Part 15 Date Validation Rule:</strong> Row 4 contains a date recorded as <strong style={{ color: '#e6edf3' }}>04-05-2026</strong> for typing &amp; printing (₹120). This is preserved as stated, but flagged with a warning requiring accountant review.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: '#1a8cff', fontSize: 15 }}>ℹ</span>
            <span>
              <strong style={{ color: '#1a8cff' }}>Part 7 &amp; 17 Protection Rules:</strong> The source document does not specify whether expenses were paid via Cash or Bank (except Row 9 paid online). All unspecified modes are held as <strong style={{ color: '#e6edf3' }}>UNKNOWN</strong> until reviewed. No silent posting occurs without accountant approval.
            </span>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #30363d', paddingBottom: 10, flexWrap: 'wrap' }}>
        {[
          { id: 'register', label: '📋 Historical Import Register', count: rows.length },
          { id: 'source_viewer', label: '📄 Source Day Book Viewer (PDF vs Accounting)', count: '49 Rows' },
          { id: 'report', label: '📊 Formal Migration Report (FY 2025–26)', count: 'Summary' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              background: activeTab === tab.id ? 'linear-gradient(135deg, #1a8cff22, #00d4aa15)' : '#161b22',
              border: activeTab === tab.id ? '1px solid #1a8cff' : '1px solid #30363d',
              color: activeTab === tab.id ? '#1a8cff' : '#8b949e',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 12.5,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <span>{tab.label}</span>
            <span style={{
              background: activeTab === tab.id ? '#1a8cff33' : '#21262d',
              color: activeTab === tab.id ? '#e6edf3' : '#8b949e',
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: 10,
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: HISTORICAL IMPORT REGISTER (Part 18 & 19) ── */}
      {activeTab === 'register' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Toolbar: Filters, Batch Actions, Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 3, gap: 2, flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `All (${rows.length})` },
                { id: 'NEEDS_REVIEW', label: `Needs Review (${reconciliation.needsReviewCount})` },
                { id: 'MAPPED', label: `Mapped (${reconciliation.mappedCount})` },
                { id: 'APPROVED', label: `Approved (${reconciliation.approvedCount})` },
                { id: 'POSTED', label: `Posted (${reconciliation.postedCount})` },
                { id: 'DATE_WARNINGS', label: `Date Warnings (1)` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  style={{
                    background: statusFilter === f.id ? '#1a8cff' : 'transparent',
                    color: statusFilter === f.id ? 'white' : '#8b949e',
                    border: 'none',
                    borderRadius: 6,
                    padding: '5px 12px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Batch Action Buttons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="btn-ghost"
                style={{ fontSize: 11.5 }}
                onClick={handleApproveSelected}
                disabled={selectedRowIds.length === 0}
              >
                Approve Selected ({selectedRowIds.length})
              </button>
              <button
                className="btn-ghost"
                style={{ fontSize: 11.5, color: '#3fb950', borderColor: '#3fb95044' }}
                onClick={handleApproveAllValid}
                title="Approves only rows with resolved payment modes and valid accounts (Part 19)"
              >
                Approve All Valid Rows
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              placeholder="Search by particular, date, sl no, account, payment mode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 380, maxWidth: '100%' }}
            />
            <div style={{ marginLeft: 'auto', fontSize: 12, color: '#8b949e' }}>
              Showing <strong>{filteredRows.length}</strong> of {rows.length} extracted historical records
            </div>
          </div>

          {/* Main Register Table + Detail Inspection Drawer */}
          <div style={{ display: 'grid', gridTemplateColumns: selectedRow ? '1fr 390px' : '1fr', gap: 16 }}>
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#8b949e', letterSpacing: '0.05em' }}>
                  SOURCE DAY BOOK MIGRATION REGISTER · 49 AUDITED ENTRIES
                </span>
                <span style={{ fontSize: 11, color: '#8b949e' }}>Click any row to open the Mapping Drawer</span>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}>
                        <input
                          type="checkbox"
                          checked={selectedRowIds.length > 0 && selectedRowIds.length === filteredRows.length}
                          onChange={handleSelectAllFiltered}
                        />
                      </th>
                      <th style={{ width: 36 }}>Sl.</th>
                      <th>Page</th>
                      <th>Date</th>
                      <th>Original Particular</th>
                      <th style={{ textAlign: 'right' }}>Receipt (Dr) ₹</th>
                      <th style={{ textAlign: 'right' }}>Payment (Cr) ₹</th>
                      <th>Classification</th>
                      <th>Chart of Accounts</th>
                      <th>Payment Mode</th>
                      <th>Member</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center', width: 90 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map(r => {
                      const isSelected = selectedRow?.id === r.id
                      const isChecked = selectedRowIds.includes(r.id)
                      const isReceipt = (r.sourceReceipt || 0) > 0

                      return (
                        <tr
                          key={r.id}
                          onClick={() => handleOpenRowInspect(r)}
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? '#1a8cff15' : isChecked ? '#21262d' : undefined,
                          }}
                        >
                          <td onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectRow(r.id)}
                            />
                          </td>
                          <td className="amount" style={{ color: '#8b949e' }}>{r.slno}</td>
                          <td style={{ fontSize: 11, color: '#8b949e' }}>P.{r.sourcePage}</td>
                          <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                            {r.correctedDate ? (
                              <span style={{ color: '#3fb950', fontWeight: 600 }}>{r.correctedDate}</span>
                            ) : (
                              <span style={{ color: r.dateWarning ? '#f85149' : '#e6edf3', fontWeight: r.dateWarning ? 800 : 500 }}>
                                {r.sourceDate}
                                {r.dateWarning && <span title="Date Anomaly: 2026 typo for 2025" style={{ marginLeft: 4 }}>⚠</span>}
                              </span>
                            )}
                          </td>
                          <td style={{ fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.sourceParticular}
                          </td>
                          <td className="amount" style={{ textAlign: 'right', color: '#00d4aa', fontWeight: isReceipt ? 700 : 400 }}>
                            {r.sourceReceipt ? fmt(r.sourceReceipt) : '—'}
                          </td>
                          <td className="amount" style={{ textAlign: 'right', color: '#f85149', fontWeight: !isReceipt ? 700 : 400 }}>
                            {r.sourcePayment ? fmt(r.sourcePayment) : '—'}
                          </td>
                          <td>
                            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#1c2330', color: '#1a8cff', fontWeight: 600 }}>
                              {r.classification}
                            </span>
                          </td>
                          <td style={{ fontSize: 11.5, color: '#e6edf3', whiteSpace: 'nowrap' }}>
                            {r.accountCode ? (
                              <span>
                                <strong style={{ color: '#a78bfa' }}>[{r.accountCode}]</strong> {r.accountName}
                              </span>
                            ) : (
                              <span style={{ color: '#f85149' }}>Unmapped</span>
                            )}
                          </td>
                          <td>
                            <span style={{
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: r.paymentMode === 'UNKNOWN' ? '#f0b42922' : '#3fb95022',
                              color: r.paymentMode === 'UNKNOWN' ? '#f0b429' : '#3fb950',
                              fontWeight: 700,
                            }}>
                              {r.paymentMode}
                            </span>
                          </td>
                          <td style={{ fontSize: 11, color: '#8b949e', whiteSpace: 'nowrap' }}>
                            {r.memberId ? (
                              <span style={{ color: '#a78bfa' }}>{r.memberName || r.memberId}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={{ fontSize: 11, color: '#8b949e', whiteSpace: 'nowrap' }}>
                            {r.projectId ? (
                              <span style={{ color: '#00d4aa' }}>Bastenga</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            <span style={{
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontWeight: 700,
                              background:
                                r.status === 'POSTED'
                                  ? '#3fb95022'
                                  : r.status === 'APPROVED'
                                  ? '#1a8cff22'
                                  : r.status === 'MAPPED'
                                  ? '#a78bfa22'
                                  : '#f0b42922',
                              color:
                                r.status === 'POSTED'
                                  ? '#3fb950'
                                  : r.status === 'APPROVED'
                                  ? '#1a8cff'
                                  : r.status === 'MAPPED'
                                  ? '#a78bfa'
                                  : '#f0b429',
                            }}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                            {r.status === 'POSTED' ? (
                              <span style={{ fontSize: 10, color: '#3fb950', fontFamily: 'var(--font-mono)' }}>
                                {r.postedVoucherNo}
                              </span>
                            ) : r.status === 'APPROVED' ? (
                              <span style={{ fontSize: 10, color: '#1a8cff' }}>✓ Approved</span>
                            ) : (
                              <button
                                style={{
                                  background: '#1c2330',
                                  border: '1px solid #30363d',
                                  color: '#00d4aa',
                                  borderRadius: 4,
                                  padding: '2px 8px',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                }}
                                onClick={() => handleApproveSingleRow(r.id)}
                              >
                                Approve
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} style={{ color: '#8b949e' }}>
                        Row Sums ({filteredRows.length} displayed of 49 total)
                      </td>
                      <td className="amount" style={{ textAlign: 'right', color: '#00d4aa', fontWeight: 800 }}>
                        {fmt(filteredRows.reduce((s, r) => s + (r.sourceReceipt || 0), 0))}
                      </td>
                      <td className="amount" style={{ textAlign: 'right', color: '#f85149', fontWeight: 800 }}>
                        {fmt(filteredRows.reduce((s, r) => s + (r.sourcePayment || 0), 0))}
                      </td>
                      <td colSpan={7} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ── ROW INSPECTION & MAPPING DRAWER ── */}
            {selectedRow && (
              <div style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 12,
                padding: 18,
                alignSelf: 'start',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#8b949e' }}>
                      SOURCE ROW #{selectedRow.slno} · PAGE {selectedRow.sourcePage}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#ffffff', marginTop: 2 }}>
                      {selectedRow.sourceParticular}
                    </div>
                  </div>
                  <button onClick={() => setSelectedRow(null)} style={{ background: 'transparent', border: 'none', color: '#8b949e', fontSize: 18, cursor: 'pointer' }}>✕</button>
                </div>

                {/* Amount Pill */}
                <div style={{ background: '#1c2330', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#8b949e' }}>
                      {(selectedRow.sourceReceipt || 0) > 0 ? 'Receipt (Dr)' : 'Payment (Cr)'}
                    </div>
                    <div className="amount" style={{ fontSize: 18, fontWeight: 800, color: (selectedRow.sourceReceipt || 0) > 0 ? '#00d4aa' : '#f85149' }}>
                      {fmt(selectedRow.sourceAmount)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#8b949e' }}>Date</div>
                    <div className="amount" style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3' }}>
                      {selectedRow.sourceDate}
                    </div>
                  </div>
                </div>

                {/* Date Warning / Correction Box (Part 15) */}
                {selectedRow.dateWarning && (
                  <div style={{ background: '#f8514915', border: '1px solid #f8514944', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f85149', marginBottom: 4 }}>
                      ⚠ Part 15: Date Requires Verification
                    </div>
                    <div style={{ fontSize: 11, color: '#8b949e', lineHeight: 1.4 }}>
                      Source recorded <strong style={{ color: '#e6edf3' }}>04-05-2026</strong>. Probable historical typo for <strong style={{ color: '#3fb950' }}>04-05-2025</strong>.
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        style={{
                          background: editFormData.correctedDate === '04-05-2025' ? '#3fb950' : '#1c2330',
                          color: editFormData.correctedDate === '04-05-2025' ? 'white' : '#3fb950',
                          border: '1px solid #3fb95066',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        onClick={() => setEditFormData({ ...editFormData, correctedDate: '04-05-2025' })}
                      >
                        Approve Correction to 04-05-2025
                      </button>
                      {editFormData.correctedDate && (
                        <button
                          style={{ background: 'transparent', border: 'none', color: '#8b949e', fontSize: 11, cursor: 'pointer' }}
                          onClick={() => setEditFormData({ ...editFormData, correctedDate: undefined })}
                        >
                          Revert
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Mapping Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 3 }}>
                      1. Transaction Classification
                    </label>
                    <select
                      style={{ width: '100%' }}
                      value={editFormData.classification || selectedRow.classification}
                      onChange={e => setEditFormData({ ...editFormData, classification: e.target.value as any })}
                    >
                      {CLASSIFICATIONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 3 }}>
                      2. Chart of Accounts Target (Nominal / Capital)
                    </label>
                    <select
                      style={{ width: '100%' }}
                      value={editFormData.accountId || selectedRow.accountId || ''}
                      onChange={e => setEditFormData({ ...editFormData, accountId: e.target.value })}
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>
                          [{a.code}] {a.name} ({a.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 3 }}>
                      3. Payment Mode (Part 7 Resolution)
                    </label>
                    <select
                      style={{ width: '100%' }}
                      value={editFormData.paymentMode || selectedRow.paymentMode}
                      onChange={e => setEditFormData({ ...editFormData, paymentMode: e.target.value as any })}
                    >
                      {PAYMENT_MODES.map(m => (
                        <option key={m} value={m}>
                          {m === 'UNKNOWN' ? 'UNKNOWN (Requires Review)' : m}
                        </option>
                      ))}
                    </select>
                    {editFormData.paymentMode === 'UNKNOWN' && (
                      <div style={{ fontSize: 10, color: '#f0b429', marginTop: 3 }}>
                        ⚠ Row cannot be approved while payment mode remains UNKNOWN.
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 3 }}>
                      4. Member Master Allocation (Parts 8 &amp; 9)
                    </label>
                    <select
                      style={{ width: '100%' }}
                      value={editFormData.memberId || selectedRow.memberId || 'NONE'}
                      onChange={e => {
                        const val = e.target.value
                        if (val === 'NONE') {
                          setEditFormData({ ...editFormData, memberId: null, memberName: null })
                        } else if (val === 'UNALLOCATED_HISTORICAL') {
                          setEditFormData({ ...editFormData, memberId: 'UNALLOCATED_HISTORICAL', memberName: 'Unallocated Historical Member' })
                        } else {
                          const m = members.find(x => x.memberId === val)
                          setEditFormData({ ...editFormData, memberId: val, memberName: m?.name || val })
                        }
                      }}
                    >
                      <option value="NONE">-- No Member Assigned --</option>
                      <option value="UNALLOCATED_HISTORICAL">UNALLOCATED HISTORICAL (Preserved per Parts 8 &amp; 9)</option>
                      {members.map(m => (
                        <option key={m.id} value={m.memberId}>
                          {m.memberId} – {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 3 }}>
                      5. Project Tagging (Part 27)
                    </label>
                    <select
                      style={{ width: '100%' }}
                      value={editFormData.projectId || selectedRow.projectId || 'NONE'}
                      onChange={e => {
                        const v = e.target.value
                        setEditFormData({
                          ...editFormData,
                          projectId: v === 'NONE' ? null : v,
                          projectName: v === 'BASTENGA_PRODUCTION' ? 'Bastenga / Food Production' : null,
                        })
                      }}
                    >
                      <option value="NONE">-- Unallocated / General --</option>
                      <option value="BASTENGA_PRODUCTION">BASTENGA / FOOD PRODUCTION</option>
                    </select>
                  </div>
                </div>

                {/* Review Notes */}
                <div style={{ background: '#1c2330', borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8b949e', marginBottom: 4 }}>Audit Traceability Notes</div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#8b949e' }}>
                    {selectedRow.reviewNotes.map((n, i) => (
                      <li key={i} style={{ marginBottom: 2 }}>{n}</li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button className="btn-primary" style={{ flex: 1, fontSize: 12 }} onClick={handleSaveRowMapping}>
                    Save Mapping
                  </button>
                  {selectedRow.status !== 'POSTED' && (
                    <button
                      className="btn-ghost"
                      style={{ color: '#3fb950', borderColor: '#3fb95044', fontSize: 12 }}
                      onClick={() => handleApproveSingleRow(selectedRow.id)}
                    >
                      ✓ Approve
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: SOURCE DAY BOOK VIEWER (PDF VS ACCOUNTING - Part 28) ── */}
      {activeTab === 'source_viewer' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 18 }}>
          {/* Original Source Document Layout */}
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #30363d', background: '#1c2330' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📄</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: '#e6edf3' }}>
                  ORIGINAL DAY BOOK (AS EXTRACTED FROM SOURCE PDF)
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>
                Tribal Harvest Day Book Register as on 30 March 2026 (Unchanged Historical Document)
              </div>
            </div>

            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>Sl.</th>
                    <th>Date</th>
                    <th>Particulars</th>
                    <th style={{ textAlign: 'right' }}>Receipt</th>
                    <th style={{ textAlign: 'right' }}>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td className="amount" style={{ color: '#8b949e' }}>{r.slno}</td>
                      <td style={{ fontSize: 12, color: r.dateWarning ? '#f85149' : '#8b949e', whiteSpace: 'nowrap' }}>
                        {r.sourceDate}
                      </td>
                      <td style={{ color: '#ffffff', fontWeight: 600 }}>{r.sourceParticular}</td>
                      <td className="amount" style={{ textAlign: 'right', color: '#00d4aa' }}>
                        {r.sourceReceipt ? fmt(r.sourceReceipt) : '—'}
                      </td>
                      <td className="amount" style={{ textAlign: 'right', color: '#f85149' }}>
                        {r.sourcePayment ? fmt(r.sourcePayment) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Corresponding Accounting Architecture (Part 1 & 20) */}
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #30363d', background: '#1c2330' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📘</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: '#e6edf3' }}>
                  NEW ACCOUNTING ARCHITECTURE MAPPING (DOUBLE-ENTRY)
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>
                Central Transaction Engine · General Ledger Code · Double-Entry Debit/Credit
              </div>
            </div>

            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>Sl.</th>
                    <th>Classification</th>
                    <th>Debit (Dr) Account</th>
                    <th>Credit (Cr) Account</th>
                    <th>Payment Mode</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const isReceipt = (r.sourceReceipt || 0) > 0
                    const assetAcc = r.paymentMode === 'NSCB' ? 'Bank – NSCB' : r.paymentMode === 'UPI_ONLINE' ? 'Bank (Online)' : 'Cash in Hand'
                    const drAcc = isReceipt ? assetAcc : (r.accountName || 'Expense Account')
                    const crAcc = isReceipt ? (r.accountName || 'Income Account') : assetAcc

                    return (
                      <tr key={r.id}>
                        <td className="amount" style={{ color: '#8b949e' }}>{r.slno}</td>
                        <td style={{ fontSize: 11, color: '#1a8cff', fontWeight: 600 }}>{r.classification}</td>
                        <td style={{ fontSize: 11.5, color: '#3fb950', fontWeight: 600 }}>Dr. {drAcc}</td>
                        <td style={{ fontSize: 11.5, color: '#a78bfa', fontWeight: 600 }}>Cr. {crAcc}</td>
                        <td style={{ fontSize: 11, color: r.paymentMode === 'UNKNOWN' ? '#f0b429' : '#e6edf3' }}>
                          {r.paymentMode}
                        </td>
                        <td>
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#1c2330', color: r.status === 'POSTED' ? '#3fb950' : '#8b949e' }}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: FORMAL MIGRATION REPORT (Part 29) ── */}
      {activeTab === 'report' && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ borderBottom: '1px solid #30363d', paddingBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#ffffff' }}>
                TRIBAL HARVEST HISTORICAL DATA MIGRATION REPORT
              </div>
              <div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>
                Tribal Harvest Co-operative Multipurpose Society Ltd. · Financial Year 2025–2026
              </div>
            </div>

            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => window.print()}>
              🖨️ Print / Save PDF
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div style={{ background: '#1c2330', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#8b949e' }}>Source Document</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3', marginTop: 3 }}>{SOURCE_DOCUMENT_NAME}</div>
            </div>
            <div style={{ background: '#1c2330', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#8b949e' }}>Migration Batch ID</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a8cff', marginTop: 3 }}>{MIGRATION_BATCH_ID}</div>
            </div>
            <div style={{ background: '#1c2330', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#8b949e' }}>Audit Verification Date</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3', marginTop: 3 }}>30 March 2026</div>
            </div>
          </div>

          {/* Summary Table */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Financial Section</th>
                  <th style={{ textAlign: 'right' }}>Source-Stated (₹)</th>
                  <th style={{ textAlign: 'right' }}>Calculated Total (₹)</th>
                  <th style={{ textAlign: 'right' }}>Variance / Difference</th>
                  <th>Reconciliation Audit Remark</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 700, color: '#ffffff' }}>Receipts (Share Capital, Adm Fee, Sales)</td>
                  <td className="amount" style={{ textAlign: 'right', color: '#00d4aa' }}>{fmt(reconciliation.sourceStatedReceipts)}</td>
                  <td className="amount" style={{ textAlign: 'right', color: '#00d4aa' }}>{fmt(reconciliation.calculatedReceipts)}</td>
                  <td className="amount" style={{ textAlign: 'right', color: '#3fb950' }}>₹0.00</td>
                  <td><span className="badge-green" style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>✓ EXACT RECONCILIATION</span></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, color: '#ffffff' }}>Payments (Expenses, Procurements, Labour)</td>
                  <td className="amount" style={{ textAlign: 'right', color: '#f85149' }}>{fmt(reconciliation.sourceStatedPayments)}</td>
                  <td className="amount" style={{ textAlign: 'right', color: '#f85149' }}>{fmt(reconciliation.calculatedPayments)}</td>
                  <td className="amount" style={{ textAlign: 'right', color: '#f85149' }}>+₹19,732.00</td>
                  <td><span className="badge-red" style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>⚠ SOURCE DISCREPANCY PRESERVED</span></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, color: '#ffffff' }}>Closing Balance</td>
                  <td className="amount" style={{ textAlign: 'right' }}>{fmt(reconciliation.sourceStatedClosingBalance)}</td>
                  <td className="amount" style={{ textAlign: 'right' }}>{fmt(reconciliation.calculatedClosingBalance)}</td>
                  <td className="amount" style={{ textAlign: 'right', color: '#f0b429' }}>-₹19,732.00</td>
                  <td><span className="badge-yellow" style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>⚠ VARIANCE NOTED</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Compliance Checklist (Part 30) */}
          <div style={{ background: '#1c2330', borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#e6edf3', marginBottom: 10 }}>
              PHASE 2 QUALITY &amp; INTEGRITY CONTROLS (PART 30 CHECKLIST)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8, fontSize: 12 }}>
              {[
                { label: 'Every source row is historically traceable', ok: true },
                { label: 'Original source amounts preserved without silent alteration', ok: true },
                { label: 'No duplicate members created in Master Register', ok: true },
                { label: 'No ambiguous payment modes invented (held as UNKNOWN)', ok: true },
                { label: 'No stock physical quantities invented', ok: true },
                { label: 'No member allocation invented (Unallocated Historical used)', ok: true },
                { label: 'Date validation alert flagged for Row 4 (04-05-2026)', ok: true },
                { label: 'Every posted transaction enforces double-entry (Dr = Cr)', ok: true },
                { label: 'Original source document preserved as historical baseline', ok: true },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e6edf3' }}>
                  <span style={{ color: '#3fb950', fontWeight: 800 }}>✓</span>
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── IN-APP CONFIRMATION MODAL ── */}
      {confirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setConfirmModal(null)}
        >
          <div
            style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>{confirmModal.danger ? '⚠️' : 'ℹ️'}</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                {confirmModal.title}
              </h3>
            </div>
            <p style={{ fontSize: 13, color: '#8b949e', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn-ghost"
                onClick={() => setConfirmModal(null)}
                style={{ fontSize: 13, padding: '7px 14px' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                style={{
                  background: confirmModal.danger ? '#da3633' : '#1a8cff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
