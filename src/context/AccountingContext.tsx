import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import {
  type Account,
  type Transaction,
  type TransactionLine,
  type PaymentMode,
  defaultAccounts,
} from '../types/accounting'
import {
  generateNextVoucherNo,
  buildReceiptPostingLines,
  buildPaymentPostingLines,
  buildTransferPostingLines,
  validateDoubleEntry,
  deriveAccountLedger,
  deriveCashBook,
  deriveBankBook,
  deriveTrialBalance,
  type SplitCredit,
} from '../services/accountingEngine'
import { initialTransactions } from '../services/seedTransactions'

export type CreateReceiptParams = {
  date: string
  category: string
  targetAccountId?: string
  splitCredits?: SplitCredit[]
  amount: number
  paymentMode: PaymentMode
  narration: string
  memberId?: string
  memberName?: string
  projectId?: string
  projectName?: string
  referenceNo?: string
}

export type CreatePaymentParams = {
  date: string
  category: string
  debitAccountId: string // can be expense, loan receivable, supplier payable, asset
  amount: number
  paymentMode: PaymentMode
  narration: string
  paidTo?: string
  memberId?: string
  projectId?: string
  projectName?: string
  referenceNo?: string
}

export type CreateTransferParams = {
  date: string
  fromAccountId: string
  toAccountId: string
  amount: number
  narration: string
  referenceNo?: string
}

export type CreateJournalParams = {
  date: string
  narration: string
  lines: Omit<TransactionLine, 'id'>[]
  referenceNo?: string
}

export type DateRange = {
  fromDate?: string
  toDate?: string
}

type AccountingContextType = {
  accounts: Account[]
  transactions: Transaction[]

  // Global Date Filter
  dateRange: DateRange
  setDateRange: (range: DateRange) => void

  // Core Transaction Actions (Phase 1 & Phase 2 Migration)
  createReceipt: (params: CreateReceiptParams) => { success: boolean; transaction?: Transaction; error?: string }
  createPayment: (params: CreatePaymentParams) => { success: boolean; transaction?: Transaction; error?: string }
  createTransfer: (params: CreateTransferParams) => { success: boolean; transaction?: Transaction; error?: string }
  createJournal: (params: CreateJournalParams) => { success: boolean; transaction?: Transaction; error?: string }
  cancelTransaction: (id: string, reason: string) => { success: boolean; error?: string }
  resetTransactionsToDefault: () => void
  postTransactionBatch: (txs: Transaction[]) => { success: boolean; count: number }

  // Derived Books (Single Source of Truth, reactive to dateRange)
  cashBook: ReturnType<typeof deriveCashBook>
  getBankBook: (bankAccountId: string) => ReturnType<typeof deriveBankBook>
  getAccountLedger: (accountId: string) => ReturnType<typeof deriveAccountLedger>
  trialBalance: ReturnType<typeof deriveTrialBalance>
}

const Ctx = createContext<AccountingContextType | null>(null)

