/* ── Central Accounting Architecture & Model ───────────────────── */

export type AccountCategory =
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY'
  | 'INCOME'
  | 'EXPENDITURE'

export type Account = {
  id: string
  code: string
  name: string
  category: AccountCategory
  description?: string
  isBankOrCash?: boolean
  bankType?: 'CASH' | 'NSTCB' | 'SBI' | 'OTHER'
  openingBalance: number // positive = normal balance (Debit for Asset/Expense, Credit for Liab/Equity/Income)
}

export type PaymentMode = 'CASH' | 'BANK_NSTCB' | 'BANK_SBI' | 'UPI_ONLINE' | 'OTHER_BANK' | 'UNKNOWN'

export type TransactionType = 'RECEIPT' | 'PAYMENT' | 'TRANSFER' | 'JOURNAL'

export type TransactionStatus = 'POSTED' | 'CANCELLED'

export type TransactionLine = {
  id: string
  accountId: string
  accountName: string
  debit: number
  credit: number
  memberId?: string
  memberName?: string
  projectId?: string
  projectName?: string
  description?: string
}

export type Transaction = {
  id: string
  slno?: number
  voucherNo: string
  date: string // DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD
  type: TransactionType
  category: string
  narration: string
  amount: number
  paymentMode?: PaymentMode | string
  memberId?: string
  memberName?: string
  projectId?: string
  projectName?: string
  referenceNo?: string
  status: TransactionStatus
  lines: TransactionLine[]
  createdAt: string
  cancelledAt?: string
  cancelReason?: string
  testBatchId?: string
  migrationBatchId?: string
  sourceDocument?: string
  sourceRowNumber?: number
}

/* ── Standard Chart of Accounts for THMCS ──────────────────────── */
export const defaultAccounts: Account[] = [
  // ASSETS (1000s) — Clean baseline: ₹0 Opening
  { id: 'acc_cash', code: '1010', name: 'Cash in Hand', category: 'ASSET', isBankOrCash: true, bankType: 'CASH', openingBalance: 0 },
  { id: 'acc_nstcb', code: '1020', name: 'Bank – NSCB (Nagaland State Co-op Bank)', category: 'ASSET', isBankOrCash: true, bankType: 'NSTCB', openingBalance: 0 },
  { id: 'acc_sbi', code: '1030', name: 'Bank – State Bank of India', category: 'ASSET', isBankOrCash: true, bankType: 'SBI', openingBalance: 0 },
  { id: 'acc_loan_rec', code: '1040', name: 'Member Loans Receivable', category: 'ASSET', openingBalance: 0 },
  { id: 'acc_inv_raw', code: '1050', name: 'Inventory – Raw Materials / Feeds', category: 'ASSET', openingBalance: 0 },
  { id: 'acc_inv_livestock', code: '1060', name: 'Livestock Assets (Piggery & Poultry)', category: 'ASSET', openingBalance: 0 },
  { id: 'acc_fixed_assets', code: '1070', name: 'Fixed Assets & Shed Infrastructure', category: 'ASSET', openingBalance: 0 },

  // LIABILITIES (2000s) — Total Opening Credit: ₹0
  { id: 'acc_savings', code: '2010', name: 'Member Savings & Thrift Deposit', category: 'LIABILITY', openingBalance: 0 },
  { id: 'acc_temp_loan', code: '2020', name: 'Temporary Loan from Members', category: 'LIABILITY', openingBalance: 0 },
  { id: 'acc_supplier_payable', code: '2030', name: 'Supplier Payables', category: 'LIABILITY', openingBalance: 0 },

  // EQUITY / SOCIETY FUNDS (3000s) — Total Opening Credit: ₹0
  { id: 'acc_share_capital', code: '3010', name: 'Share Capital', category: 'EQUITY', openingBalance: 0 },
  { id: 'acc_reserve_fund', code: '3020', name: 'Reserve Fund', category: 'EQUITY', openingBalance: 0 },
  { id: 'acc_surplus', code: '3030', name: 'Accumulated Surplus', category: 'EQUITY', openingBalance: 0 },

  // INCOME (4000s)
  { id: 'acc_sales', code: '4010', name: 'Bastenga & Produce Sales', category: 'INCOME', openingBalance: 0 },
  { id: 'acc_adm_fee', code: '4020', name: 'Membership / Admission Fees', category: 'INCOME', openingBalance: 0 },
  { id: 'acc_loan_int_inc', code: '4030', name: 'Loan Interest Income', category: 'INCOME', openingBalance: 0 },
  { id: 'acc_bank_int_inc', code: '4040', name: 'Bank Interest Received', category: 'INCOME', openingBalance: 0 },
  { id: 'acc_other_inc', code: '4050', name: 'Miscellaneous Income', category: 'INCOME', openingBalance: 0 },

  // EXPENDITURE (5000s)
  { id: 'acc_procurement', code: '5010', name: 'Purchase of Chicks, Piglets & Feeds', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_raw_materials', code: '5012', name: 'Raw Materials Purchase (Bastenga Bamboo Shoots)', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_procurement_supplies', code: '5015', name: 'Processing Purchases & Supplies (Swiss, Restokart, Aumni)', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_salary', code: '5020', name: 'Salary to Attendants & Staff', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_admin_office', code: '5025', name: 'Admin and Office (Seal & Pad)', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_wages_labour', code: '5030', name: 'Labour & Operating Expenses / Cost', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_rent_doc', code: '5035', name: 'Sale Deed House Rent Agreement & Documentation', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_carriage', code: '5040', name: 'Carriage & Freight Charge', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_packaging', code: '5045', name: 'Printing & Packaging', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_electricity', code: '5050', name: 'Electricity Bills', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_travel', code: '5060', name: 'Travelling & Conveyance Expenses', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_meeting', code: '5070', name: 'Meeting & BOD Expenses', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_event_exp', code: '5075', name: 'Bastenga Launch & Anniversary Celebration', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_stationery', code: '5080', name: 'Printing & Stationery (Typing, Register, Cash Memo)', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_audit_fee', code: '5090', name: 'Audit & NSCU Affiliation Fees', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_reg_fee', code: '5095', name: 'FSSAI Registration Paid Online', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_project_exp', code: '5100', name: 'Project Shed Construction Expenses', category: 'EXPENDITURE', openingBalance: 0 },
  { id: 'acc_misc_exp', code: '5110', name: 'Miscellaneous Expenses', category: 'EXPENDITURE', openingBalance: 0 },
]

/* ── Ledger Entry View (Derived) ───────────────────────────────── */
export type LedgerEntry = {
  date: string
  voucherNo: string
  transactionId: string
  type: TransactionType
  narration: string
  debit: number
  credit: number
  runningBalance: number
  oppositeAccountName: string
}

/* ── Trial Balance Line (Derived) ──────────────────────────────── */
export type TrialBalanceLine = {
  accountId: string
  accountCode: string
  accountName: string
  category: AccountCategory
  openingDebit: number
  openingCredit: number
  periodDebit: number
  periodCredit: number
  closingDebit: number
  closingCredit: number
}
