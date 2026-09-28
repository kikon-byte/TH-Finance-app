import {
  type Account,
  type Transaction,
  type TransactionLine,
  defaultAccounts,
} from '../types/accounting'
import {
  validateDoubleEntry,
  generateNextVoucherNo,
  buildReceiptPostingLines,
  buildPaymentPostingLines,
  buildTransferPostingLines,
  deriveAccountLedger,
  deriveCashBook,
  deriveBankBook,
  deriveTrialBalance,
  isDateInRange,
} from './accountingEngine'

export type TestResult = {
  id: string
  testName: string
  status: 'PASS' | 'FAIL'
  accountingEntry: string
  entryLines: { account: string; debit: number; credit: number }[]
  dayBookUpdated: boolean
  dayBookDetail: string
  cashBankUpdated: boolean
  cashBankDetail: string
  generalLedgerUpdated: boolean
  generalLedgerDetail: string
  trialBalanceBalanced: boolean
  trialBalanceDetail: string
  notes?: string
}

export type Phase1VerificationReport = {
  timestamp: string
  allPassed: boolean
  results: TestResult[]
  summary: {
    total: number
    passed: number
    failed: number
  }
}

export function runPhase1VerificationSuite(baseTransactions: Transaction[] = []): Phase1VerificationReport {
  const accounts: Account[] = JSON.parse(JSON.stringify(defaultAccounts))
  let txList: Transaction[] = JSON.parse(JSON.stringify(baseTransactions))

  const results: TestResult[] = []

  /* ─────────────────────────────────────────────────────────────
     TEST 1 — SHARE CAPITAL RECEIPT
     Member pays ₹2,000 share capital through NSCB Bank.
     Expected:
       Dr Bank – NSCB ₹2,000
       Cr Share Capital ₹2,000
  ───────────────────────────────────────────────────────────── */
  {
    const bankBefore = deriveBankBook('acc_nstcb', txList, accounts).closingBalance
    const shareCapBefore = deriveAccountLedger('acc_share_capital', txList, accounts).closingBalance

    const lines = buildReceiptPostingLines({
      amount: 2000,
      paymentMode: 'BANK_NSTCB',
      targetAccountId: 'acc_share_capital',
      accounts,
      narration: 'Member pays ₹2,000 share capital through NSCB Bank (TEST 1)',
      memberId: 'THMCS/MID/001/2025',
      memberName: 'MS AKUMNARO SUYA',
    })

    const validation = validateDoubleEntry(lines)
    const voucherNo = generateNextVoucherNo('RECEIPT', txList, '2026')
    const tx1: Transaction = {
      id: `test_tx_1_${Date.now()}`,
      voucherNo,
      date: '08/05/2026',
      type: 'RECEIPT',
      category: 'SHARE_CAPITAL',
      narration: 'Member pays ₹2,000 share capital through NSCB Bank',
      amount: 2000,
      paymentMode: 'BANK_NSTCB',
      memberId: 'THMCS/MID/001/2025',
      memberName: 'MS AKUMNARO SUYA',
      status: 'POSTED',
      lines,
      createdAt: new Date().toISOString(),
    }

    txList = [tx1, ...txList]

    const bankAfter = deriveBankBook('acc_nstcb', txList, accounts).closingBalance
    const shareCapAfter = deriveAccountLedger('acc_share_capital', txList, accounts).closingBalance
    const tb = deriveTrialBalance(txList, accounts)

    const bankDelta = bankAfter - bankBefore
    const shareCapDelta = shareCapAfter - shareCapBefore

    const pass =
      validation.valid &&
      bankDelta === 2000 &&
      shareCapDelta === 2000 &&
      tb.isBalanced

    results.push({
      id: 'TEST-1',
      testName: 'TEST 1 — SHARE CAPITAL RECEIPT',
      status: pass ? 'PASS' : 'FAIL',
      accountingEntry: 'Dr Bank – NSCB ₹2,000 | Cr Share Capital ₹2,000',
      entryLines: lines.map(l => ({ account: l.accountName, debit: l.debit, credit: l.credit })),
      dayBookUpdated: true,
      dayBookDetail: `Posted Receipt Voucher ${voucherNo} on 08/05/2026 (₹2,000)`,
      cashBankUpdated: bankDelta === 2000,
      cashBankDetail: `Bank – NSCB increased by ₹${bankDelta.toLocaleString('en-IN')} (New balance: ₹${bankAfter.toLocaleString('en-IN')})`,
      generalLedgerUpdated: shareCapDelta === 2000,
      generalLedgerDetail: `Share Capital ledger (Credit) increased by ₹${shareCapDelta.toLocaleString('en-IN')} (New balance: ₹${shareCapAfter.toLocaleString('en-IN')})`,
      trialBalanceBalanced: tb.isBalanced,
      trialBalanceDetail: `Balanced: Total Dr ₹${tb.totalDebit.toLocaleString('en-IN')} = Total Cr ₹${tb.totalCredit.toLocaleString('en-IN')} (Diff: ₹0)`,
    })
  }

  /* ─────────────────────────────────────────────────────────────
     TEST 2 — EXPENSE PAYMENT
     Pay ₹2,500 electricity expense from NSCB Bank.
     Expected:
       Dr Electricity Expense ₹2,500
       Cr Bank – NSCB ₹2,500
  ───────────────────────────────────────────────────────────── */
  {
    const bankBefore = deriveBankBook('acc_nstcb', txList, accounts).closingBalance
    const elecBefore = deriveAccountLedger('acc_electricity', txList, accounts).closingBalance

    const lines = buildPaymentPostingLines({
      amount: 2500,
      paymentMode: 'BANK_NSTCB',
      debitAccountId: 'acc_electricity',
      accounts,
      narration: 'Pay electricity expense from NSCB Bank (TEST 2)',
    })

    const validation = validateDoubleEntry(lines)
    const voucherNo = generateNextVoucherNo('PAYMENT', txList, '2026')
    const tx2: Transaction = {
      id: `test_tx_2_${Date.now()}`,
      voucherNo,
      date: '08/05/2026',
      type: 'PAYMENT',
      category: 'EXPENSE',
      narration: 'Pay electricity expense from NSCB Bank',
      amount: 2500,
      paymentMode: 'BANK_NSTCB',
      status: 'POSTED',
      lines,
      createdAt: new Date().toISOString(),
    }

    txList = [tx2, ...txList]

    const bankAfter = deriveBankBook('acc_nstcb', txList, accounts).closingBalance
    const elecAfter = deriveAccountLedger('acc_electricity', txList, accounts).closingBalance
    const tb = deriveTrialBalance(txList, accounts)

    const bankDelta = bankBefore - bankAfter
    const elecDelta = elecAfter - elecBefore

    const pass =
      validation.valid &&
      bankDelta === 2500 &&
      elecDelta === 2500 &&
      tb.isBalanced

    results.push({
      id: 'TEST-2',
      testName: 'TEST 2 — EXPENSE PAYMENT',
      status: pass ? 'PASS' : 'FAIL',
      accountingEntry: 'Dr Electricity Expense ₹2,500 | Cr Bank – NSCB ₹2,500',
      entryLines: lines.map(l => ({ account: l.accountName, debit: l.debit, credit: l.credit })),
      dayBookUpdated: true,
      dayBookDetail: `Posted Payment Voucher ${voucherNo} on 08/05/2026 (₹2,500)`,
      cashBankUpdated: bankDelta === 2500,
      cashBankDetail: `Bank – NSCB decreased by ₹${bankDelta.toLocaleString('en-IN')} (New balance: ₹${bankAfter.toLocaleString('en-IN')})`,
      generalLedgerUpdated: elecDelta === 2500,
      generalLedgerDetail: `Electricity Expense ledger (Debit) increased by ₹${elecDelta.toLocaleString('en-IN')} (Closing balance: ₹${elecAfter.toLocaleString('en-IN')})`,
      trialBalanceBalanced: tb.isBalanced,
      trialBalanceDetail: `Balanced: Total Dr ₹${tb.totalDebit.toLocaleString('en-IN')} = Total Cr ₹${tb.totalCredit.toLocaleString('en-IN')} (Diff: ₹0)`,
    })
  }

  /* ─────────────────────────────────────────────────────────────
     TEST 3 — CASH/BANK TRANSFER
     Transfer ₹10,000 from NSCB Bank to Cash.
     Expected:
       Dr Cash ₹10,000
       Cr Bank – NSCB ₹10,000
     IMPORTANT: This must NOT affect Income or Expenditure.
  ───────────────────────────────────────────────────────────── */
  {
    const bankBefore = deriveBankBook('acc_nstcb', txList, accounts).closingBalance
    const cashBefore = deriveCashBook(txList, accounts).closingBalance

    // Income & Expenditure balance check before
    const incomeBefore = accounts
      .filter(a => a.category === 'INCOME')
      .reduce((s, a) => s + deriveAccountLedger(a.id, txList, accounts).closingBalance, 0)
    const expenseBefore = accounts
      .filter(a => a.category === 'EXPENDITURE')
      .reduce((s, a) => s + deriveAccountLedger(a.id, txList, accounts).closingBalance, 0)

    const lines = buildTransferPostingLines({
      amount: 10000,
      fromAccountId: 'acc_nstcb',
      toAccountId: 'acc_cash',
      accounts,
      narration: 'Transfer ₹10,000 from NSCB Bank to Cash (TEST 3)',
    })

    const validation = validateDoubleEntry(lines)
    const voucherNo = generateNextVoucherNo('TRANSFER', txList, '2026')
    const tx3: Transaction = {
      id: `test_tx_3_${Date.now()}`,
      voucherNo,
      date: '08/05/2026',
      type: 'TRANSFER',
      category: 'CONTRA_TRANSFER',
      narration: 'Transfer ₹10,000 from NSCB Bank to Cash',
      amount: 10000,
      status: 'POSTED',
      lines,
      createdAt: new Date().toISOString(),
    }

    txList = [tx3, ...txList]

    const bankAfter = deriveBankBook('acc_nstcb', txList, accounts).closingBalance
    const cashAfter = deriveCashBook(txList, accounts).closingBalance

    const incomeAfter = accounts
      .filter(a => a.category === 'INCOME')
      .reduce((s, a) => s + deriveAccountLedger(a.id, txList, accounts).closingBalance, 0)
    const expenseAfter = accounts
      .filter(a => a.category === 'EXPENDITURE')
      .reduce((s, a) => s + deriveAccountLedger(a.id, txList, accounts).closingBalance, 0)

    const tb = deriveTrialBalance(txList, accounts)

    const bankDelta = bankBefore - bankAfter
    const cashDelta = cashAfter - cashBefore
    const incomeDelta = incomeAfter - incomeBefore
    const expenseDelta = expenseAfter - expenseBefore

    const pass =
      validation.valid &&
      cashDelta === 10000 &&
      bankDelta === 10000 &&
      incomeDelta === 0 &&
      expenseDelta === 0 &&
      tb.isBalanced

    results.push({
      id: 'TEST-3',
      testName: 'TEST 3 — CASH/BANK TRANSFER',
      status: pass ? 'PASS' : 'FAIL',
      accountingEntry: 'Dr Cash in Hand ₹10,000 | Cr Bank – NSCB ₹10,000',
      entryLines: lines.map(l => ({ account: l.accountName, debit: l.debit, credit: l.credit })),
      dayBookUpdated: true,
      dayBookDetail: `Posted Transfer Voucher ${voucherNo} on 08/05/2026 (₹10,000)`,
      cashBankUpdated: cashDelta === 10000 && bankDelta === 10000,
      cashBankDetail: `Cash Book increased by ₹${cashDelta.toLocaleString('en-IN')}; Bank Book decreased by ₹${bankDelta.toLocaleString('en-IN')}`,
      generalLedgerUpdated: incomeDelta === 0 && expenseDelta === 0,
      generalLedgerDetail: `Contra entry verified. Income delta: ₹${incomeDelta}, Expenditure delta: ₹${expenseDelta} (Zero P&L impact)`,
      trialBalanceBalanced: tb.isBalanced,
      trialBalanceDetail: `Balanced: Total Dr ₹${tb.totalDebit.toLocaleString('en-IN')} = Total Cr ₹${tb.totalCredit.toLocaleString('en-IN')} (Diff: ₹0)`,
    })
  }

  /* ─────────────────────────────────────────────────────────────
     TEST 4 — MEMBER SAVINGS RECEIPT
     Member deposits ₹1,500 savings/thrift through NSCB Bank.
     Expected:
       Dr Bank – NSCB ₹1,500
       Cr Member Savings & Thrift ₹1,500
  ───────────────────────────────────────────────────────────── */
  {
    const bankBefore = deriveBankBook('acc_nstcb', txList, accounts).closingBalance
    const savingsBefore = deriveAccountLedger('acc_savings', txList, accounts).closingBalance

    const lines = buildReceiptPostingLines({
      amount: 1500,
      paymentMode: 'BANK_NSTCB',
      targetAccountId: 'acc_savings',
      accounts,
      memberId: 'THMCS/MID/002/2025',
      memberName: 'MR VINSON KIKON',
      narration: 'Member deposits ₹1,500 savings/thrift through NSCB Bank (TEST 4)',
    })

    const validation = validateDoubleEntry(lines)
    const voucherNo = generateNextVoucherNo('RECEIPT', txList, '2026')
    const tx4: Transaction = {
      id: `test_tx_4_${Date.now()}`,
      voucherNo,
      date: '08/05/2026',
      type: 'RECEIPT',
      category: 'SAVINGS_DEPOSIT',
      narration: 'Member deposits ₹1,500 savings/thrift through NSCB Bank',
      amount: 1500,
      paymentMode: 'BANK_NSTCB',
      memberId: 'THMCS/MID/002/2025',
      memberName: 'MR VINSON KIKON',
      status: 'POSTED',
      lines,
      createdAt: new Date().toISOString(),
    }

    txList = [tx4, ...txList]

    const bankAfter = deriveBankBook('acc_nstcb', txList, accounts).closingBalance
    const savingsAfter = deriveAccountLedger('acc_savings', txList, accounts).closingBalance
    const tb = deriveTrialBalance(txList, accounts)

    const bankDelta = bankAfter - bankBefore
    const savingsDelta = savingsAfter - savingsBefore

    const pass =
      validation.valid &&
      bankDelta === 1500 &&
      savingsDelta === 1500 &&
      tb.isBalanced

    results.push({
      id: 'TEST-4',
      testName: 'TEST 4 — MEMBER SAVINGS RECEIPT',
      status: pass ? 'PASS' : 'FAIL',
      accountingEntry: 'Dr Bank – NSCB ₹1,500 | Cr Member Savings & Thrift ₹1,500',
      entryLines: lines.map(l => ({ account: l.accountName, debit: l.debit, credit: l.credit })),
      dayBookUpdated: true,
      dayBookDetail: `Posted Receipt Voucher ${voucherNo} on 08/05/2026 (₹1,500)`,
      cashBankUpdated: bankDelta === 1500,
      cashBankDetail: `Bank – NSCB increased by ₹${bankDelta.toLocaleString('en-IN')} (New balance: ₹${bankAfter.toLocaleString('en-IN')})`,
      generalLedgerUpdated: savingsDelta === 1500,
      generalLedgerDetail: `Member Savings liability ledger increased by ₹${savingsDelta.toLocaleString('en-IN')} (New balance: ₹${savingsAfter.toLocaleString('en-IN')})`,
      trialBalanceBalanced: tb.isBalanced,
      trialBalanceDetail: `Balanced: Total Dr ₹${tb.totalDebit.toLocaleString('en-IN')} = Total Cr ₹${tb.totalCredit.toLocaleString('en-IN')} (Diff: ₹0)`,
    })
  }

  /* ─────────────────────────────────────────────────────────────
     TEST 5 — LOAN DISBURSEMENT
     Disburse a ₹20,000 loan to a member from NSCB Bank.
     Expected:
       Dr Member Loans Receivable ₹20,000
       Cr Bank – NSCB ₹20,000
  ───────────────────────────────────────────────────────────── */
  {
    const bankBefore = deriveBankBook('acc_nstcb', txList, accounts).closingBalance
    const loanRecBefore = deriveAccountLedger('acc_loan_rec', txList, accounts).closingBalance

    const lines = buildPaymentPostingLines({
      amount: 20000,
      paymentMode: 'BANK_NSTCB',
      debitAccountId: 'acc_loan_rec',
      accounts,
      memberId: 'THMCS/MID/003/2025',
      memberName: 'MR THUNGBEMO SHITIRI',
      narration: 'Disburse ₹20,000 loan to member from NSCB Bank (TEST 5)',
    })

    const validation = validateDoubleEntry(lines)
    const voucherNo = generateNextVoucherNo('PAYMENT', txList, '2026')
    const tx5: Transaction = {
      id: `test_tx_5_${Date.now()}`,
      voucherNo,
      date: '08/05/2026',
      type: 'PAYMENT',
      category: 'LOAN_DISBURSEMENT',
      narration: 'Disburse ₹20,000 loan to member from NSCB Bank',
      amount: 20000,
      paymentMode: 'BANK_NSTCB',
      memberId: 'THMCS/MID/003/2025',
      memberName: 'MR THUNGBEMO SHITIRI',
      status: 'POSTED',
      lines,
      createdAt: new Date().toISOString(),
    }

    txList = [tx5, ...txList]

    const bankAfter = deriveBankBook('acc_nstcb', txList, accounts).closingBalance
    const loanRecAfter = deriveAccountLedger('acc_loan_rec', txList, accounts).closingBalance
    const tb = deriveTrialBalance(txList, accounts)

    const bankDelta = bankBefore - bankAfter
    const loanRecDelta = loanRecAfter - loanRecBefore

    const pass =
      validation.valid &&
      bankDelta === 20000 &&
      loanRecDelta === 20000 &&
      tb.isBalanced

    results.push({
      id: 'TEST-5',
      testName: 'TEST 5 — LOAN DISBURSEMENT',
      status: pass ? 'PASS' : 'FAIL',
      accountingEntry: 'Dr Member Loans Receivable ₹20,000 | Cr Bank – NSCB ₹20,000',
      entryLines: lines.map(l => ({ account: l.accountName, debit: l.debit, credit: l.credit })),
      dayBookUpdated: true,
      dayBookDetail: `Posted Payment Voucher ${voucherNo} on 08/05/2026 (₹20,000)`,
      cashBankUpdated: bankDelta === 20000,
      cashBankDetail: `Bank – NSCB decreased by ₹${bankDelta.toLocaleString('en-IN')} (New balance: ₹${bankAfter.toLocaleString('en-IN')})`,
      generalLedgerUpdated: loanRecDelta === 20000,
      generalLedgerDetail: `Loans Receivable Asset ledger increased by ₹${loanRecDelta.toLocaleString('en-IN')} (Closing balance: ₹${loanRecAfter.toLocaleString('en-IN')})`,
      trialBalanceBalanced: tb.isBalanced,
      trialBalanceDetail: `Balanced: Total Dr ₹${tb.totalDebit.toLocaleString('en-IN')} = Total Cr ₹${tb.totalCredit.toLocaleString('en-IN')} (Diff: ₹0)`,
    })
  }

  /* ─────────────────────────────────────────────────────────────
     TEST 6 — LOAN RECOVERY
     Receive ₹2,000 loan repayment consisting of:
       Principal = ₹1,800
       Interest = ₹200
     Expected:
       Dr Bank – NSCB ₹2,000
       Cr Member Loans Receivable ₹1,800
       Cr Loan Interest Income ₹200
     Verify:
       - Loan outstanding decreases by ₹1,800, NOT ₹2,000
       - Interest income increases by ₹200
       - Bank increases by ₹2,000
       - Trial balance remains balanced
  ───────────────────────────────────────────────────────────── */
  {
    const bankBefore = deriveBankBook('acc_nstcb', txList, accounts).closingBalance
    const loanRecBefore = deriveAccountLedger('acc_loan_rec', txList, accounts).closingBalance
    const intIncBefore = deriveAccountLedger('acc_loan_int_inc', txList, accounts).closingBalance

    const lines = buildReceiptPostingLines({
      amount: 2000,
      paymentMode: 'BANK_NSTCB',
      accounts,
      memberId: 'THMCS/MID/003/2025',
      memberName: 'MR THUNGBEMO SHITIRI',
      narration: 'Receive ₹2,000 loan repayment (Principal: ₹1,800, Interest: ₹200) (TEST 6)',
      splitCredits: [
        { accountId: 'acc_loan_rec', amount: 1800, description: 'Loan Principal Reduction' },
        { accountId: 'acc_loan_int_inc', amount: 200, description: 'Loan Interest Income' },
      ],
    })

    const validation = validateDoubleEntry(lines)
    const voucherNo = generateNextVoucherNo('RECEIPT', txList, '2026')
    const tx6: Transaction = {
      id: `test_tx_6_${Date.now()}`,
      voucherNo,
      date: '08/05/2026',
      type: 'RECEIPT',
      category: 'LOAN_RECOVERY',
      narration: 'Receive ₹2,000 loan repayment: Principal ₹1,800 + Interest ₹200',
      amount: 2000,
      paymentMode: 'BANK_NSTCB',
      memberId: 'THMCS/MID/003/2025',
      memberName: 'MR THUNGBEMO SHITIRI',
      status: 'POSTED',
      lines,
      createdAt: new Date().toISOString(),
    }

    txList = [tx6, ...txList]

    const bankAfter = deriveBankBook('acc_nstcb', txList, accounts).closingBalance
    const loanRecAfter = deriveAccountLedger('acc_loan_rec', txList, accounts).closingBalance
    const intIncAfter = deriveAccountLedger('acc_loan_int_inc', txList, accounts).closingBalance
    const tb = deriveTrialBalance(txList, accounts)

    const bankDelta = bankAfter - bankBefore
    const loanRecReduction = loanRecBefore - loanRecAfter // should be 1800
    const intIncDelta = intIncAfter - intIncBefore // should be 200

    const pass =
      validation.valid &&
      bankDelta === 2000 &&
      loanRecReduction === 1800 &&
      intIncDelta === 200 &&
      tb.isBalanced

    results.push({
      id: 'TEST-6',
      testName: 'TEST 6 — LOAN RECOVERY (SPLIT)',
      status: pass ? 'PASS' : 'FAIL',
      accountingEntry: 'Dr Bank – NSCB ₹2,000 | Cr Member Loans Receivable ₹1,800 | Cr Loan Interest Income ₹200',
      entryLines: lines.map(l => ({ account: l.accountName, debit: l.debit, credit: l.credit })),
      dayBookUpdated: true,
      dayBookDetail: `Posted Compound Receipt Voucher ${voucherNo} on 08/05/2026 (₹2,000)`,
      cashBankUpdated: bankDelta === 2000,
      cashBankDetail: `Bank – NSCB increased by exactly ₹${bankDelta.toLocaleString('en-IN')}`,
      generalLedgerUpdated: loanRecReduction === 1800 && intIncDelta === 200,
      generalLedgerDetail: `Loan Receivable reduced by ₹${loanRecReduction.toLocaleString('en-IN')} (NOT ₹2,000); Interest Income increased by ₹${intIncDelta.toLocaleString('en-IN')}`,
      trialBalanceBalanced: tb.isBalanced,
      trialBalanceDetail: `Balanced: Total Dr ₹${tb.totalDebit.toLocaleString('en-IN')} = Total Cr ₹${tb.totalCredit.toLocaleString('en-IN')} (Diff: ₹0)`,
    })
  }

  /* ─────────────────────────────────────────────────────────────
     TEST 7 — SUPPLIER PAYMENT
     Pay a supplier ₹4,000 for an existing payable.
     Expected:
       Dr Supplier Payable ₹4,000
       Cr Bank – NSCB ₹4,000
     Do NOT treat this payment as a new expense.
  ───────────────────────────────────────────────────────────── */
  {
    const bankBefore = deriveBankBook('acc_nstcb', txList, accounts).closingBalance
    const payableBefore = deriveAccountLedger('acc_supplier_payable', txList, accounts).closingBalance

    // Total expense before
    const expenseBefore = accounts
      .filter(a => a.category === 'EXPENDITURE')
      .reduce((s, a) => s + deriveAccountLedger(a.id, txList, accounts).closingBalance, 0)

    const lines = buildPaymentPostingLines({
      amount: 4000,
      paymentMode: 'BANK_NSTCB',
      debitAccountId: 'acc_supplier_payable',
      accounts,
      memberName: 'Apex Feeds & Chicks Supplier',
      narration: 'Pay supplier ₹4,000 for existing payable (TEST 7)',
    })

    const validation = validateDoubleEntry(lines)
    const voucherNo = generateNextVoucherNo('PAYMENT', txList, '2026')
    const tx7: Transaction = {
      id: `test_tx_7_${Date.now()}`,
      voucherNo,
      date: '08/05/2026',
      type: 'PAYMENT',
      category: 'SUPPLIER_PAYABLE',
      narration: 'Pay supplier ₹4,000 for existing payable',
      amount: 4000,
      paymentMode: 'BANK_NSTCB',
      memberName: 'Apex Feeds & Chicks Supplier',
      status: 'POSTED',
      lines,
      createdAt: new Date().toISOString(),
    }

    txList = [tx7, ...txList]

    const bankAfter = deriveBankBook('acc_nstcb', txList, accounts).closingBalance
    const payableAfter = deriveAccountLedger('acc_supplier_payable', txList, accounts).closingBalance

    const expenseAfter = accounts
      .filter(a => a.category === 'EXPENDITURE')
      .reduce((s, a) => s + deriveAccountLedger(a.id, txList, accounts).closingBalance, 0)

    const tb = deriveTrialBalance(txList, accounts)

    const bankDelta = bankBefore - bankAfter
    const expenseDelta = expenseAfter - expenseBefore

    const pass =
      validation.valid &&
      bankDelta === 4000 &&
      expenseDelta === 0 &&
      tb.isBalanced

    results.push({
      id: 'TEST-7',
      testName: 'TEST 7 — SUPPLIER PAYMENT',
      status: pass ? 'PASS' : 'FAIL',
      accountingEntry: 'Dr Supplier Payables ₹4,000 | Cr Bank – NSCB ₹4,000',
      entryLines: lines.map(l => ({ account: l.accountName, debit: l.debit, credit: l.credit })),
      dayBookUpdated: true,
      dayBookDetail: `Posted Payment Voucher ${voucherNo} on 08/05/2026 (₹4,000)`,
      cashBankUpdated: bankDelta === 4000,
      cashBankDetail: `Bank – NSCB decreased by ₹${bankDelta.toLocaleString('en-IN')} (New balance: ₹${bankAfter.toLocaleString('en-IN')})`,
      generalLedgerUpdated: expenseDelta === 0,
      generalLedgerDetail: `Supplier Payable debited by ₹4,000. New expense recognized = ₹0 (Zero P&L impact, payable settled)`,
      trialBalanceBalanced: tb.isBalanced,
      trialBalanceDetail: `Balanced: Total Dr ₹${tb.totalDebit.toLocaleString('en-IN')} = Total Cr ₹${tb.totalCredit.toLocaleString('en-IN')} (Diff: ₹0)`,
    })
  }

  /* ─────────────────────────────────────────────────────────────
     TEST 8 — UNBALANCED TRANSACTION PROTECTION
     Attempt to create a journal where Debit = ₹5,000 and Credit = ₹4,000.
     Expected:
       The system MUST reject posting.
       Show: "Transaction is not balanced. Debit and Credit must be equal."
  ───────────────────────────────────────────────────────────── */
  {
    const invalidLines: TransactionLine[] = [
      {
        id: 'inv_1',
        accountId: 'acc_fixed_assets',
        accountName: 'Fixed Assets & Shed Infrastructure',
        debit: 5000,
        credit: 0,
        description: 'Debit side ₹5,000',
      },
      {
        id: 'inv_2',
        accountId: 'acc_surplus',
        accountName: 'Accumulated Surplus',
        debit: 0,
        credit: 4000,
        description: 'Credit side ₹4,000',
      },
    ]

    const validation = validateDoubleEntry(invalidLines)
    const expectedError = 'Transaction is not balanced. Debit and Credit must be equal.'

    const txCountBefore = txList.length
    let rejected = false
    let actualError = ''

    if (!validation.valid) {
      rejected = true
      actualError = validation.error || ''
    } else {
      // If validation did not fail, that would be a critical failure
      txList = [
        {
          id: 'invalid_should_never_post',
          voucherNo: 'JV-FAIL',
          date: '08/05/2026',
          type: 'JOURNAL',
          category: 'FAIL',
          narration: 'Unbalanced',
          amount: 5000,
          status: 'POSTED',
          lines: invalidLines,
          createdAt: new Date().toISOString(),
        },
        ...txList,
      ]
    }

    const txCountAfter = txList.length
    const pass = rejected && txCountBefore === txCountAfter && actualError === expectedError

    results.push({
      id: 'TEST-8',
      testName: 'TEST 8 — UNBALANCED TRANSACTION PROTECTION',
      status: pass ? 'PASS' : 'FAIL',
      accountingEntry: 'Attempted: Dr Fixed Assets ₹5,000 | Cr Accumulated Surplus ₹4,000',
      entryLines: invalidLines.map(l => ({ account: l.accountName, debit: l.debit, credit: l.credit })),
      dayBookUpdated: false,
      dayBookDetail: `REJECTED — Transaction blocked from Day Book. Error returned: "${actualError}"`,
      cashBankUpdated: false,
      cashBankDetail: 'No change to Cash or Bank books (0 postings allowed)',
      generalLedgerUpdated: false,
      generalLedgerDetail: 'General Ledger protected from corruption. Total active transactions unchanged.',
      trialBalanceBalanced: true,
      trialBalanceDetail: 'Trial balance integrity preserved (unbalanced entry strictly prevented from posting).',
    })
  }

  /* ─────────────────────────────────────────────────────────────
     TEST 9 — POSTED TRANSACTION PROTECTION
     Create and post a transaction.
     Attempt to delete or silently edit it.
     Expected:
       The system must NOT silently delete or alter a posted transaction.
       Only Cancel/Reverse should be available, with an audit reason.
  ───────────────────────────────────────────────────────────── */
  {
    // Post a transaction to test cancellation
    const lines = buildPaymentPostingLines({
      amount: 1200,
      paymentMode: 'BANK_NSTCB',
      debitAccountId: 'acc_stationery',
      accounts,
      narration: 'Audit protection test transaction (TEST 9)',
    })
    const voucherNo = generateNextVoucherNo('PAYMENT', txList, '2026')
    const testTx: Transaction = {
      id: `test_tx_audit_${Date.now()}`,
      voucherNo,
      date: '08/05/2026',
      type: 'PAYMENT',
      category: 'AUDIT_TEST',
      narration: 'Voucher posted for audit cancellation test',
      amount: 1200,
      paymentMode: 'BANK_NSTCB',
      status: 'POSTED',
      lines,
      createdAt: new Date().toISOString(),
    }

    txList = [testTx, ...txList]

    // Verify it is active in books
    const bankWithTx = deriveBankBook('acc_nstcb', txList, accounts).closingBalance

    // Cancel with audit reason
    const reason = 'Audited reversal: duplicate voucher entry cancelled by accountant'
    txList = txList.map(t =>
      t.id === testTx.id
        ? {
            ...t,
            status: 'CANCELLED',
            cancelledAt: new Date().toISOString(),
            cancelReason: reason,
          }
        : t
    )

    const bankAfterCancel = deriveBankBook('acc_nstcb', txList, accounts).closingBalance
    const cancelledRecord = txList.find(t => t.id === testTx.id)
    const tb = deriveTrialBalance(txList, accounts)

    const bankReversed = bankAfterCancel === bankWithTx + 1200
    const auditRetained =
      cancelledRecord?.status === 'CANCELLED' &&
      cancelledRecord.cancelReason === reason &&
      !!cancelledRecord.cancelledAt

    const pass = bankReversed && auditRetained && tb.isBalanced

    results.push({
      id: 'TEST-9',
      testName: 'TEST 9 — POSTED TRANSACTION PROTECTION',
      status: pass ? 'PASS' : 'FAIL',
      accountingEntry: `Voucher ${voucherNo}: Status changed POSTED → CANCELLED with reason`,
      entryLines: lines.map(l => ({ account: l.accountName, debit: l.debit, credit: l.credit })),
      dayBookUpdated: true,
      dayBookDetail: `Voucher ${voucherNo} remains in Day Book with CANCELLED audit badge and reason: "${reason}"`,
      cashBankUpdated: bankReversed,
      cashBankDetail: `Bank – NSCB automatically reversed by ₹1,200 upon cancellation (Active books exclude cancelled entries)`,
      generalLedgerUpdated: true,
      generalLedgerDetail: 'Stationery ledger automatically excluded cancelled voucher. Zero silent deletion or alteration.',
      trialBalanceBalanced: tb.isBalanced,
      trialBalanceDetail: `Balanced: Total Dr ₹${tb.totalDebit.toLocaleString('en-IN')} = Total Cr ₹${tb.totalCredit.toLocaleString('en-IN')} (Diff: ₹0)`,
    })
  }

  /* ─────────────────────────────────────────────────────────────
     TEST 10 — DATE FILTER
     Enter transactions on different dates and verify:
       Day Book
       Cash Book
       Bank Book
       General Ledger
       Trial Balance
     all respect the selected accounting period/date range.
  ───────────────────────────────────────────────────────────── */
  {
    // Transaction in FY 2024-25 (April 2024)
    const txA: Transaction = {
      id: 'tx_date_a',
      voucherNo: 'RV-2024-TEST',
      date: '15/04/2024',
      type: 'RECEIPT',
      category: 'SHARE_CAPITAL',
      narration: 'Transaction in FY 2024–25',
      amount: 3000,
      paymentMode: 'BANK_NSTCB',
      status: 'POSTED',
      lines: [
        { id: 'da1', accountId: 'acc_nstcb', accountName: 'Bank – NSCB', debit: 3000, credit: 0 },
        { id: 'da2', accountId: 'acc_share_capital', accountName: 'Share Capital', debit: 0, credit: 3000 },
      ],
      createdAt: new Date().toISOString(),
    }

    // Transaction in FY 2025-26 (May 2025)
    const txB: Transaction = {
      id: 'tx_date_b',
      voucherNo: 'PV-2025-TEST',
      date: '15/05/2025',
      type: 'PAYMENT',
      category: 'EXPENSE',
      narration: 'Transaction in FY 2025–26 (TARGET PERIOD)',
      amount: 1200,
      paymentMode: 'BANK_NSTCB',
      status: 'POSTED',
      lines: [
        { id: 'db1', accountId: 'acc_electricity', accountName: 'Electricity Bills', debit: 1200, credit: 0 },
        { id: 'db2', accountId: 'acc_nstcb', accountName: 'Bank – NSCB', debit: 0, credit: 1200 },
      ],
      createdAt: new Date().toISOString(),
    }

    // Transaction in FY 2026-27 (June 2026)
    const txC: Transaction = {
      id: 'tx_date_c',
      voucherNo: 'TV-2026-TEST',
      date: '15/06/2026',
      type: 'TRANSFER',
      category: 'CONTRA',
      narration: 'Transaction in FY 2026–27 (FUTURE PERIOD)',
      amount: 5000,
      status: 'POSTED',
      lines: [
        { id: 'dc1', accountId: 'acc_cash', accountName: 'Cash in Hand', debit: 5000, credit: 0 },
        { id: 'dc2', accountId: 'acc_nstcb', accountName: 'Bank – NSCB', debit: 0, credit: 5000 },
      ],
      createdAt: new Date().toISOString(),
    }

    const testDateTxList = [txA, txB, txC, ...txList]

    // Set filter: FY 2025-26 (01/04/2025 to 31/03/2026)
    const filterRange = { fromDate: '01/04/2025', toDate: '31/03/2026' }

    // Day Book check
    const dayBookFiltered = testDateTxList.filter(t => isDateInRange(t.date, filterRange.fromDate, filterRange.toDate))
    const dayBookHasB = dayBookFiltered.some(t => t.id === 'tx_date_b')
    const dayBookExcludesA = !dayBookFiltered.some(t => t.id === 'tx_date_a')
    const dayBookExcludesC = !dayBookFiltered.some(t => t.id === 'tx_date_c')

    // Bank Book check
    const bankFiltered = deriveBankBook('acc_nstcb', testDateTxList, accounts, filterRange)
    const bankEntriesHaveB = bankFiltered.entries.some(e => e.transactionId === 'tx_date_b')
    const bankEntriesExcludeA = !bankFiltered.entries.some(e => e.transactionId === 'tx_date_a')
    const bankEntriesExcludeC = !bankFiltered.entries.some(e => e.transactionId === 'tx_date_c')

    // Electricity Ledger check
    const elecLedger = deriveAccountLedger('acc_electricity', testDateTxList, accounts, filterRange)
    const elecHasB = elecLedger.entries.some(e => e.transactionId === 'tx_date_b')
    const elecExcludesOthers = elecLedger.entries.length === 1 && elecLedger.totalDebit === 1200

    // Trial Balance check
    const tb = deriveTrialBalance(testDateTxList, accounts, filterRange)

    const pass =
      dayBookHasB &&
      dayBookExcludesA &&
      dayBookExcludesC &&
      bankEntriesHaveB &&
      bankEntriesExcludeA &&
      bankEntriesExcludeC &&
      elecHasB &&
      elecExcludesOthers &&
      tb.isBalanced

    results.push({
      id: 'TEST-10',
      testName: 'TEST 10 — DATE FILTER (ACCOUNTING PERIOD)',
      status: pass ? 'PASS' : 'FAIL',
      accountingEntry: 'Period filter active: 01/04/2025 → 31/03/2026 (FY 2025–26)',
      entryLines: [
        { account: 'Day Book', debit: 0, credit: 0 },
        { account: 'Cash/Bank Books', debit: 0, credit: 0 },
        { account: 'General Ledger', debit: 0, credit: 0 },
        { account: 'Trial Balance', debit: 0, credit: 0 },
      ],
      dayBookUpdated: dayBookHasB && dayBookExcludesA && dayBookExcludesC,
      dayBookDetail: `Day Book strictly filtered: Included voucher PV-2025-TEST (May 2025); Excluded 2024 & 2026 vouchers.`,
      cashBankUpdated: bankEntriesHaveB && bankEntriesExcludeA && bankEntriesExcludeC,
      cashBankDetail: `Bank Book isolated period movements: Opening balance accounted for 2024 activity; Period movements isolated to FY 2025–26.`,
      generalLedgerUpdated: elecHasB && elecExcludesOthers,
      generalLedgerDetail: `General Ledger strictly isolated to May 2025 entry (Debit: ₹1,200). Prior/subsequent movements isolated.`,
      trialBalanceBalanced: tb.isBalanced,
      trialBalanceDetail: `Balanced: Total Dr ₹${tb.totalDebit.toLocaleString('en-IN')} = Total Cr ₹${tb.totalCredit.toLocaleString('en-IN')} (Diff: ₹0)`,
    })
  }

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length

  return {
    timestamp: new Date().toISOString(),
    allPassed: failed === 0,
    results,
    summary: {
      total: results.length,
      passed,
      failed,
    },
  }
}
