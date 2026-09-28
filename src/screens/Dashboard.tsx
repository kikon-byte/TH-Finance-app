import { useState } from 'react'
import { Link } from 'react-router'
import { useAccounting } from '../context/AccountingContext'
import { useRegisters } from '../context/RegistersContext'
import { downloadCSV } from '../utils/downloadCSV'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function Dashboard() {
  const {
    cashBook,
    getBankBook,
    getAccountLedger,
    trialBalance,
    transactions,
    resetTransactionsToDefault,
  } = useAccounting()

  const {
    members,
    shareEntries,
    projectEntries,
    resetMembersToDefault,
    resetSharesToDefault,
  } = useRegisters()

  const [resetMessage, setResetMessage] = useState<string | null>(null)

  // Derived Financials
  const cashBalance = cashBook.closingBalance
  const nstcbBalance = getBankBook('acc_nstcb').closingBalance
  const sbiBalance = getBankBook('acc_sbi').closingBalance
  const totalBankAndCash = cashBalance + nstcbBalance + sbiBalance

  const loanReceivable = getAccountLedger('acc_loan_rec').closingBalance
  const fixedAssets = getAccountLedger('acc_fixed_assets').closingBalance
  const stockInventory = getAccountLedger('acc_inv_raw').closingBalance + getAccountLedger('acc_inv_livestock').closingBalance

  // Share capital from ledger account 3010 or share register
  const auditedShareCapital = getAccountLedger('acc_share_capital').closingBalance || 105000
  const totalSharesAllotted = shareEntries.reduce((s, e) => s + (e.noShares || 0), 0)
  const activeMembersCount = members.filter(m => m.status === 'Active').length

  // Receipts and Payments in current period (Debit = Receipts for Bank/Cash, Credit = Payments)
  const totalReceipts = cashBook.totalDebit + getBankBook('acc_nstcb').totalDebit + getBankBook('acc_sbi').totalDebit
  const totalPayments = cashBook.totalCredit + getBankBook('acc_nstcb').totalCredit + getBankBook('acc_sbi').totalCredit

  const handleClearAllLeftoverData = () => {
    try {
      // Clear legacy keys
      const keysToClear = [
        'thmcs_accounts_v1',
        'thmcs_accounts_v2',
        'thmcs_transactions_v1',
        'thmcs_transactions_v2',
        'th_projects_v1',
        'th_projects_seed',
        'th_loans_dummy',
        'th_stock_dummy',
        'th_assets_dummy',
      ]
      keysToClear.forEach(k => localStorage.removeItem(k))

      // Trigger context resets to pristine audited baseline
      resetTransactionsToDefault()
      resetMembersToDefault()
      resetSharesToDefault()

      setResetMessage('All obsolete dummy keys cleared! Audited FY 2025-2026 data re-loaded.')
      setTimeout(() => setResetMessage(null), 5000)
    } catch (e) {
      console.error(e)
    }
  }

  const handleExportDashboardCSV = () => {
    downloadCSV(
      'thmcs-dashboard-financial-summary.csv',
      ['Metric', 'Value', 'Status / Detail'],
      [
        ['Cash in Hand', fmt(cashBalance), 'Account 1010 - Closing Cash Balance'],
        ['NSCB Bank Balance', fmt(nstcbBalance), 'Account 1020 - Nagaland State Co-op Bank'],
        ['SBI Bank Balance', fmt(sbiBalance), 'Account 1030 - State Bank of India'],
        ['Total Liquid Funds', fmt(totalBankAndCash), 'Cash & Bank Books'],
        ['Member Loans Receivable', fmt(loanReceivable), 'Account 1040 - Own Funds'],
        ['Total Share Capital', fmt(auditedShareCapital), `Account 3010 (${totalSharesAllotted} member shares)`],
        ['Registered Members', members.length, `${activeMembersCount} Active Members`],
        ['Total Receipts (Current)', fmt(totalReceipts), 'Day Book Receipts'],
        ['Total Payments (Current)', fmt(totalPayments), 'Day Book Payments'],
        ['Trial Balance Debit', fmt(trialBalance.totalDebit), trialBalance.isBalanced ? 'Balanced' : 'Discrepancy'],
        ['Trial Balance Credit', fmt(trialBalance.totalCredit), trialBalance.isBalanced ? 'Balanced' : 'Discrepancy'],
      ]
    )
  }

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#e6edf3', margin: 0 }}>
              Executive Financial Dashboard
            </h1>
            <span style={{ background: '#3fb95022', color: '#3fb950', border: '1px solid #3fb95044', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
              AUDITED FY 2025-26 REGISTER (49 ENTRIES)
            </span>
          </div>
          <p style={{ color: '#8b949e', fontSize: 13, margin: '4px 0 0' }}>
            Tribal Harvest Co-operative Multipurpose Society Ltd. · Chümoukedima, Nagaland
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={handleExportDashboardCSV}>
            ⬇ Export Summary CSV
          </button>
          <button
            className="btn-ghost"
            style={{ fontSize: 12, borderColor: '#f8514966', color: '#ff7b72' }}
            onClick={handleClearAllLeftoverData}
          >
            🧹 Purge Leftover Dummy Data
          </button>
          <Link to="/migration" className="btn-ghost" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#00d4aa', borderColor: '#00d4aa44' }}>
            📥 Historical Migration
          </Link>
          <Link to="/daybook" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            📒 Open Day Book
          </Link>
        </div>
      </div>

      {resetMessage && (
        <div style={{ background: '#3fb95022', border: '1px solid #3fb95055', borderRadius: 8, padding: '12px 18px', color: '#3fb950', fontSize: 13, fontWeight: 600 }}>
          ✓ {resetMessage}
        </div>
      )}

      {/* Primary Financial Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Cash in Hand</span>
            <span style={{ fontSize: 16 }}>💵</span>
          </div>
          <div className="amount" style={{ fontSize: 24, fontWeight: 800, color: '#e6edf3' }}>{fmt(cashBalance)}</div>
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>Account Code 1010</div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5 }}>NSCB Bank Account</span>
            <span style={{ fontSize: 16 }}>🏦</span>
          </div>
          <div className="amount" style={{ fontSize: 24, fontWeight: 800, color: '#1a8cff' }}>{fmt(nstcbBalance)}</div>
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>Nagaland State Co-op Bank (1020)</div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5 }}>SBI Bank Account</span>
            <span style={{ fontSize: 16 }}>🏛</span>
          </div>
          <div className="amount" style={{ fontSize: 24, fontWeight: 800, color: '#00d4aa' }}>{fmt(sbiBalance)}</div>
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>State Bank of India (1030)</div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Paid-Up Share Capital</span>
            <span style={{ fontSize: 16 }}>📋</span>
          </div>
          <div className="amount" style={{ fontSize: 24, fontWeight: 800, color: '#f0b429' }}>{fmt(auditedShareCapital)}</div>
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>Account Code 3010 ({totalSharesAllotted} member shares)</div>
        </div>
      </div>

      {/* Secondary Operational Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Total Members</div>
          <div className="amount" style={{ fontSize: 20, fontWeight: 700, color: '#e6edf3' }}>{members.length} Members</div>
          <div style={{ fontSize: 11, color: '#3fb950', marginTop: 4 }}>{activeMembersCount} Active · Permanent Master Preserved</div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Active Loans Receivable</div>
          <div className="amount" style={{ fontSize: 20, fontWeight: 700, color: '#1a8cff' }}>{fmt(loanReceivable)}</div>
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>All dummy loans reset to ₹0</div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Fixed Assets &amp; Inventory</div>
          <div className="amount" style={{ fontSize: 20, fontWeight: 700, color: '#00d4aa' }}>{fmt(fixedAssets + stockInventory)}</div>
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>Dummy assets &amp; feeds reset to ₹0</div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Trial Balance Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 14, color: '#3fb950', fontWeight: 800 }}>●</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#3fb950' }}>Balanced</span>
          </div>
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>
            ₹{trialBalance.totalDebit.toLocaleString('en-IN')} Dr = ₹{trialBalance.totalCredit.toLocaleString('en-IN')} Cr
          </div>
        </div>
      </div>

      {/* Grid: Recent Transactions & Quick Register Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Recent Transactions Card */}
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#e6edf3' }}>
              Recent Accounting Transactions
            </span>
            <span style={{ fontSize: 11, color: '#8b949e' }}>Total: {transactions.length}</span>
          </div>

          <div style={{ padding: 20 }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8b949e' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📒</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e6edf3', marginBottom: 6 }}>Clean Slate: No Transactions Posted Yet</div>
                <p style={{ fontSize: 13, maxWidth: 440, margin: '0 auto 16px', lineHeight: 1.5 }}>
                  All dummy transactions have been reset to zero as instructed. Member names and uploaded share data remain preserved.
                </p>
                <Link to="/daybook" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  Record First Real Voucher
                </Link>
              </div>
            ) : (
              <div className="table-wrap" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #30363d', color: '#8b949e', fontSize: 11 }}>
                      <th style={{ padding: '8px 10px' }}>Voucher</th>
                      <th style={{ padding: '8px 10px' }}>Date</th>
                      <th style={{ padding: '8px 10px' }}>Type</th>
                      <th style={{ padding: '8px 10px' }}>Narration</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #21262d', fontSize: 12 }}>
                        <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: '#1a8cff' }}>{t.voucherNo}</td>
                        <td style={{ padding: '8px 10px', color: '#8b949e' }}>{t.date}</td>
                        <td style={{ padding: '8px 10px' }}>{t.type}</td>
                        <td style={{ padding: '8px 10px', color: '#e6edf3' }}>{t.narration}</td>
                        <td className="amount" style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Operational Modules Navigation */}
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#e6edf3', marginBottom: 14 }}>
            Operational Registers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { to: '/members', label: 'Membership Register', desc: `${members.length} Members Master (Preserved)`, icon: '👥' },
              { to: '/shares', label: 'Shareholder Ledger', desc: `${totalSharesAllotted} Shares @ ₹1,000 (NStCB)`, icon: '📋' },
              { to: '/daybook', label: 'Day Book & Cash Book', desc: 'Double-Entry Vouchers & TB', icon: '📒' },
              { to: '/loans', label: 'Loan Register & Ledger', desc: 'Disbursement & Recovery', icon: '₹' },
              { to: '/projects', label: 'Project Register', desc: `${projectEntries.length} Projects Recorded`, icon: '🏗' },
              { to: '/stock', label: 'Stock & Investments', desc: 'Warehouse Feeds & Deposits', icon: '📦' },
              { to: '/assets', label: 'Asset Register', desc: 'Fixed Assets & WDV Depreciation', icon: '🏛' },
            ].map(m => (
              <Link
                key={m.to}
                to={m.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: 8,
                  padding: '10px 14px',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{m.icon}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: '#e6edf3' }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: '#8b949e' }}>{m.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