export function AccountingProvider({ children }: { children: ReactNode }) {
  // Clear obsolete dummy data from previous sessions
  useEffect(() => {
    try {
      localStorage.removeItem('thmcs_accounts_v1')
      localStorage.removeItem('thmcs_accounts_v2')
      localStorage.removeItem('thmcs_transactions_v1')
      localStorage.removeItem('thmcs_transactions_v2')
    } catch (e) {
      // ignore
    }
  }, [])

  const [accounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem('thmcs_accounts_audit_2026')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.error(e)
    }
    return defaultAccounts
  })

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('thmcs_transactions_audit_2026')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.error(e)
    }
    return initialTransactions
  })

  // Date Range state
  const [dateRange, setDateRange] = useState<DateRange>({})

  useEffect(() => {
    try {
      localStorage.setItem('thmcs_transactions_audit_2026', JSON.stringify(transactions))
    } catch (e) {
      console.error(e)
    }
  }, [transactions])

  /* ── 1. Create Receipt ───────────────────────────────────────── */
  const createReceipt = (params: CreateReceiptParams) => {
    if (params.amount <= 0) {
      return { success: false, error: 'Receipt amount must be greater than zero.' }
    }
    if (!params.narration?.trim()) {
      return { success: false, error: 'Please enter a narration or description.' }
    }

    const lines = buildReceiptPostingLines({
      amount: params.amount,
      paymentMode: params.paymentMode,
      targetAccountId: params.targetAccountId,
      splitCredits: params.splitCredits,
      accounts,
      memberId: params.memberId,
      memberName: params.memberName,
      projectId: params.projectId,
      projectName: params.projectName,
      narration: params.narration,
    })

    const validation = validateDoubleEntry(lines)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const voucherNo = generateNextVoucherNo('RECEIPT', transactions)
    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      voucherNo,
      date: params.date || new Date().toLocaleDateString('en-GB'),
      type: 'RECEIPT',
      category: params.category,
      narration: params.narration,
      amount: params.amount,
      paymentMode: params.paymentMode,
      memberId: params.memberId,
      memberName: params.memberName,
      projectId: params.projectId,
      projectName: params.projectName,
      referenceNo: params.referenceNo,
      status: 'POSTED',
      lines,
      createdAt: new Date().toISOString(),
    }

    setTransactions(prev => [newTx, ...prev])
    return { success: true, transaction: newTx }
  }

  /* ── 2. Create Payment ───────────────────────────────────────── */
  const createPayment = (params: CreatePaymentParams) => {
    if (params.amount <= 0) {
      return { success: false, error: 'Payment amount must be greater than zero.' }
    }
    if (!params.narration?.trim()) {
      return { success: false, error: 'Please enter a narration or description.' }
    }

    const lines = buildPaymentPostingLines({
      amount: params.amount,
      paymentMode: params.paymentMode,
      debitAccountId: params.debitAccountId,
      accounts,
      memberId: params.memberId,
      memberName: params.paidTo,
      projectId: params.projectId,
      projectName: params.projectName,
      narration: params.narration,
    })

    const validation = validateDoubleEntry(lines)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const voucherNo = generateNextVoucherNo('PAYMENT', transactions)
    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      voucherNo,
      date: params.date || new Date().toLocaleDateString('en-GB'),
      type: 'PAYMENT',
      category: params.category,
      narration: params.narration,
      amount: params.amount,
      paymentMode: params.paymentMode,
      memberId: params.memberId,
      memberName: params.paidTo,
      projectId: params.projectId,
      projectName: params.projectName,
      referenceNo: params.referenceNo,
      status: 'POSTED',
      lines,
      createdAt: new Date().toISOString(),
    }

    setTransactions(prev => [newTx, ...prev])
    return { success: true, transaction: newTx }
  }

  /* ── 3. Create Transfer ──────────────────────────────────────── */
  const createTransfer = (params: CreateTransferParams) => {
    if (params.amount <= 0) {
      return { success: false, error: 'Transfer amount must be greater than zero.' }
    }
    if (params.fromAccountId === params.toAccountId) {
      return { success: false, error: 'Source and destination accounts must be different.' }
    }

    const lines = buildTransferPostingLines({
      amount: params.amount,
      fromAccountId: params.fromAccountId,
      toAccountId: params.toAccountId,
      accounts,
      narration: params.narration,
    })

    const validation = validateDoubleEntry(lines)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const voucherNo = generateNextVoucherNo('TRANSFER', transactions)
    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      voucherNo,
      date: params.date || new Date().toLocaleDateString('en-GB'),
      type: 'TRANSFER',
      category: 'CONTRA_TRANSFER',
      narration: params.narration,
      amount: params.amount,
      referenceNo: params.referenceNo,
      status: 'POSTED',
      lines,
      createdAt: new Date().toISOString(),
    }

    setTransactions(prev => [newTx, ...prev])
    return { success: true, transaction: newTx }
  }

  /* ── 4. Create Journal ───────────────────────────────────────── */
  const createJournal = (params: CreateJournalParams) => {
    if (!params.lines || params.lines.length < 2) {
      return { success: false, error: 'Journal voucher must have at least 2 lines.' }
    }

    const hydratedLines: TransactionLine[] = params.lines.map((l, idx) => ({
      ...l,
      id: `jl_${Date.now()}_${idx}`,
    }))

    const validation = validateDoubleEntry(hydratedLines)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const voucherNo = generateNextVoucherNo('JOURNAL', transactions)
    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      voucherNo,
      date: params.date || new Date().toLocaleDateString('en-GB'),
      type: 'JOURNAL',
      category: 'JOURNAL_ADJUSTMENT',
      narration: params.narration,
      amount: validation.totalDebit,
      referenceNo: params.referenceNo,
      status: 'POSTED',
      lines: hydratedLines,
      createdAt: new Date().toISOString(),
    }

    setTransactions(prev => [newTx, ...prev])
    return { success: true, transaction: newTx }
  }

  /* ── 5. Cancel Transaction (Audit Protected) ─────────────────── */
  const cancelTransaction = (id: string, reason: string) => {
    if (!reason?.trim()) {
      return { success: false, error: 'A cancellation reason is required for audit trail.' }
    }
    setTransactions(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              status: 'CANCELLED',
              cancelledAt: new Date().toISOString(),
              cancelReason: reason,
            }
          : t
      )
    )
    return { success: true }
  }

  const resetTransactionsToDefault = () => {
    setTransactions(initialTransactions)
    try {
      localStorage.setItem('thmcs_transactions_audit_2026', JSON.stringify(initialTransactions))
    } catch (e) {
      console.error(e)
    }
  }

  const postTransactionBatch = (txs: Transaction[]) => {
    setTransactions(prev => {
      const existingIds = new Set(prev.map(t => t.id))
      const toAdd = txs.filter(t => !existingIds.has(t.id))
      return [...toAdd, ...prev]
    })
    return { success: true, count: txs.length }
  }

  /* ── Derived Books (respecting dateRange) ────────────────────── */
  const cashBook = useMemo(
    () => deriveCashBook(transactions, accounts, dateRange),
    [transactions, accounts, dateRange]
  )

  const getBankBook = (bankAccountId: string) =>
    deriveBankBook(bankAccountId, transactions, accounts, dateRange)

  const getAccountLedger = (accountId: string) =>
    deriveAccountLedger(accountId, transactions, accounts, dateRange)

  const trialBalance = useMemo(
    () => deriveTrialBalance(transactions, accounts, dateRange),
    [transactions, accounts, dateRange]
  )

  return (
    <Ctx.Provider
      value={{
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
        postTransactionBatch,
        cashBook,
        getBankBook,
        getAccountLedger,
        trialBalance,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useAccounting() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAccounting must be used within AccountingProvider')
  return ctx
}
