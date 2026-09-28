import {
  type Account,
  type Transaction,
  type TransactionLine,
  type TransactionType,
  type PaymentMode,
  type LedgerEntry,
  type TrialBalanceLine,
} from '../types/accounting'

/* ── Date Parser Utility ───────────────────────────────────────── */
export function parseDateToTimestamp(d: string): number {
  if (!d) return NaN
  const str = d.trim()

  // Format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return new Date(str).getTime()
  }

  // Format: DD/MM/YYYY or DD-MM-YYYY
  const parts = str.includes('/') ? str.split('/') : str.split('-')
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      // day, month, year
      const day = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const year = parseInt(parts[2], 10)
      return new Date(year, month, day).getTime()
    } else if (parts[0].length === 4) {
      // year, month, day
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      return new Date(year, month, day).getTime()
    }
  }

  const parsed = new Date(str).getTime()
  return isNaN(parsed) ? 0 : parsed
}

export function isDateInRange(dateStr: string, fromDate?: string, toDate?: string): boolean {
  if (!fromDate && !toDate) return true
  const t = parseDateToTimestamp(dateStr)
  if (isNaN(t) || t === 0) return true

  if (fromDate) {
    const f = parseDateToTimestamp(fromDate)
    if (!isNaN(f) && f > 0 && t < f) return false
  }

  if (toDate) {
    const to = parseDateToTimestamp(toDate)
    if (!isNaN(to) && to > 0 && t > to + 86399999) return false // inclusive
  }

  return true
}

/* ── Resolve Bank/Cash Account ID from Payment Mode ────────────── */
export function getPaymentAccountId(mode: PaymentMode): string {
  switch (mode) {
    case 'BANK_NSTCB':
      return 'acc_nstcb'
    case 'BANK_SBI':
      return 'acc_sbi'
    case 'CASH':
    default:
      return 'acc_cash'
  }
}

/* ── Double-Entry Validation ───────────────────────────────────── */
export function validateDoubleEntry(lines: TransactionLine[]): { valid: boolean; totalDebit: number; totalCredit: number; error?: string } {
  if (!lines || lines.length < 2) {
    return { valid: false, totalDebit: 0, totalCredit: 0, error: 'A transaction must have at least 2 double-entry lines.' }
  }

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)

  // Strict Double-Entry: Total Debit must equal Total Credit
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    return {
      valid: false,
      totalDebit,
      totalCredit,
      error: 'Transaction is not balanced. Debit and Credit must be equal.',
    }
  }

  if (totalDebit <= 0) {
    return { valid: false, totalDebit, totalCredit, error: 'Transaction amount must be greater than zero.' }
  }

  return { valid: true, totalDebit, totalCredit }
}

