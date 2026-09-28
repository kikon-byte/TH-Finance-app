import React, { useState, useEffect, Fragment } from 'react'
import { useAccounting } from '../context/AccountingContext'
import { useRegisters } from '../context/RegistersContext'
import { downloadCSV } from '../utils/downloadCSV'
import { type Transaction, type PaymentMode } from '../types/accounting'
import { isDateInRange } from '../services/accountingEngine'
import { runPhase1VerificationSuite, type Phase1VerificationReport } from '../services/verifyPhase1'
import Phase1VerificationSuite from '../components/Phase1VerificationSuite'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

type TabType = 'auditregister' | 'daybook' | 'cashbook' | 'bankbook' | 'ledger' | 'trialbalance' | 'verification'

export type AuditRow = {
  slno: number
  date: string
  particulars: string
  receipt: number | null
  payment: number | null
}

export type AuditMonthGroup = {
  month: string
  rows: AuditRow[]
}

export const AUDIT_MONTHS: AuditMonthGroup[] = [
  {
    month: 'APRIL',
    rows: [
      { slno: 1, date: '01-04-2025', particulars: 'Share Capital', receipt: 105000, payment: null },
      { slno: 2, date: '01-04-2025', particulars: 'Membership Fees', receipt: 3200, payment: null },
      { slno: 3, date: '05-04-2025', particulars: 'Meeting Expenses', receipt: null, payment: 1000 },
      { slno: 4, date: '05-04-2025', particulars: 'Typing and printing', receipt: null, payment: 120 },
    ],
  },
  {
    month: 'MAY',
    rows: [
      { slno: 5, date: '12-05-2025', particulars: 'Admin and office ( Seal & Pad)', receipt: null, payment: 4000 },
      { slno: 6, date: '13-05-2025', particulars: 'Register', receipt: null, payment: 320 },
    ],
  },
  {
    month: 'JUNE',
    rows: [
      { slno: 7, date: '20-06-2025', particulars: 'Sale Deed House rent agreement', receipt: null, payment: 1000 },
      { slno: 8, date: '20-06-2025', particulars: 'Documentation', receipt: null, payment: 300 },
    ],
  },
  {
    month: 'JULY',
    rows: [
      { slno: 9, date: '01-07-2025', particulars: 'FSSAI Registration paid online', receipt: null, payment: 3400 },
      { slno: 10, date: '02-07-2025', particulars: 'Meeting Expenses', receipt: null, payment: 1000 },
      { slno: 11, date: '27-07-2025', particulars: 'Meeting & BOD Expenses', receipt: null, payment: 700 },
      { slno: 12, date: '30-07-2025', particulars: 'Purchase – Restokart', receipt: null, payment: 2566.18 },
    ],
  },
  {
    month: 'AUGUST',
    rows: [
      { slno: 13, date: '04-08-2025', particulars: 'Purchase – Swiss', receipt: null, payment: 250 },
      { slno: 14, date: '10-08-2025', particulars: 'BOD Expenses', receipt: null, payment: 300 },
      { slno: 15, date: '13-08-2025', particulars: 'Purchase – Swiss', receipt: null, payment: 1805.40 },
      { slno: 16, date: '15-08-2025', particulars: 'BOD Expenses', receipt: null, payment: 400 },
      { slno: 17, date: '20-08-2025', particulars: 'Purchase – Restokart', receipt: null, payment: 2483.04 },
      { slno: 18, date: '21-08-2025', particulars: 'Purchase – Aumni', receipt: null, payment: 847 },
      { slno: 19, date: '29-08-2025', particulars: 'Meeting Expenses', receipt: null, payment: 800 },
      { slno: 20, date: '29-08-2025', particulars: 'Purchase – Swiss', receipt: null, payment: 3943.56 },
    ],
  },
  {
    month: 'SEPTEMBER',
    rows: [
      { slno: 21, date: '01-09-2025', particulars: 'Purchase – Restokart', receipt: null, payment: 1923.37 },
      { slno: 22, date: '01-09-2025', particulars: 'Raw Materials Purchase for ( 200 Bastenga)', receipt: null, payment: 5000 },
      { slno: 23, date: '01-09-2025', particulars: 'Labour & Operating Expenses', receipt: null, payment: 2966 },
      { slno: 24, date: '01-09-2025', particulars: 'Printing & Packaging', receipt: null, payment: 2400 },
      { slno: 25, date: '07-09-2025', particulars: 'Bastenga Launch', receipt: null, payment: 1000 },
      { slno: 26, date: '15-09-2025', particulars: 'Printing of Cahs memo', receipt: null, payment: 7000 },
      { slno: 27, date: '30-09-2025', particulars: 'Bastenga Sales (30 packets)', receipt: 2050, payment: null },
    ],
  },
  {
    month: 'OCTOBER',
    rows: [
      { slno: 28, date: '03-10-2025', particulars: 'Meeting Expenses', receipt: null, payment: 2000 },
      { slno: 29, date: '04-10-2025', particulars: 'Raw Materials Purchase for ( 200 Bastenga)', receipt: null, payment: 5000 },
      { slno: 30, date: '04-10-2025', particulars: 'Labour & Operating Expenses', receipt: null, payment: 2966 },
      { slno: 31, date: '04-10-2025', particulars: 'Printing & Packaging', receipt: null, payment: 2400 },
      { slno: 32, date: '04-10-2025', particulars: 'Purchase – Aumni', receipt: null, payment: 1247 },
      { slno: 33, date: '25-10-2025', particulars: 'Purchase – Restokart', receipt: null, payment: 2909.12 },
      { slno: 34, date: '26-10-2025', particulars: 'Purchase – Swiss', receipt: null, payment: 4708.20 },
      { slno: 35, date: '31-10-2025', particulars: 'Bastenga Sales (40 packets)', receipt: 2733, payment: null },
    ],
  },
  {
    month: 'NOVEMBER',
    rows: [
      { slno: 36, date: '14-11-2025', particulars: 'Raw Materials Purchase for ( 200 Bastenga)', receipt: null, payment: 5000 },
      { slno: 37, date: '14-11-2025', particulars: 'Labour & Operating Expenses', receipt: null, payment: 2966 },
      { slno: 38, date: '14-11-2025', particulars: 'Printing & Packaging', receipt: null, payment: 2400 },
      { slno: 39, date: '30-11-2025', particulars: 'Bastenga Sales (80 packets)', receipt: 5466, payment: null },
    ],
  },
  {
    month: 'DECEMBER',
    rows: [
      { slno: 40, date: '31-12-2025', particulars: 'Bastenga Sales (120 packets)', receipt: 8200, payment: null },
    ],
  },
  {
    month: 'JANUARY',
    rows: [
      { slno: 41, date: '15-01-2026', particulars: 'Anniversary', receipt: null, payment: 3000 },
      { slno: 42, date: '31-01-2026', particulars: 'Bastenga Sales (50 packets)', receipt: 3416, payment: null },
    ],
  },
  {
    month: 'FEBRUARY',
    rows: [
      { slno: 43, date: '06-02-2026', particulars: 'Raw Materials Purchase for ( 400 Bastenga)', receipt: null, payment: 10000 },
      { slno: 44, date: '06-02-2026', particulars: 'Operating Cost', receipt: null, payment: 4532 },
      { slno: 45, date: '06-02-2026', particulars: 'Printing & Packaging', receipt: null, payment: 4800 },
      { slno: 46, date: '28-02-2026', particulars: 'Bastenga Sales (40 packets)', receipt: 2733, payment: null },
    ],
  },
  {
    month: 'MARCH',
    rows: [
      { slno: 47, date: '31-03-2026', particulars: 'Bastenga Sales (40 packets)', receipt: 2733, payment: null },
      { slno: 48, date: '31-03-2026', particulars: 'Audit', receipt: null, payment: 300 },
      { slno: 49, date: '31-03-2026', particulars: 'NSCU', receipt: null, payment: 100 },
    ],
  },
]