/* ── Sequential Voucher Number Generator ───────────────────────── */
export function generateNextVoucherNo(type: TransactionType, existingTransactions: Transaction[], year = '2026'): string {
  const prefixMap: Record<TransactionType, string> = {
    RECEIPT: 'RV',
    PAYMENT: 'PV',
    TRANSFER: 'TV',
    JOURNAL: 'JV',
  }
  const prefix = prefixMap[type]
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`)

  let maxSeq = 0
  for (const t of existingTransactions) {
    if (t.voucherNo) {
      const match = t.voucherNo.match(pattern)
      if (match && match[1]) {
        const seq = parseInt(match[1], 10)
        if (seq > maxSeq) maxSeq = seq
      }
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(4, '0')
  return `${prefix}-${year}-${nextSeq}`
}

/* ── Posting Rule: Generate Double-Entry Lines for Receipt ─────── */
export type SplitCredit = {
  accountId: string
  amount: number
  description?: string
}

export function buildReceiptPostingLines(params: {
  amount: number
  paymentMode: PaymentMode
  targetAccountId?: string // used for single credit
  splitCredits?: SplitCredit[] // used for compound receipts like Loan Recovery (Principal + Interest)
  accounts: Account[]
  memberId?: string
  memberName?: string
  projectId?: string
  projectName?: string
  narration: string
}): TransactionLine[] {
  const cashOrBankAccountId = getPaymentAccountId(params.paymentMode)
  const cashOrBankAcc = params.accounts.find(a => a.id === cashOrBankAccountId) || { name: 'Cash/Bank' }

  const lines: TransactionLine[] = [
    {
      id: `l_${Date.now()}_1`,
      accountId: cashOrBankAccountId,
      accountName: cashOrBankAcc.name,
      debit: params.amount,
      credit: 0,
      memberId: params.memberId,
      memberName: params.memberName,
      projectId: params.projectId,
      projectName: params.projectName,
      description: `Receipt into ${cashOrBankAcc.name}: ${params.narration}`,
    },
  ]

  if (params.splitCredits && params.splitCredits.length > 0) {
    params.splitCredits.forEach((sc, idx) => {
      const acc = params.accounts.find(a => a.id === sc.accountId) || { name: 'Credit Account' }
      lines.push({
        id: `l_${Date.now()}_${idx + 2}`,
        accountId: sc.accountId,
        accountName: acc.name,
        debit: 0,
        credit: sc.amount,
        memberId: params.memberId,
        memberName: params.memberName,
        projectId: params.projectId,
        projectName: params.projectName,
        description: sc.description || `Credit to ${acc.name}: ${params.narration}`,
      })
    })
  } else if (params.targetAccountId) {
    const creditAcc = params.accounts.find(a => a.id === params.targetAccountId) || { name: 'Credit Account' }
    lines.push({
      id: `l_${Date.now()}_2`,
      accountId: params.targetAccountId,
      accountName: creditAcc.name,
      debit: 0,
      credit: params.amount,
      memberId: params.memberId,
      memberName: params.memberName,
      projectId: params.projectId,
      projectName: params.projectName,
      description: `Credit to ${creditAcc.name}: ${params.narration}`,
    })
  }

  return lines
}

/* ── Posting Rule: Generate Double-Entry Lines for Payment ─────── */
export function buildPaymentPostingLines(params: {
  amount: number
  paymentMode: PaymentMode
  debitAccountId: string // can be expense, loan receivable, supplier payable, asset
  accounts: Account[]
  memberId?: string
  memberName?: string
  projectId?: string
  projectName?: string
  narration: string
}): TransactionLine[] {
  const cashOrBankAccountId = getPaymentAccountId(params.paymentMode)
  const cashOrBankAcc = params.accounts.find(a => a.id === cashOrBankAccountId) || { name: 'Cash/Bank' }
  const debitAcc = params.accounts.find(a => a.id === params.debitAccountId) || { name: 'Account' }

  return [
    {
      id: `l_${Date.now()}_1`,
      accountId: params.debitAccountId,
      accountName: debitAcc.name,
      debit: params.amount,
      credit: 0,
      memberId: params.memberId,
      memberName: params.memberName,
      projectId: params.projectId,
      projectName: params.projectName,
      description: `Debit: ${params.narration}`,
    },
    {
      id: `l_${Date.now()}_2`,
      accountId: cashOrBankAccountId,
      accountName: cashOrBankAcc.name,
      debit: 0,
      credit: params.amount,
      memberId: params.memberId,
      memberName: params.memberName,
      projectId: params.projectId,
      projectName: params.projectName,
      description: `Disbursed from ${cashOrBankAcc.name}: ${params.narration}`,
    },
  ]
}

/* ── Posting Rule: Generate Double-Entry Lines for Transfer ────── */
export function buildTransferPostingLines(params: {
  amount: number
  fromAccountId: string
  toAccountId: string
  accounts: Account[]
  narration: string
}): TransactionLine[] {
  const fromAcc = params.accounts.find(a => a.id === params.fromAccountId) || { name: 'Source Account' }
  const toAcc = params.accounts.find(a => a.id === params.toAccountId) || { name: 'Destination Account' }

  return [
    {
      id: `l_${Date.now()}_1`,
      accountId: params.toAccountId,
      accountName: toAcc.name,
      debit: params.amount,
      credit: 0,
      description: `Transfer in from ${fromAcc.name}: ${params.narration}`,
    },
    {
      id: `l_${Date.now()}_2`,
      accountId: params.fromAccountId,
      accountName: fromAcc.name,
      debit: 0,
      credit: params.amount,
      description: `Transfer out to ${toAcc.name}: ${params.narration}`,
    },
  ]
}

/* ── Derivation: General Ledger for an Account ──────────────────── */
export function deriveAccountLedger(
  accountId: string,
  transactions: Transaction[],
  accounts: Account[],
  dateRange?: { fromDate?: string; toDate?: string }
): {
  account: Account | undefined
  entries: LedgerEntry[]
  openingBalance: number
  closingBalance: number
  totalDebit: number
  totalCredit: number
} {
  const account = accounts.find(a => a.id === accountId)
  const isDebitNormal = account ? (account.category === 'ASSET' || account.category === 'EXPENDITURE') : true

  // Sort posted transactions chronologically
  const activeTx = transactions
    .filter(t => t.status === 'POSTED')
    .sort((a, b) => parseDateToTimestamp(a.date) - parseDateToTimestamp(b.date))

  let baseOpening = account ? account.openingBalance : 0

  // If a fromDate is specified, calculate the cumulative balance prior to fromDate
  if (dateRange?.fromDate) {
    const f = parseDateToTimestamp(dateRange.fromDate)
    if (!isNaN(f) && f > 0) {
      for (const tx of activeTx) {
        const txT = parseDateToTimestamp(tx.date)
        if (txT < f) {
          const lines = tx.lines.filter(l => l.accountId === accountId)
          for (const l of lines) {
            const dr = l.debit || 0
            const cr = l.credit || 0
            if (isDebitNormal) {
              baseOpening += dr - cr
            } else {
              baseOpening += cr - dr
            }
          }
        }
      }
    }
  }

  let runningBalance = baseOpening
  const entries: LedgerEntry[] = []
  let totalDebit = 0
  let totalCredit = 0

  for (const tx of activeTx) {
    // Check if within date filter
    if (dateRange && !isDateInRange(tx.date, dateRange.fromDate, dateRange.toDate)) {
      continue
    }

    const matchedLines = tx.lines.filter(l => l.accountId === accountId)
    if (matchedLines.length === 0) continue

    // Counterpart account names
    const otherLines = tx.lines.filter(l => l.accountId !== accountId)
    const oppositeAccountName = otherLines.map(l => l.accountName).join(', ') || tx.narration

    for (const line of matchedLines) {
      const dr = line.debit || 0
      const cr = line.credit || 0
      totalDebit += dr
      totalCredit += cr

      if (isDebitNormal) {
        runningBalance = runningBalance + dr - cr
      } else {
        runningBalance = runningBalance + cr - dr
      }

      entries.push({
        date: tx.date,
        voucherNo: tx.voucherNo,
        transactionId: tx.id,
        type: tx.type,
        narration: tx.narration,
        debit: dr,
        credit: cr,
        runningBalance,
        oppositeAccountName,
      })
    }
  }

  return {
    account,
    entries,
    openingBalance: baseOpening,
    closingBalance: runningBalance,
    totalDebit,
    totalCredit,
  }
}

/* ── Derivation: Cash Book ─────────────────────────────────────── */
export function deriveCashBook(transactions: Transaction[], accounts: Account[], dateRange?: { fromDate?: string; toDate?: string }) {
  return deriveAccountLedger('acc_cash', transactions, accounts, dateRange)
}

/* ── Derivation: Bank Book ─────────────────────────────────────── */
export function deriveBankBook(bankAccountId: string, transactions: Transaction[], accounts: Account[], dateRange?: { fromDate?: string; toDate?: string }) {
  return deriveAccountLedger(bankAccountId, transactions, accounts, dateRange)
}

/* ── Derivation: Trial Balance ─────────────────────────────────── */
export function deriveTrialBalance(
  transactions: Transaction[],
  accounts: Account[],
  dateRange?: { fromDate?: string; toDate?: string }
): {
  lines: TrialBalanceLine[]
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
  difference: number
} {
  const activeTx = transactions.filter(t => t.status === 'POSTED')

  // Calculate prior movements (before fromDate) and period movements (fromDate to toDate)
  const priorDebitMap: Record<string, number> = {}
  const priorCreditMap: Record<string, number> = {}
  const periodDebitMap: Record<string, number> = {}
  const periodCreditMap: Record<string, number> = {}

  const fromT = dateRange?.fromDate ? parseDateToTimestamp(dateRange.fromDate) : 0
  const toT = dateRange?.toDate ? parseDateToTimestamp(dateRange.toDate) : 0

  for (const tx of activeTx) {
    const txT = parseDateToTimestamp(tx.date)

    if (fromT > 0 && txT < fromT) {
      for (const line of tx.lines) {
        priorDebitMap[line.accountId] = (priorDebitMap[line.accountId] || 0) + (line.debit || 0)
        priorCreditMap[line.accountId] = (priorCreditMap[line.accountId] || 0) + (line.credit || 0)
      }
    } else if (toT > 0 && txT > toT + 86399999) {
      // Future transaction beyond toDate, exclude
      continue
    } else {
      // In selected period
      for (const line of tx.lines) {
        periodDebitMap[line.accountId] = (periodDebitMap[line.accountId] || 0) + (line.debit || 0)
        periodCreditMap[line.accountId] = (periodCreditMap[line.accountId] || 0) + (line.credit || 0)
      }
    }
  }

  const lines: TrialBalanceLine[] = []
  let totalDebit = 0
  let totalCredit = 0

  for (const acc of accounts) {
    const isDebitNormal = acc.category === 'ASSET' || acc.category === 'EXPENDITURE'
    const baseOpeningDebit = isDebitNormal ? acc.openingBalance : 0
    const baseOpeningCredit = !isDebitNormal ? acc.openingBalance : 0

    // Adjusted opening (base + prior period transactions)
    const priorDr = priorDebitMap[acc.id] || 0
    const priorCr = priorCreditMap[acc.id] || 0
    const openingNet = (baseOpeningDebit + priorDr) - (baseOpeningCredit + priorCr)

    const openingDebit = openingNet >= 0 ? openingNet : 0
    const openingCredit = openingNet < 0 ? Math.abs(openingNet) : 0

    const periodDebit = periodDebitMap[acc.id] || 0
    const periodCredit = periodCreditMap[acc.id] || 0

    // Closing Net balance
    const closingNet = (openingDebit + periodDebit) - (openingCredit + periodCredit)

    let closingDebit = 0
    let closingCredit = 0

    if (closingNet >= 0) {
      closingDebit = closingNet
    } else {
      closingCredit = Math.abs(closingNet)
    }

    // Only include accounts with activity or opening balances
    if (openingDebit > 0 || openingCredit > 0 || periodDebit > 0 || periodCredit > 0) {
      lines.push({
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        category: acc.category,
        openingDebit,
        openingCredit,
        periodDebit,
        periodCredit,
        closingDebit,
        closingCredit,
      })

      totalDebit += closingDebit
      totalCredit += closingCredit
    }
  }

  const difference = Math.abs(totalDebit - totalCredit)
  const isBalanced = difference < 0.01

  return {
    lines,
    totalDebit,
    totalCredit,
    isBalanced,
    difference,
  }
}