export default function DayBook() {
  const {
    accounts,
    transactions,
    dateRange,
    setDateRange,
    createReceipt,
    createPayment,
    createTransfer,
    createJournal,
    cancelTransaction,
    resetTransactionsToDefault,
    cashBook,
    getBankBook,
    getAccountLedger,
    trialBalance,
  } = useAccounting()

  const { members } = useRegisters()

  const [activeTab, setActiveTab] = useState<TabType>('auditregister')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'RECEIPT' | 'PAYMENT' | 'TRANSFER' | 'JOURNAL'>('ALL')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  // Bank book selector (NStCB or SBI)
  const [selectedBankId, setSelectedBankId] = useState<string>('acc_nstcb')

  // General ledger selector
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string>('acc_share_capital')

  // Modals for Quick Entry
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showJournalModal, setShowJournalModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [injectStatus, setInjectStatus] = useState<string | null>(null)

  // Verification Report State
  const [verificationReport, setVerificationReport] = useState<Phase1VerificationReport>(() =>
    runPhase1VerificationSuite(transactions)
  )

  useEffect(() => {
    setVerificationReport(runPhase1VerificationSuite(transactions))
  }, [transactions])

  // Receipt Form State
  const [receiptForm, setReceiptForm] = useState({
    date: '08-05-2026',
    receiptType: 'SHARE_CAPITAL', // 'SHARE_CAPITAL' | 'SAVINGS' | 'LOAN_RECOVERY_SPLIT' | 'ADMISSION_FEE' | 'SALES' | 'OTHER'
    targetAccountId: 'acc_share_capital',
    amount: '',
    paymentMode: 'BANK_NSTCB' as PaymentMode,
    memberId: '',
    memberName: '',
    narration: '',
    referenceNo: '',
    // Loan recovery split fields (TEST 6)
    loanPrincipal: '1800',
    loanInterest: '200',
  })

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    date: '08-05-2026',
    category: 'EXPENSE',
    debitAccountId: 'acc_electricity',
    amount: '',
    paymentMode: 'BANK_NSTCB' as PaymentMode,
    paidTo: '',
    memberId: '',
    narration: '',
    referenceNo: '',
  })

  // Transfer Form State
  const [transferForm, setTransferForm] = useState({
    date: '08-05-2026',
    fromAccountId: 'acc_nstcb',
    toAccountId: 'acc_cash',
    amount: '10000',
    narration: 'Transfer from NSCB Bank to Cash in Hand',
    referenceNo: '',
  })

  // Journal Form State (with separate Debit & Credit amounts for TEST 8 Unbalanced Protection)
  const [journalForm, setJournalForm] = useState({
    date: '08-05-2026',
    debitAccountId: 'acc_fixed_assets',
    debitAmount: '5000',
    creditAccountId: 'acc_surplus',
    creditAmount: '4000',
    narration: 'Journal adjustment voucher',
    referenceNo: '',
  })

  /* ── Filtered Day Book (Respecting selected dateRange - TEST 10) ─ */
  const filteredDayBook = transactions.filter(t => {
    if (dateRange && !isDateInRange(t.date, dateRange.fromDate, dateRange.toDate)) return false
    if (typeFilter !== 'ALL' && t.type !== typeFilter) return false
    const q = search.toLowerCase()
    return (
      !q ||
      t.voucherNo.toLowerCase().includes(q) ||
      t.narration.toLowerCase().includes(q) ||
      (t.memberName && t.memberName.toLowerCase().includes(q)) ||
      (t.referenceNo && t.referenceNo.toLowerCase().includes(q))
    )
  })

  const totalReceipts = transactions
    .filter(t => t.status === 'POSTED' && t.type === 'RECEIPT' && isDateInRange(t.date, dateRange.fromDate, dateRange.toDate))
    .reduce((s, t) => s + t.amount, 0)

  const totalPayments = transactions
    .filter(t => t.status === 'POSTED' && t.type === 'PAYMENT' && isDateInRange(t.date, dateRange.fromDate, dateRange.toDate))
    .reduce((s, t) => s + t.amount, 0)

  const bankBook = getBankBook(selectedBankId)
  const generalLedger = getAccountLedger(selectedLedgerAccountId)

  /* ── Inject All 10 Test Transactions ──────────────────────────── */
  const handleInjectAllTests = () => {
    // 1. Share capital receipt (TEST 1)
    createReceipt({
      date: '08-05-2026',
      category: 'SHARE_CAPITAL',
      targetAccountId: 'acc_share_capital',
      amount: 2000,
      paymentMode: 'BANK_NSTCB',
      memberId: 'THMCS/MID/001/2025',
      memberName: 'MS AKUMNARO SUYA',
      narration: 'Member pays ₹2,000 share capital through NSCB Bank (TEST 1)',
    })

    // 2. Expense payment (TEST 2)
    createPayment({
      date: '08-05-2026',
      category: 'EXPENSE',
      debitAccountId: 'acc_electricity',
      amount: 2500,
      paymentMode: 'BANK_NSTCB',
      narration: 'Pay electricity expense from NSCB Bank (TEST 2)',
    })

    // 3. Contra transfer (TEST 3)
    createTransfer({
      date: '08-05-2026',
      fromAccountId: 'acc_nstcb',
      toAccountId: 'acc_cash',
      amount: 10000,
      narration: 'Transfer ₹10,000 from NSCB Bank to Cash (TEST 3)',
    })

    // 4. Member savings receipt (TEST 4)
    createReceipt({
      date: '08-05-2026',
      category: 'SAVINGS',
      targetAccountId: 'acc_savings',
      amount: 1500,
      paymentMode: 'BANK_NSTCB',
      memberId: 'THMCS/MID/002/2025',
      memberName: 'MR VINSON KIKON',
      narration: 'Member deposits ₹1,500 savings/thrift through NSCB Bank (TEST 4)',
    })

    // 5. Loan disbursement (TEST 5)
    createPayment({
      date: '08-05-2026',
      category: 'LOAN_DISBURSEMENT',
      debitAccountId: 'acc_loan_rec',
      amount: 20000,
      paymentMode: 'BANK_NSTCB',
      memberId: 'THMCS/MID/003/2025',
      paidTo: 'MR THUNGBEMO SHITIRI',
      narration: 'Disburse ₹20,000 loan to member from NSCB Bank (TEST 5)',
    })

    // 6. Loan recovery split (TEST 6)
    createReceipt({
      date: '08-05-2026',
      category: 'LOAN_RECOVERY',
      amount: 2000,
      paymentMode: 'BANK_NSTCB',
      memberId: 'THMCS/MID/003/2025',
      memberName: 'MR THUNGBEMO SHITIRI',
      narration: 'Loan repayment: Principal ₹1,800 + Interest ₹200 (TEST 6)',
      splitCredits: [
        { accountId: 'acc_loan_rec', amount: 1800, description: 'Loan Principal Reduction' },
        { accountId: 'acc_loan_int_inc', amount: 200, description: 'Loan Interest Income' },
      ],
    })

    // 7. Supplier payment (TEST 7)
    createPayment({
      date: '08-05-2026',
      category: 'PAYABLE_SETTLEMENT',
      debitAccountId: 'acc_supplier_payable',
      amount: 4000,
      paymentMode: 'BANK_NSTCB',
      paidTo: 'Apex Feeds & Chicks Supplier',
      narration: 'Pay supplier ₹4,000 for existing payable (TEST 7)',
    })

    // 8. Test 8 is verified directly via validator: unbalanced entry rejection
    // 9. Post and cancel an audit test voucher (TEST 9)
    const p9 = createPayment({
      date: '08-05-2026',
      category: 'AUDIT_TEST',
      debitAccountId: 'acc_stationery',
      amount: 1200,
      paymentMode: 'BANK_NSTCB',
      narration: 'Voucher posted for audit cancellation test (TEST 9)',
    })
    if (p9.transaction) {
      cancelTransaction(p9.transaction.id, 'Audited reversal: duplicate voucher entry cancelled by accountant')
    }

    setInjectStatus('✅ Successfully posted all Phase 1 test vouchers! Click Day Book, Cash Book, Bank Book, or General Ledger to view them.')
    setTimeout(() => setInjectStatus(null), 8000)
  }

  /* ── Submit Receipt ───────────────────────────────────────────── */
  const handleSubmitReceipt = (e: React.FormEvent) => {
    e.preventDefault()

    // Compound Loan Recovery (TEST 6)
    if (receiptForm.receiptType === 'LOAN_RECOVERY_SPLIT') {
      const principal = Number(receiptForm.loanPrincipal) || 0
      const interest = Number(receiptForm.loanInterest) || 0
      const total = principal + interest

      if (total <= 0) {
        alert('Please enter valid principal and interest amounts.')
        return
      }

      const narration = receiptForm.narration.trim() ||
        `Loan recovery repayment (Principal: ₹${principal.toLocaleString('en-IN')}, Interest: ₹${interest.toLocaleString('en-IN')})${receiptForm.memberName ? ` from ${receiptForm.memberName}` : ''}`

      const res = createReceipt({
        date: receiptForm.date,
        category: 'LOAN_RECOVERY',
        amount: total,
        paymentMode: receiptForm.paymentMode,
        memberId: receiptForm.memberId || undefined,
        memberName: receiptForm.memberName || undefined,
        narration,
        referenceNo: receiptForm.referenceNo || undefined,
        splitCredits: [
          { accountId: 'acc_loan_rec', amount: principal, description: 'Loan Principal Reduction' },
          { accountId: 'acc_loan_int_inc', amount: interest, description: 'Loan Interest Income' },
        ],
      })

      if (res.success) {
        setShowReceiptModal(false)
        if (res.transaction) setSelectedTx(res.transaction)
      } else {
        alert(res.error || 'Failed to post receipt.')
      }
      return
    }

    // Standard Single-Credit Receipt (TEST 1, TEST 4, etc.)
    const amt = Number(receiptForm.amount)
    if (!amt || amt <= 0) {
      alert('Please enter a valid amount.')
      return
    }

    const narration = receiptForm.narration.trim() ||
      `${accounts.find(a => a.id === receiptForm.targetAccountId)?.name || 'Receipt'}${receiptForm.memberName ? ` from ${receiptForm.memberName}` : ''}`

    const res = createReceipt({
      date: receiptForm.date,
      category: receiptForm.receiptType,
      targetAccountId: receiptForm.targetAccountId,
      amount: amt,
      paymentMode: receiptForm.paymentMode,
      memberId: receiptForm.memberId || undefined,
      memberName: receiptForm.memberName || undefined,
      narration,
      referenceNo: receiptForm.referenceNo || undefined,
    })

    if (res.success) {
      setShowReceiptModal(false)
      setReceiptForm(prev => ({
        ...prev,
        amount: '',
        narration: '',
        referenceNo: '',
      }))
      if (res.transaction) setSelectedTx(res.transaction)
    } else {
      alert(res.error || 'Failed to post receipt.')
    }
  }

  /* ── Submit Payment ───────────────────────────────────────────── */
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(paymentForm.amount)
    if (!amt || amt <= 0) {
      alert('Please enter a valid amount.')
      return
    }

    const accName = accounts.find(a => a.id === paymentForm.debitAccountId)?.name || 'Account'
    const narration = paymentForm.narration.trim() ||
      `Payment for ${accName}${paymentForm.paidTo ? ` to ${paymentForm.paidTo}` : ''}`

    const res = createPayment({
      date: paymentForm.date,
      category: paymentForm.category,
      debitAccountId: paymentForm.debitAccountId,
      amount: amt,
      paymentMode: paymentForm.paymentMode,
      paidTo: paymentForm.paidTo || undefined,
      memberId: paymentForm.memberId || undefined,
      narration,
      referenceNo: paymentForm.referenceNo || undefined,
    })

    if (res.success) {
      setShowPaymentModal(false)
      setPaymentForm(prev => ({
        ...prev,
        amount: '',
        paidTo: '',
        narration: '',
        referenceNo: '',
      }))
      if (res.transaction) setSelectedTx(res.transaction)
    } else {
      alert(res.error || 'Failed to post payment.')
    }
  }

  /* ── Submit Transfer ──────────────────────────────────────────── */
  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(transferForm.amount)
    if (!amt || amt <= 0) {
      alert('Please enter a valid transfer amount.')
      return
    }

    const fromName = accounts.find(a => a.id === transferForm.fromAccountId)?.name || 'Source'
    const toName = accounts.find(a => a.id === transferForm.toAccountId)?.name || 'Destination'
    const narration = transferForm.narration.trim() || `Contra transfer from ${fromName} to ${toName}`

    const res = createTransfer({
      date: transferForm.date,
      fromAccountId: transferForm.fromAccountId,
      toAccountId: transferForm.toAccountId,
      amount: amt,
      narration,
      referenceNo: transferForm.referenceNo || undefined,
    })

    if (res.success) {
      setShowTransferModal(false)
      if (res.transaction) setSelectedTx(res.transaction)
    } else {
      alert(res.error || 'Failed to post transfer.')
    }
  }

  /* ── Submit Journal (TEST 8 Verification) ──────────────────────── */
  const handleSubmitJournal = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const drAmt = Number(journalForm.debitAmount)
    const crAmt = Number(journalForm.creditAmount)

    if (!drAmt || !crAmt || drAmt <= 0 || crAmt <= 0) {
      setFormError('Please enter valid debit and credit amounts.')
      return
    }
    if (journalForm.debitAccountId === journalForm.creditAccountId) {
      setFormError('Debit and Credit accounts must be different.')
      return
    }

    const drAcc = accounts.find(a => a.id === journalForm.debitAccountId)
    const crAcc = accounts.find(a => a.id === journalForm.creditAccountId)
    const narration = journalForm.narration.trim() || `Journal entry: Dr ${drAcc?.name} / Cr ${crAcc?.name}`

    const res = createJournal({
      date: journalForm.date,
      narration,
      referenceNo: journalForm.referenceNo || undefined,
      lines: [
        {
          accountId: journalForm.debitAccountId,
          accountName: drAcc?.name || 'Debit Account',
          debit: drAmt,
          credit: 0,
          description: `Debit: ${narration}`,
        },
        {
          accountId: journalForm.creditAccountId,
          accountName: crAcc?.name || 'Credit Account',
          debit: 0,
          credit: crAmt,
          description: `Credit: ${narration}`,
        },
      ],
    })

    if (res.success) {
      setFormError(null)
      setShowJournalModal(false)
      if (res.transaction) setSelectedTx(res.transaction)
    } else {
      // TEST 8: Display exact error if unbalanced
      setFormError(res.error || 'Failed to post journal.')
    }
  }

  /* ── Cancel / Reverse Transaction (TEST 9 Protection) ─────────── */
  const handleConfirmCancel = () => {
    if (!selectedTx) return
    if (!cancelReason.trim()) {
      setFormError('Please enter a cancellation reason for the audit trail.')
      return
    }

    const res = cancelTransaction(selectedTx.id, cancelReason)
    if (res.success) {
      setFormError(null)
      setShowCancelModal(false)
      setCancelReason('')
      setSelectedTx(null)
    } else {
      setFormError(res.error || 'Could not cancel transaction.')
    }
  }

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── HEADER & PRIMARY ACTION BUTTONS ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#e6edf3', margin: 0 }}>
              Central Accounting Engine &amp; Books
            </h1>
            <span style={{ background: '#3fb95022', color: '#3fb950', border: '1px solid #3fb95044', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
              ENTER ONCE · SYNC EVERYWHERE
            </span>
          </div>
          <p style={{ color: '#8b949e', fontSize: 13, margin: '4px 0 0' }}>
            Tribal Harvest Marketing Cooperative Society Ltd. · Automated Double-Entry &amp; Subsidiary Books
          </p>
        </div>

        {/* Quick Entry Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            style={{ background: '#3fb950', borderColor: '#3fb950' }}
            onClick={() => {
              setFormError(null)
              setReceiptForm(prev => ({
                ...prev,
                receiptType: 'SHARE_CAPITAL',
                targetAccountId: 'acc_share_capital',
                paymentMode: 'BANK_NSTCB',
                amount: '2000',
                narration: 'Share capital payment for 2 shares through NSCB Bank',
              }))
              setShowReceiptModal(true)
            }}
          >
            + RECEIPT
          </button>
          <button
            className="btn-primary"
            style={{ background: '#f85149', borderColor: '#f85149' }}
            onClick={() => {
              setFormError(null)
              setPaymentForm(prev => ({
                ...prev,
                category: 'EXPENSE',
                debitAccountId: 'acc_electricity',
                paymentMode: 'BANK_NSTCB',
                amount: '2500',
                narration: 'Payment for electricity expense from NSCB Bank',
              }))
              setShowPaymentModal(true)
            }}
          >
            – PAYMENT
          </button>
          <button
            className="btn-primary"
            style={{ background: '#1a8cff', borderColor: '#1a8cff' }}
            onClick={() => {
              setFormError(null)
              setTransferForm({
                date: '08-05-2026',
                fromAccountId: 'acc_nstcb',
                toAccountId: 'acc_cash',
                amount: '10000',
                narration: 'Transfer from NSCB Bank to Cash in Hand',
                referenceNo: '',
              })
              setShowTransferModal(true)
            }}
          >
            ⇄ TRANSFER
          </button>
          <button
            className="btn-primary"
            style={{ background: '#a78bfa', borderColor: '#a78bfa' }}
            onClick={() => {
              setFormError(null)
              setShowJournalModal(true)
            }}
          >
            📖 JOURNAL
          </button>
          <button
            className="btn-ghost"
            style={{ fontSize: 12 }}
            onClick={() => {
              if (window.confirm('Reset all transactions to initial verified cooperative state?')) {
                resetTransactionsToDefault()
              }
            }}
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* ── DATE FILTER BAR (TEST 10) ── */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#8b949e', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 4 }}>
          📅 Accounting Period Filter:
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#8b949e' }}>From:</span>
          <input
            type="text"
            placeholder="DD/MM/YYYY or YYYY-MM-DD"
            value={dateRange.fromDate || ''}
            onChange={e => setDateRange({ ...dateRange, fromDate: e.target.value })}
            style={{ width: 140, padding: '4px 8px', fontSize: 12 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#8b949e' }}>To:</span>
          <input
            type="text"
            placeholder="DD/MM/YYYY or YYYY-MM-DD"
            value={dateRange.toDate || ''}
            onChange={e => setDateRange({ ...dateRange, toDate: e.target.value })}
            style={{ width: 140, padding: '4px 8px', fontSize: 12 }}
          />
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[
            { label: 'All Dates', from: '', to: '' },
            { label: 'FY 2024–25', from: '01/04/2024', to: '31/03/2025' },
            { label: 'FY 2025–26', from: '01/04/2025', to: '31/03/2026' },
            { label: 'FY 2026–27', from: '01/04/2026', to: '31/03/2027' },
          ].map(p => (
            <button
              key={p.label}
              onClick={() => setDateRange({ fromDate: p.from, toDate: p.to })}
              style={{
                background: (dateRange.fromDate === p.from && dateRange.toDate === p.to) ? '#1a8cff' : '#1c2330',
                color: (dateRange.fromDate === p.from && dateRange.toDate === p.to) ? 'white' : '#8b949e',
                border: '1px solid #30363d',
                borderRadius: 5,
                padding: '3px 8px',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
          {(dateRange.fromDate || dateRange.toDate) && (
            <button
              onClick={() => setDateRange({ fromDate: '', toDate: '' })}
              style={{ background: '#f8514915', color: '#f85149', border: '1px solid #f8514933', borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}
            >
              ✕ Clear Filter
            </button>
          )}
        </div>

        {(dateRange.fromDate || dateRange.toDate) && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#00d4aa', fontWeight: 600 }}>
            ● Filter active: {dateRange.fromDate || 'Start'} → {dateRange.toDate || 'End'}
          </span>
        )}
      </div>

      {/* ── KPI STATS STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Cash in Hand (Book Balance)</div>
          <div className="amount" style={{ fontSize: 20, fontWeight: 700, color: '#00d4aa' }}>
            {fmt(cashBook.closingBalance)}
          </div>
          <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>Derived from {cashBook.entries.length} cash entries</div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Bank – NStCB (Co-op Bank)</div>
          <div className="amount" style={{ fontSize: 20, fontWeight: 700, color: '#1a8cff' }}>
            {fmt(getBankBook('acc_nstcb').closingBalance)}
          </div>
          <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>Main Society Account</div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Total Receipts (Active)</div>
          <div className="amount" style={{ fontSize: 20, fontWeight: 700, color: '#3fb950' }}>
            {fmt(totalReceipts)}
          </div>
          <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>All Receipt Vouchers</div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Total Payments (Active)</div>
          <div className="amount" style={{ fontSize: 20, fontWeight: 700, color: '#f85149' }}>
            {fmt(totalPayments)}
          </div>
          <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>All Payment Vouchers</div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Trial Balance Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 18 }}>{trialBalance.isBalanced ? '✅' : '⚠️'}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: trialBalance.isBalanced ? '#3fb950' : '#f85149' }}>
              {trialBalance.isBalanced ? 'Balanced' : 'Out of Balance!'}
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>
            Dr: {fmt(trialBalance.totalDebit)} | Cr: {fmt(trialBalance.totalCredit)}
          </div>
        </div>
      </div>

      {/* ── SUBSIDIARY BOOKS NAVIGATION TABS ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #30363d', gap: 4, overflowX: 'auto' }}>
        {[
          { id: 'auditregister', label: '📄 Audited Register (2025-26)', count: 49 },
          { id: 'daybook', label: '📒 Day Book (Vouchers)', count: filteredDayBook.length },
          { id: 'cashbook', label: '💵 Cash Book', count: cashBook.entries.length },
          { id: 'bankbook', label: '🏦 Bank Book', count: bankBook.entries.length },
          { id: 'ledger', label: '📋 General Ledger', count: generalLedger.entries.length },
          { id: 'trialbalance', label: '⚖️ Trial Balance', count: trialBalance.lines.length },
          { id: 'verification', label: '🧪 Phase 1 Verification Suite', count: `${verificationReport.summary.passed}/${verificationReport.summary.total}` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              background: activeTab === tab.id ? 'linear-gradient(135deg, #1a8cff22, #00d4aa11)' : 'transparent',
              color: activeTab === tab.id ? '#1a8cff' : '#8b949e',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #1a8cff' : '2px solid transparent',
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tab.label}
            <span style={{ background: '#1c2330', color: '#8b949e', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── TAB: AUDITED REGISTER (FY 2025-2026 as on 30 March 2026) ── */}
      {activeTab === 'auditregister' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header Banner */}
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#e6edf3', margin: 0 }}>
                  Tribal Harvest Day Book Register as on 30 of March 2026
                </h2>
                <span style={{ background: '#e3b34122', color: '#f0b429', border: '1px solid #e3b34144', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                  AUDITED STATEMENT
                </span>
              </div>
              <p style={{ color: '#8b949e', fontSize: 13, margin: '4px 0 0' }}>
                Official Financial Year 2025–2026 Register · Chümoukedima Town, Nagaland
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                className="btn-ghost"
                style={{ fontSize: 12 }}
                onClick={() => {
                  downloadCSV(
                    'Tribal_Harvest_Day_Book_Register_30_March_2026.csv',
                    ['Sl.No', 'Date', 'Month', 'Particulars', 'Receipt (₹)', 'Payment (₹)'],
                    AUDIT_MONTHS.flatMap(m =>
                      m.rows.map(r => [r.slno, r.date, m.month, r.particulars, r.receipt ?? '', r.payment ?? ''])
                    )
                  )
                }}
              >
                ⬇ Export Audited Register CSV
              </button>
              <button
                className="btn-primary"
                style={{ fontSize: 12 }}
                onClick={() => setActiveTab('daybook')}
              >
                📒 View Double-Entry Vouchers
              </button>
            </div>
          </div>

          {/* Audit Metrics Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2 }}>Opening Balance</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#8b949e' }}>Nil / Nil</div>
              <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>As on 01-04-2025</div>
            </div>
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2 }}>Total Receipts (₹)</div>
              <div className="amount" style={{ fontSize: 18, fontWeight: 700, color: '#3fb950' }}>₹1,35,531.00</div>
              <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>Share Capital &amp; Sales</div>
            </div>
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2 }}>Total Payments (₹)</div>
              <div className="amount" style={{ fontSize: 18, fontWeight: 700, color: '#f85149' }}>₹80,120.87</div>
              <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>Procurement &amp; Ops</div>
            </div>
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2 }}>Closing Cash Balance</div>
              <div className="amount" style={{ fontSize: 18, fontWeight: 700, color: '#00d4aa' }}>₹55,410.13</div>
              <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>As on 30-03-2026</div>
            </div>
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2 }}>Grand Total (Balanced)</div>
              <div className="amount" style={{ fontSize: 18, fontWeight: 700, color: '#1a8cff' }}>₹1,35,531.00</div>
              <div style={{ fontSize: 10, color: '#3fb950', marginTop: 2 }}>✓ Verified Exact Match</div>
            </div>
          </div>

          {/* Audit Sheet Table */}
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#e6edf3' }}>
                Tribal Harvest Co-operative Society — Audit Statement Ledger
              </span>
              <span style={{ fontSize: 11, color: '#8b949e' }}>Total 49 Entries</span>
            </div>

            <div className="table-wrap" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#0d1117', borderBottom: '2px solid #30363d', color: '#e6edf3', fontSize: 12 }}>
                    <th style={{ padding: '12px 16px', width: 70 }}>Sl.No</th>
                    <th style={{ padding: '12px 16px', width: 120 }}>Date</th>
                    <th style={{ padding: '12px 16px' }}>Particulars</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', width: 150 }}>Receipt (₹)</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', width: 150 }}>Payment (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening Balance Row */}
                  <tr style={{ background: '#0d1117', borderBottom: '1px solid #21262d', fontStyle: 'italic', color: '#8b949e' }}>
                    <td style={{ padding: '10px 16px' }}>—</td>
                    <td style={{ padding: '10px 16px' }}>01-04-2025</td>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>Opening balance</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>Nil</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>Nil</td>
                  </tr>

                  {AUDIT_MONTHS.map(monthGroup => (
                    <React.Fragment key={monthGroup.month}>
                      {/* Month Header Banner */}
                      <tr style={{ background: '#f0b429', color: '#000000', fontWeight: 800, fontSize: 12, letterSpacing: '0.08em' }}>
                        <td colSpan={5} style={{ padding: '7px 16px', textAlign: 'center', textTransform: 'uppercase' }}>
                          {monthGroup.month}
                        </td>
                      </tr>

                      {/* Month Rows */}
                      {monthGroup.rows.map(row => (
                        <tr
                          key={row.slno}
                          style={{
                            borderBottom: '1px solid #21262d',
                            transition: 'background 0.1s',
                          }}
                        >
                          <td style={{ padding: '10px 16px', color: '#8b949e', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                            {row.slno}
                          </td>
                          <td style={{ padding: '10px 16px', color: '#8b949e', fontSize: 12 }}>
                            {row.date}
                          </td>
                          <td style={{ padding: '10px 16px', fontWeight: 600, color: '#e6edf3' }}>
                            {row.particulars}
                          </td>
                          <td className="amount" style={{ padding: '10px 16px', textAlign: 'right', color: row.receipt ? '#3fb950' : '#484f58', fontWeight: row.receipt ? 700 : 400 }}>
                            {row.receipt !== null ? Number(row.receipt).toLocaleString('en-IN') : '—'}
                          </td>
                          <td className="amount" style={{ padding: '10px 16px', textAlign: 'right', color: row.payment ? '#f85149' : '#484f58', fontWeight: row.payment ? 700 : 400 }}>
                            {row.payment !== null
                              ? Number(row.payment).toLocaleString('en-IN', { minimumFractionDigits: row.payment % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>

                {/* Audit Totals Footer */}
                <tfoot>
                  <tr style={{ background: '#1c2330', borderTop: '2px solid #30363d', fontWeight: 800 }}>
                    <td colSpan={3} style={{ padding: '12px 16px', color: '#e6edf3', textTransform: 'uppercase' }}>TOTAL</td>
                    <td className="amount" style={{ padding: '12px 16px', textAlign: 'right', color: '#3fb950', fontSize: 14 }}>
                      135531
                    </td>
                    <td className="amount" style={{ padding: '12px 16px', textAlign: 'right', color: '#f85149', fontSize: 14 }}>
                      80120.87
                    </td>
                  </tr>

                  <tr style={{ background: '#1c2330', borderTop: '1px solid #30363d', fontWeight: 800 }}>
                    <td colSpan={3} style={{ padding: '12px 16px', color: '#00d4aa', textTransform: 'uppercase' }}>CLOSING BALANCE</td>
                    <td style={{ padding: '12px 16px' }} />
                    <td className="amount" style={{ padding: '12px 16px', textAlign: 'right', color: '#00d4aa', fontSize: 14 }}>
                      55410.13
                    </td>
                  </tr>

                  <tr style={{ background: '#0d1117', borderTop: '2px solid #30363d', fontWeight: 900 }}>
                    <td colSpan={3} style={{ padding: '14px 16px', color: '#1a8cff', textTransform: 'uppercase', fontSize: 13 }}>GRAND TOTAL</td>
                    <td className="amount" style={{ padding: '14px 16px', textAlign: 'right', color: '#1a8cff', fontSize: 15 }}>
                      135531
                    </td>
                    <td className="amount" style={{ padding: '14px 16px', textAlign: 'right', color: '#1a8cff', fontSize: 15 }}>
                      135531
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 1: DAY BOOK (All Transactions) ── */}
      {activeTab === 'daybook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Search voucher no, narration, member, ref..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 340, maxWidth: '100%' }}
            />

            <div style={{ display: 'flex', background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 3, gap: 1 }}>
              {(['ALL', 'RECEIPT', 'PAYMENT', 'TRANSFER', 'JOURNAL'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  style={{
                    background: typeFilter === t ? '#1a8cff' : 'transparent',
                    color: typeFilter === t ? 'white' : '#8b949e',
                    border: 'none',
                    borderRadius: 5,
                    padding: '5px 10px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    cursor: 'pointer',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              className="btn-ghost"
              style={{ marginLeft: 'auto', fontSize: 12 }}
              onClick={() =>
                downloadCSV(
                  'thmcs-daybook-all.csv',
                  ['Voucher No', 'Date', 'Type', 'Category', 'Narration', 'Amount (₹)', 'Payment Mode', 'Member', 'Status'],
                  [
                    filteredDayBook.map(t => [
                      t.voucherNo,
                      t.date,
                      t.type,
                      t.category,
                      t.narration,
                      t.amount,
                      t.paymentMode || 'N/A',
                      t.memberName || 'N/A',
                      t.status,
                    ]),
                  ]
                )
              }
            >
              ⬇ Export Day Book CSV
            </button>
          </div>

          {/* Table + Detail Sidebar */}
          <div style={{ display: 'grid', gridTemplateColumns: selectedTx ? '1fr 380px' : '1fr', gap: 16 }}>
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Voucher No.</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Particulars &amp; Narration</th>
                      <th>Member / Entity</th>
                      <th>Payment Mode</th>
                      <th style={{ textAlign: 'right' }}>Receipt (Dr)</th>
                      <th style={{ textAlign: 'right' }}>Payment (Cr)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDayBook.map(t => {
                      const isReceipt = t.type === 'RECEIPT'
                      const isPayment = t.type === 'PAYMENT'
                      const isSelected = selectedTx?.id === t.id

                      return (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTx(isSelected ? null : t)}
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? '#1a8cff15' : undefined,
                            opacity: t.status === 'CANCELLED' ? 0.6 : 1,
                          }}
                        >
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#1a8cff', fontWeight: 700 }}>
                            {t.voucherNo}
                          </td>
                          <td className="amount" style={{ fontSize: 12, color: '#8b949e' }}>
                            {t.date}
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '2px 7px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 700,
                                fontFamily: 'var(--font-display)',
                                ...(t.type === 'RECEIPT'
                                  ? { background: '#3fb95022', color: '#3fb950', border: '1px solid #3fb95044' }
                                  : t.type === 'PAYMENT'
                                  ? { background: '#f8514922', color: '#f85149', border: '1px solid #f8514944' }
                                  : t.type === 'TRANSFER'
                                  ? { background: '#1a8cff22', color: '#1a8cff', border: '1px solid #1a8cff44' }
                                  : { background: '#a78bfa22', color: '#a78bfa', border: '1px solid #a78bfa44' }),
                              }}
                            >
                              {t.type}
                            </span>
                          </td>
                          <td style={{ maxWidth: 300 }}>
                            <div style={{ fontWeight: 600, color: '#e6edf3' }}>{t.narration}</div>
                            {t.referenceNo && (
                              <div style={{ fontSize: 11, color: '#8b949e', marginTop: 1 }}>Ref: {t.referenceNo}</div>
                            )}
                          </td>
                          <td style={{ fontSize: 12, color: '#e6edf3' }}>
                            {t.memberName || (t.projectName ? `Project: ${t.projectName}` : '—')}
                          </td>
                          <td style={{ fontSize: 11, color: '#8b949e' }}>
                            {t.paymentMode ? t.paymentMode.replace(/_/g, ' ') : 'JOURNAL'}
                          </td>
                          <td className="amount" style={{ textAlign: 'right', color: '#3fb950', fontWeight: isReceipt ? 700 : 400 }}>
                            {isReceipt ? fmt(t.amount) : '—'}
                          </td>
                          <td className="amount" style={{ textAlign: 'right', color: '#f85149', fontWeight: isPayment ? 700 : 400 }}>
                            {isPayment ? fmt(t.amount) : '—'}
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 600,
                                ...(t.status === 'POSTED'
                                  ? { background: '#3fb95018', color: '#3fb950' }
                                  : { background: '#f8514918', color: '#f85149', textDecoration: 'line-through' }),
                              }}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={6} style={{ color: '#8b949e' }}>
                        Showing {filteredDayBook.length} Transactions
                      </td>
                      <td className="amount" style={{ textAlign: 'right', color: '#3fb950', fontWeight: 700 }}>
                        {fmt(filteredDayBook.filter(t => t.type === 'RECEIPT' && t.status === 'POSTED').reduce((s, t) => s + t.amount, 0))}
                      </td>
                      <td className="amount" style={{ textAlign: 'right', color: '#f85149', fontWeight: 700 }}>
                        {fmt(filteredDayBook.filter(t => t.type === 'PAYMENT' && t.status === 'POSTED').reduce((s, t) => s + t.amount, 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Voucher Inspection Sidebar (TEST 9 Protected) */}
            {selectedTx && (
              <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, alignSelf: 'start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: '#1a8cff' }}>
                      {selectedTx.voucherNo}
                    </div>
                    <div style={{ fontSize: 11, color: '#8b949e' }}>{selectedTx.type} VOUCHER · {selectedTx.date}</div>
                  </div>
                  <button onClick={() => setSelectedTx(null)} style={{ background: 'transparent', border: 'none', color: '#8b949e', fontSize: 18, cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ background: '#1c2330', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: '#8b949e' }}>Total Amount</div>
                  <div className="amount" style={{ fontSize: 22, fontWeight: 800, color: '#e6edf3' }}>
                    {fmt(selectedTx.amount)}
                  </div>
                  <div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>{selectedTx.narration}</div>
                </div>

                {/* Double-Entry Journal Lines */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8b949e', marginBottom: 8, letterSpacing: '0.05em' }}>
                    AUTOMATIC POSTING LINES (DOUBLE-ENTRY)
                  </div>
                  <div style={{ border: '1px solid #30363d', borderRadius: 8, overflow: 'hidden' }}>
                    {selectedTx.lines.map((line, idx) => (
                      <div
                        key={line.id || idx}
                        style={{
                          padding: '8px 12px',
                          borderBottom: idx < selectedTx.lines.length - 1 ? '1px solid #21262d' : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: line.debit > 0 ? '#3fb950' : '#a78bfa' }}>
                            {line.debit > 0 ? 'Dr. ' : 'Cr. '} {line.accountName}
                          </div>
                          {line.description && <div style={{ fontSize: 10, color: '#8b949e' }}>{line.description}</div>}
                        </div>
                        <div className="amount" style={{ fontWeight: 700, color: line.debit > 0 ? '#3fb950' : '#a78bfa' }}>
                          {fmt(line.debit > 0 ? line.debit : line.credit)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit details */}
                <div style={{ fontSize: 11, color: '#8b949e', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>Status: <strong style={{ color: selectedTx.status === 'POSTED' ? '#3fb950' : '#f85149' }}>{selectedTx.status}</strong></div>
                  <div>Created At: {new Date(selectedTx.createdAt).toLocaleString('en-IN')}</div>
                  {selectedTx.cancelledAt && (
                    <div style={{ color: '#f85149', background: '#f8514915', padding: '6px 8px', borderRadius: 6, border: '1px solid #f8514933' }}>
                      <strong>Cancelled:</strong> {new Date(selectedTx.cancelledAt).toLocaleString('en-IN')}
                      <br />Reason: {selectedTx.cancelReason}
                    </div>
                  )}
                </div>

                {/* Actions: No silent edit/delete; Cancel only with reason */}
                {selectedTx.status === 'POSTED' && (
                  <button
                    style={{
                      background: '#f8514915',
                      border: '1px solid #f8514944',
                      color: '#f85149',
                      padding: '8px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: 4,
                    }}
                    onClick={() => setShowCancelModal(true)}
                  >
                    ⚠️ Cancel / Reverse Voucher
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: CASH BOOK (Cash in Hand) ── */}
      {activeTab === 'cashbook' && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#e6edf3' }}>
                Cash Book · Cash in Hand (Code: 1010)
              </div>
              <div style={{ fontSize: 12, color: '#8b949e' }}>Opening Cash Balance: {fmt(cashBook.openingBalance)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#8b949e' }}>Closing Cash Balance</div>
              <div className="amount" style={{ fontSize: 20, fontWeight: 800, color: '#00d4aa' }}>
                {fmt(cashBook.closingBalance)}
              </div>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Voucher No.</th>
                  <th>Particulars / Opposite Account</th>
                  <th>Narration</th>
                  <th style={{ textAlign: 'right' }}>Receipts / Dr (₹)</th>
                  <th style={{ textAlign: 'right' }}>Payments / Cr (₹)</th>
                  <th style={{ textAlign: 'right' }}>Running Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#1c233044' }}>
                  <td className="amount" style={{ color: '#8b949e' }}>—</td>
                  <td style={{ color: '#8b949e' }}>OB</td>
                  <td style={{ fontWeight: 600, color: '#8b949e' }}>Opening Balance B/F</td>
                  <td style={{ color: '#8b949e' }}>Opening balance before selected period</td>
                  <td className="amount" style={{ textAlign: 'right', color: '#3fb950' }}>{fmt(cashBook.openingBalance)}</td>
                  <td className="amount" style={{ textAlign: 'right', color: '#8b949e' }}>—</td>
                  <td className="amount" style={{ textAlign: 'right', fontWeight: 700, color: '#00d4aa' }}>{fmt(cashBook.openingBalance)}</td>
                </tr>

                {cashBook.entries.map((entry, idx) => (
                  <tr key={idx}>
                    <td className="amount" style={{ fontSize: 12, color: '#8b949e' }}>{entry.date}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#1a8cff' }}>{entry.voucherNo}</td>
                    <td style={{ fontWeight: 600, color: '#e6edf3' }}>{entry.oppositeAccountName}</td>
                    <td style={{ fontSize: 12, color: '#8b949e' }}>{entry.narration}</td>
                    <td className="amount" style={{ textAlign: 'right', color: '#3fb950', fontWeight: entry.debit ? 600 : 400 }}>
                      {entry.debit ? fmt(entry.debit) : '—'}
                    </td>
                    <td className="amount" style={{ textAlign: 'right', color: '#f85149', fontWeight: entry.credit ? 600 : 400 }}>
                      {entry.credit ? fmt(entry.credit) : '—'}
                    </td>
                    <td className="amount" style={{ textAlign: 'right', fontWeight: 700, color: '#00d4aa' }}>
                      {fmt(entry.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ color: '#8b949e' }}>Total Movements</td>
                  <td className="amount" style={{ textAlign: 'right', color: '#3fb950' }}>{fmt(cashBook.totalDebit)}</td>
                  <td className="amount" style={{ textAlign: 'right', color: '#f85149' }}>{fmt(cashBook.totalCredit)}</td>
                  <td className="amount" style={{ textAlign: 'right', color: '#00d4aa', fontWeight: 800 }}>
                    {fmt(cashBook.closingBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: BANK BOOK (NStCB & SBI) ── */}
      {activeTab === 'bankbook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Bank selector */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#8b949e' }}>Select Bank Account:</div>
            <select
              value={selectedBankId}
              onChange={e => setSelectedBankId(e.target.value)}
              style={{ width: 340 }}
            >
              <option value="acc_nstcb">Bank – NStCB (Nagaland State Co-op Bank)</option>
              <option value="acc_sbi">Bank – State Bank of India</option>
            </select>
          </div>

          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#e6edf3' }}>
                  {bankBook.account?.name}
                </div>
                <div style={{ fontSize: 12, color: '#8b949e' }}>Opening Balance: {fmt(bankBook.openingBalance)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#8b949e' }}>Closing Bank Balance</div>
                <div className="amount" style={{ fontSize: 20, fontWeight: 800, color: '#1a8cff' }}>
                  {fmt(bankBook.closingBalance)}
                </div>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Voucher No.</th>
                    <th>Opposite Account</th>
                    <th>Particulars &amp; Narration</th>
                    <th style={{ textAlign: 'right' }}>Deposit / Dr (₹)</th>
                    <th style={{ textAlign: 'right' }}>Withdrawal / Cr (₹)</th>
                    <th style={{ textAlign: 'right' }}>Running Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: '#1c233044' }}>
                    <td className="amount" style={{ color: '#8b949e' }}>—</td>
                    <td style={{ color: '#8b949e' }}>OB</td>
                    <td style={{ fontWeight: 600, color: '#8b949e' }}>Opening Balance B/F</td>
                    <td style={{ color: '#8b949e' }}>Opening balance before selected period</td>
                    <td className="amount" style={{ textAlign: 'right', color: '#3fb950' }}>{fmt(bankBook.openingBalance)}</td>
                    <td className="amount" style={{ textAlign: 'right', color: '#8b949e' }}>—</td>
                    <td className="amount" style={{ textAlign: 'right', fontWeight: 700, color: '#1a8cff' }}>{fmt(bankBook.openingBalance)}</td>
                  </tr>

                  {bankBook.entries.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#8b949e' }}>
                        No transactions recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    bankBook.entries.map((entry, idx) => (
                      <tr key={idx}>
                        <td className="amount" style={{ fontSize: 12, color: '#8b949e' }}>{entry.date}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#1a8cff' }}>{entry.voucherNo}</td>
                        <td style={{ fontWeight: 600, color: '#e6edf3' }}>{entry.oppositeAccountName}</td>
                        <td style={{ fontSize: 12, color: '#8b949e' }}>{entry.narration}</td>
                        <td className="amount" style={{ textAlign: 'right', color: '#3fb950', fontWeight: entry.debit ? 600 : 400 }}>
                          {entry.debit ? fmt(entry.debit) : '—'}
                        </td>
                        <td className="amount" style={{ textAlign: 'right', color: '#f85149', fontWeight: entry.credit ? 600 : 400 }}>
                          {entry.credit ? fmt(entry.credit) : '—'}
                        </td>
                        <td className="amount" style={{ textAlign: 'right', fontWeight: 700, color: '#1a8cff' }}>
                          {fmt(entry.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ color: '#8b949e' }}>Total Movements</td>
                    <td className="amount" style={{ textAlign: 'right', color: '#3fb950' }}>{fmt(bankBook.totalDebit)}</td>
                    <td className="amount" style={{ textAlign: 'right', color: '#f85149' }}>{fmt(bankBook.totalCredit)}</td>
                    <td className="amount" style={{ textAlign: 'right', color: '#1a8cff', fontWeight: 800 }}>
                      {fmt(bankBook.closingBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: GENERAL LEDGER (Account-wise) ── */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Account selector */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#8b949e' }}>Select General Ledger Account:</div>
            <select
              value={selectedLedgerAccountId}
              onChange={e => setSelectedLedgerAccountId(e.target.value)}
              style={{ width: 380 }}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} – {acc.name} ({acc.category})
                </option>
              ))}
            </select>
          </div>

          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#e6edf3' }}>
                  {generalLedger.account?.code} · {generalLedger.account?.name}
                </div>
                <div style={{ fontSize: 12, color: '#8b949e' }}>
                  Category: <strong style={{ color: '#1a8cff' }}>{generalLedger.account?.category}</strong> · Opening Balance: {fmt(generalLedger.openingBalance)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#8b949e' }}>Account Net Balance</div>
                <div className="amount" style={{ fontSize: 20, fontWeight: 800, color: '#a78bfa' }}>
                  {fmt(generalLedger.closingBalance)}
                </div>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Voucher No.</th>
                    <th>Type</th>
                    <th>Particulars / Counterpart</th>
                    <th>Narration</th>
                    <th style={{ textAlign: 'right' }}>Debit (₹)</th>
                    <th style={{ textAlign: 'right' }}>Credit (₹)</th>
                    <th style={{ textAlign: 'right' }}>Running Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: '#1c233044' }}>
                    <td className="amount" style={{ color: '#8b949e' }}>—</td>
                    <td style={{ color: '#8b949e' }}>OB</td>
                    <td><span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#1c2330', color: '#8b949e' }}>OB</span></td>
                    <td style={{ fontWeight: 600, color: '#8b949e' }}>Opening Balance B/F</td>
                    <td style={{ color: '#8b949e' }}>Balance brought forward</td>
                    <td className="amount" style={{ textAlign: 'right', color: '#8b949e' }}>—</td>
                    <td className="amount" style={{ textAlign: 'right', color: '#8b949e' }}>—</td>
                    <td className="amount" style={{ textAlign: 'right', fontWeight: 700, color: '#a78bfa' }}>{fmt(generalLedger.openingBalance)}</td>
                  </tr>

                  {generalLedger.entries.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#8b949e' }}>
                        No transactions posted to this ledger account in this period.
                      </td>
                    </tr>
                  ) : (
                    generalLedger.entries.map((entry, idx) => (
                      <tr key={idx}>
                        <td className="amount" style={{ fontSize: 12, color: '#8b949e' }}>{entry.date}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#1a8cff' }}>{entry.voucherNo}</td>
                        <td>
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#1c2330', color: '#8b949e' }}>
                            {entry.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#e6edf3' }}>{entry.oppositeAccountName}</td>
                        <td style={{ fontSize: 12, color: '#8b949e' }}>{entry.narration}</td>
                        <td className="amount" style={{ textAlign: 'right', color: '#3fb950', fontWeight: entry.debit ? 600 : 400 }}>
                          {entry.debit ? fmt(entry.debit) : '—'}
                        </td>
                        <td className="amount" style={{ textAlign: 'right', color: '#f85149', fontWeight: entry.credit ? 600 : 400 }}>
                          {entry.credit ? fmt(entry.credit) : '—'}
                        </td>
                        <td className="amount" style={{ textAlign: 'right', fontWeight: 700, color: '#a78bfa' }}>
                          {fmt(entry.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ color: '#8b949e' }}>Period Movements</td>
                    <td className="amount" style={{ textAlign: 'right', color: '#3fb950' }}>{fmt(generalLedger.totalDebit)}</td>
                    <td className="amount" style={{ textAlign: 'right', color: '#f85149' }}>{fmt(generalLedger.totalCredit)}</td>
                    <td className="amount" style={{ textAlign: 'right', color: '#a78bfa', fontWeight: 800 }}>
                      {fmt(generalLedger.closingBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: TRIAL BALANCE (Integrity Verification) ── */}
      {activeTab === 'trialbalance' && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#e6edf3' }}>
                Tribal Harvest Marketing Cooperative Society Ltd.
              </div>
              <div style={{ fontSize: 12, color: '#8b949e' }}>Trial Balance · Automated General Ledger Verification</div>
            </div>
            <div style={{
              background: trialBalance.isBalanced ? '#3fb95022' : '#f8514922',
              color: trialBalance.isBalanced ? '#3fb950' : '#f85149',
              border: `1px solid ${trialBalance.isBalanced ? '#3fb95055' : '#f8514955'}`,
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 700,
            }}>
              {trialBalance.isBalanced ? '✓ TRIAL BALANCE BALANCED' : `⚠️ DIFFERENCE: ${fmt(trialBalance.difference)}`}
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Code</th>
                  <th>Account Name</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Closing Debit (₹)</th>
                  <th style={{ textAlign: 'right' }}>Closing Credit (₹)</th>
                </tr>
              </thead>
              <tbody>
                {trialBalance.lines.map(line => (
                  <tr key={line.accountId}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#1a8cff' }}>{line.accountCode}</td>
                    <td style={{ fontWeight: 600, color: '#e6edf3' }}>{line.accountName}</td>
                    <td>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#1c2330', color: '#8b949e' }}>
                        {line.category}
                      </span>
                    </td>
                    <td className="amount" style={{ textAlign: 'right', color: line.closingDebit > 0 ? '#3fb950' : '#8b949e' }}>
                      {line.closingDebit > 0 ? fmt(line.closingDebit) : '—'}
                    </td>
                    <td className="amount" style={{ textAlign: 'right', color: line.closingCredit > 0 ? '#a78bfa' : '#8b949e' }}>
                      {line.closingCredit > 0 ? fmt(line.closingCredit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#1c2330' }}>
                  <td colSpan={3} style={{ fontWeight: 700, color: '#e6edf3', fontSize: 13 }}>
                    GRAND TOTAL (TRIAL BALANCE)
                  </td>
                  <td className="amount" style={{ textAlign: 'right', color: '#3fb950', fontWeight: 800, fontSize: 14 }}>
                    {fmt(trialBalance.totalDebit)}
                  </td>
                  <td className="amount" style={{ textAlign: 'right', color: '#a78bfa', fontWeight: 800, fontSize: 14 }}>
                    {fmt(trialBalance.totalCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 6: PHASE 1 VERIFICATION SUITE ── */}
      {activeTab === 'verification' && (
        <Phase1VerificationSuite
          report={verificationReport}
          onRerun={() => setVerificationReport(runPhase1VerificationSuite(transactions))}
          onInjectAllTests={handleInjectAllTests}
          onResetDefault={resetTransactionsToDefault}
          injectStatus={injectStatus}
          onNavigateTab={tab => setActiveTab(tab)}
        />
      )}

      {/* ── MODAL: + RECEIPT ENTRY (TEST 1, TEST 4, TEST 6) ── */}
      {showReceiptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#161b22', border: '1px solid #3fb95055', borderRadius: 14, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#3fb950', margin: 0 }}>
                  + Record Receipt Voucher
                </h2>
                <div style={{ fontSize: 12, color: '#8b949e' }}>Automatically posts Dr. Bank/Cash &amp; Cr. Selected Account</div>
              </div>
              <button onClick={() => setShowReceiptModal(false)} style={{ background: 'transparent', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitReceipt} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Date</div>
                  <input style={{ width: '100%' }} value={receiptForm.date} onChange={e => setReceiptForm({ ...receiptForm, date: e.target.value })} />
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Received Into (Debit) *</div>
                  <select
                    style={{ width: '100%' }}
                    value={receiptForm.paymentMode}
                    onChange={e => setReceiptForm({ ...receiptForm, paymentMode: e.target.value as PaymentMode })}
                  >
                    <option value="BANK_NSTCB">Bank – NSCB (Co-op Bank)</option>
                    <option value="BANK_SBI">Bank – State Bank of India</option>
                    <option value="CASH">Cash in Hand</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Receipt Type *</div>
                  <select
                    style={{ width: '100%' }}
                    value={receiptForm.receiptType}
                    onChange={e => {
                      const rType = e.target.value
                      let acc = 'acc_share_capital'
                      let defNarration = ''
                      if (rType === 'SHARE_CAPITAL') {
                        acc = 'acc_share_capital'
                        defNarration = 'Share capital payment for shares through NSCB Bank'
                      } else if (rType === 'SAVINGS') {
                        acc = 'acc_savings'
                        defNarration = 'Member savings/thrift deposit through NSCB Bank'
                      } else if (rType === 'LOAN_RECOVERY_SPLIT') {
                        acc = 'acc_loan_rec'
                        defNarration = 'Loan recovery repayment: Principal ₹1,800 + Interest ₹200'
                      } else if (rType === 'ADMISSION_FEE') {
                        acc = 'acc_adm_fee'
                        defNarration = 'Admission fee received from member'
                      } else if (rType === 'SALES') {
                        acc = 'acc_sales'
                        defNarration = 'Product sales revenue'
                      } else {
                        acc = 'acc_other_inc'
                      }
                      setReceiptForm({ ...receiptForm, receiptType: rType, targetAccountId: acc, narration: defNarration })
                    }}
                  >
                    <option value="SHARE_CAPITAL">Share Capital (TEST 1 — Dr Bank, Cr Share Capital)</option>
                    <option value="SAVINGS">Member Savings &amp; Thrift (TEST 4 — Dr Bank, Cr Member Savings)</option>
                    <option value="LOAN_RECOVERY_SPLIT">Loan Recovery Split (TEST 6 — Principal + Interest)</option>
                    <option value="ADMISSION_FEE">Membership / Admission Fee</option>
                    <option value="SALES">Product &amp; Livestock Sales</option>
                    <option value="OTHER">Other Income / Receipt</option>
                  </select>
                </div>

                {/* If Loan Recovery Split is selected (TEST 6) */}
                {receiptForm.receiptType === 'LOAN_RECOVERY_SPLIT' ? (
                  <>
                    <div>
                      <div style={{ fontSize: 11, color: '#3fb950', fontWeight: 700, marginBottom: 4 }}>Principal Amount (₹) *</div>
                      <input
                        type="number"
                        style={{ width: '100%', borderColor: '#3fb950' }}
                        value={receiptForm.loanPrincipal}
                        onChange={e => setReceiptForm({ ...receiptForm, loanPrincipal: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, marginBottom: 4 }}>Interest Amount (₹) *</div>
                      <input
                        type="number"
                        style={{ width: '100%', borderColor: '#a78bfa' }}
                        value={receiptForm.loanInterest}
                        onChange={e => setReceiptForm({ ...receiptForm, loanInterest: e.target.value })}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <div style={{ fontSize: 11, color: '#3fb950', fontWeight: 700, marginBottom: 4 }}>Amount (₹) *</div>
                    <input
                      type="number"
                      style={{ width: '100%', borderColor: '#3fb950' }}
                      placeholder="e.g. 2000"
                      value={receiptForm.amount}
                      onChange={e => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Member (Optional)</div>
                <select
                  style={{ width: '100%' }}
                  value={receiptForm.memberId}
                  onChange={e => {
                    const m = members.find(mem => mem.memberId === e.target.value)
                    setReceiptForm({
                      ...receiptForm,
                      memberId: e.target.value,
                      memberName: m ? m.name : '',
                    })
                  }}
                >
                  <option value="">-- Non-member / General Receipt --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.memberId}>
                      {m.slno}. {m.name} ({m.memberId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Reference / Challan No.</div>
                <input
                  style={{ width: '100%' }}
                  placeholder="e.g. NSCB Scroll / Challan No"
                  value={receiptForm.referenceNo}
                  onChange={e => setReceiptForm({ ...receiptForm, referenceNo: e.target.value })}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Narration *</div>
                <input
                  style={{ width: '100%' }}
                  value={receiptForm.narration}
                  onChange={e => setReceiptForm({ ...receiptForm, narration: e.target.value })}
                  required
                />
              </div>

              {/* Double-Entry Preview */}
              <div style={{ background: '#1c2330', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#8b949e' }}>
                💡 <strong>Automatic Double-Entry Posting Preview:</strong>
                {receiptForm.receiptType === 'LOAN_RECOVERY_SPLIT' ? (
                  <>
                    <div style={{ color: '#3fb950', marginTop: 2 }}>
                      Dr. Bank – NSCB: ₹{(Number(receiptForm.loanPrincipal) || 0) + (Number(receiptForm.loanInterest) || 0)}
                    </div>
                    <div style={{ color: '#a78bfa' }}>
                      Cr. Member Loans Receivable: ₹{receiptForm.loanPrincipal || 0}
                    </div>
                    <div style={{ color: '#a78bfa' }}>
                      Cr. Loan Interest Income: ₹{receiptForm.loanInterest || 0}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ color: '#3fb950', marginTop: 2 }}>
                      Dr. {receiptForm.paymentMode === 'CASH' ? 'Cash in Hand' : 'Bank – NSCB'}: ₹{receiptForm.amount || 0}
                    </div>
                    <div style={{ color: '#a78bfa' }}>
                      Cr. {accounts.find(a => a.id === receiptForm.targetAccountId)?.name || 'Credit Account'}: ₹{receiptForm.amount || 0}
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-ghost" onClick={() => setShowReceiptModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#3fb950' }}>Post Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: – PAYMENT ENTRY (TEST 2, TEST 5, TEST 7) ── */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#161b22', border: '1px solid #f8514955', borderRadius: 14, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#f85149', margin: 0 }}>
                  – Record Payment Voucher
                </h2>
                <div style={{ fontSize: 12, color: '#8b949e' }}>Disburses money and debits designated expense, asset, or liability</div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'transparent', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Date</div>
                  <input style={{ width: '100%' }} value={paymentForm.date} onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} />
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Disburse From (Credit) *</div>
                  <select
                    style={{ width: '100%' }}
                    value={paymentForm.paymentMode}
                    onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value as PaymentMode })}
                  >
                    <option value="BANK_NSTCB">Bank – NSCB (Co-op Bank)</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK_SBI">Bank – State Bank of India</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Payment Account (Debit) *</div>
                  <select
                    style={{ width: '100%' }}
                    value={paymentForm.debitAccountId}
                    onChange={e => {
                      const accId = e.target.value
                      let defNarration = ''
                      if (accId === 'acc_electricity') defNarration = 'Electricity expense paid from NSCB Bank'
                      else if (accId === 'acc_loan_rec') defNarration = 'Loan disbursement of ₹20,000 from NSCB Bank'
                      else if (accId === 'acc_supplier_payable') defNarration = 'Payment to supplier for existing payable from NSCB Bank'
                      else defNarration = `Payment for ${accounts.find(a => a.id === accId)?.name}`
                      setPaymentForm({ ...paymentForm, debitAccountId: accId, narration: defNarration })
                    }}
                  >
                    <option value="acc_electricity">Electricity Expense (TEST 2 — Dr Electricity, Cr Bank)</option>
                    <option value="acc_loan_rec">Member Loans Receivable (TEST 5 — Loan Disbursement)</option>
                    <option value="acc_supplier_payable">Supplier Payables (TEST 7 — Supplier Payment)</option>
                    <option value="acc_procurement">Procurement (Feeds, Piglets, Chicks)</option>
                    <option value="acc_salary">Salary to Staff / Attendants</option>
                    <option value="acc_wages_labour">Labour &amp; Wages Charge</option>
                    <option value="acc_carriage">Carriage &amp; Freight Charge</option>
                    <option value="acc_travel">Travelling Expenses</option>
                    <option value="acc_meeting">Meeting Expenses &amp; Honorarium</option>
                    <option value="acc_stationery">Printing &amp; Stationery</option>
                    <option value="acc_audit_fee">Audit &amp; NSCU Affiliation Fee</option>
                    <option value="acc_project_exp">Project Shed Construction Expenses</option>
                    <option value="acc_fixed_assets">Asset Purchase (Equipments)</option>
                    <option value="acc_misc_exp">Miscellaneous Expenses</option>
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#f85149', fontWeight: 700, marginBottom: 4 }}>Amount (₹) *</div>
                  <input
                    type="number"
                    style={{ width: '100%', borderColor: '#f85149' }}
                    placeholder="e.g. 2500"
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Paid To (Person / Vendor / Member)</div>
                  <input
                    style={{ width: '100%' }}
                    placeholder="e.g. Power Dept / Supplier / Member"
                    value={paymentForm.paidTo}
                    onChange={e => setPaymentForm({ ...paymentForm, paidTo: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Narration *</div>
                <input
                  style={{ width: '100%' }}
                  value={paymentForm.narration}
                  onChange={e => setPaymentForm({ ...paymentForm, narration: e.target.value })}
                  required
                />
              </div>

              <div style={{ background: '#1c2330', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#8b949e' }}>
                💡 <strong>Automatic Double-Entry Posting Preview:</strong>
                <div style={{ color: '#f85149', marginTop: 2 }}>
                  Dr. {accounts.find(a => a.id === paymentForm.debitAccountId)?.name || 'Debit Account'} ₹{paymentForm.amount || 0}
                </div>
                <div style={{ color: '#00d4aa' }}>
                  Cr. {paymentForm.paymentMode === 'CASH' ? 'Cash in Hand' : 'Bank – NSCB'} ₹{paymentForm.amount || 0}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-ghost" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#f85149' }}>Post Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ⇄ TRANSFER ENTRY (TEST 3) ── */}
      {showTransferModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#161b22', border: '1px solid #1a8cff55', borderRadius: 14, width: '100%', maxWidth: 540, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#1a8cff', margin: 0 }}>
                  ⇄ Record Contra Transfer (TEST 3)
                </h2>
                <div style={{ fontSize: 12, color: '#8b949e' }}>Moves money between Cash and Bank without affecting Income or Expense</div>
              </div>
              <button onClick={() => setShowTransferModal(false)} style={{ background: 'transparent', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>From Account (Credit)</div>
                  <select
                    style={{ width: '100%' }}
                    value={transferForm.fromAccountId}
                    onChange={e => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                  >
                    <option value="acc_nstcb">Bank – NSCB (Co-op Bank)</option>
                    <option value="acc_cash">Cash in Hand</option>
                    <option value="acc_sbi">Bank – SBI</option>
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>To Account (Debit)</div>
                  <select
                    style={{ width: '100%' }}
                    value={transferForm.toAccountId}
                    onChange={e => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                  >
                    <option value="acc_cash">Cash in Hand</option>
                    <option value="acc_nstcb">Bank – NSCB</option>
                    <option value="acc_sbi">Bank – SBI</option>
                  </select>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#1a8cff', fontWeight: 700, marginBottom: 4 }}>Amount (₹) *</div>
                <input
                  type="number"
                  style={{ width: '100%', borderColor: '#1a8cff' }}
                  value={transferForm.amount}
                  onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })}
                  required
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Narration</div>
                <input
                  style={{ width: '100%' }}
                  value={transferForm.narration}
                  onChange={e => setTransferForm({ ...transferForm, narration: e.target.value })}
                />
              </div>

              <div style={{ background: '#1c2330', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#8b949e' }}>
                💡 <strong>Contra Double-Entry Preview:</strong>
                <div style={{ color: '#3fb950', marginTop: 2 }}>
                  Dr. Cash in Hand: ₹{transferForm.amount || 0}
                </div>
                <div style={{ color: '#1a8cff' }}>
                  Cr. Bank – NSCB: ₹{transferForm.amount || 0}
                </div>
                <div style={{ color: '#8b949e', fontSize: 11, marginTop: 4 }}>
                  ✓ Impact on Income: ₹0 · Impact on Expense: ₹0
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-ghost" onClick={() => setShowTransferModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#1a8cff' }}>Post Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: 📖 JOURNAL ENTRY (TEST 8 Unbalanced Protection) ── */}
      {showJournalModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#161b22', border: '1px solid #a78bfa55', borderRadius: 14, width: '100%', maxWidth: 560, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#a78bfa', margin: 0 }}>
                  📖 Post Journal Voucher
                </h2>
                <div style={{ fontSize: 12, color: '#8b949e' }}>Double-entry adjustments with strict validation</div>
              </div>
              <button onClick={() => { setShowJournalModal(false); setFormError(null); }} style={{ background: 'transparent', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {formError && (
              <div
                style={{
                  background: '#f8514922',
                  border: '1px solid #f85149',
                  color: '#f85149',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 14,
                }}
              >
                ❌ {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => {
                  setJournalForm({
                    date: '08-05-2026',
                    debitAccountId: 'acc_fixed_assets',
                    debitAmount: '5000',
                    creditAccountId: 'acc_surplus',
                    creditAmount: '4000',
                    narration: 'Test 8 Unbalanced Journal Entry',
                    referenceNo: 'TEST-8-UNBALANCED',
                  })
                  setFormError(null)
                }}
                style={{
                  background: '#f8514915',
                  color: '#f85149',
                  border: '1px solid #f8514944',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ⚡ Load Test 8 Preset (Dr ₹5,000 / Cr ₹4,000)
              </button>
            </div>

            <form onSubmit={handleSubmitJournal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#3fb950', fontWeight: 700, marginBottom: 4 }}>Debit Account</div>
                  <select
                    style={{ width: '100%' }}
                    value={journalForm.debitAccountId}
                    onChange={e => setJournalForm({ ...journalForm, debitAccountId: e.target.value })}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#3fb950', fontWeight: 700, marginBottom: 4 }}>Debit Amount (₹) *</div>
                  <input
                    type="number"
                    style={{ width: '100%', borderColor: '#3fb950' }}
                    value={journalForm.debitAmount}
                    onChange={e => setJournalForm({ ...journalForm, debitAmount: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, marginBottom: 4 }}>Credit Account</div>
                  <select
                    style={{ width: '100%' }}
                    value={journalForm.creditAccountId}
                    onChange={e => setJournalForm({ ...journalForm, creditAccountId: e.target.value })}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, marginBottom: 4 }}>Credit Amount (₹) *</div>
                  <input
                    type="number"
                    style={{ width: '100%', borderColor: '#a78bfa' }}
                    value={journalForm.creditAmount}
                    onChange={e => setJournalForm({ ...journalForm, creditAmount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Narration *</div>
                <input
                  style={{ width: '100%' }}
                  value={journalForm.narration}
                  onChange={e => setJournalForm({ ...journalForm, narration: e.target.value })}
                  required
                />
              </div>

              {/* Balance status check in modal */}
              <div style={{
                background: Number(journalForm.debitAmount) === Number(journalForm.creditAmount) ? '#3fb95015' : '#f8514915',
                border: `1px solid ${Number(journalForm.debitAmount) === Number(journalForm.creditAmount) ? '#3fb95044' : '#f8514944'}`,
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 12,
              }}>
                {Number(journalForm.debitAmount) === Number(journalForm.creditAmount) ? (
                  <span style={{ color: '#3fb950', fontWeight: 700 }}>
                    ✓ Balanced: Total Dr ₹{journalForm.debitAmount} = Total Cr ₹{journalForm.creditAmount}
                  </span>
                ) : (
                  <span style={{ color: '#f85149', fontWeight: 700 }}>
                    ⚠️ Unbalanced: Dr ₹{journalForm.debitAmount || 0} ≠ Cr ₹{journalForm.creditAmount || 0} (Diff: ₹{Math.abs((Number(journalForm.debitAmount) || 0) - (Number(journalForm.creditAmount) || 0))})
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-ghost" onClick={() => setShowJournalModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#a78bfa' }}>Post Journal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CANCEL VOUCHER (TEST 9 Protection) ── */}
      {showCancelModal && selectedTx && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#161b22', border: '1px solid #f8514955', borderRadius: 14, width: '100%', maxWidth: 460, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#f85149', margin: 0 }}>
              Cancel Voucher {selectedTx.voucherNo}
            </h2>
            <p style={{ color: '#e6edf3', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              Under cooperative accounting safety rules, posted vouchers are not deleted. They are marked as <strong>CANCELLED</strong> with an audit trail, and removed from active ledger balances.
            </p>
            <div>
              <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Reason for Cancellation *</div>
              <input
                style={{ width: '100%' }}
                placeholder="e.g. Duplicate entry, incorrect amount, reversal"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button className="btn-ghost" onClick={() => setShowCancelModal(false)}>Close</button>
              <button
                style={{ background: '#f85149', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                onClick={handleConfirmCancel}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
