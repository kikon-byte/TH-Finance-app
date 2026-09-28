/* ── Types for Phase 2: Historical Data Migration & Validation ── */

export type MigrationClassification =
  | 'SHARE_CAPITAL'
  | 'MEMBERSHIP_FEE'
  | 'SALES'
  | 'PROCUREMENT'
  | 'RAW_MATERIAL'
  | 'LABOUR'
  | 'PRINTING_PACKAGING'
  | 'ADMINISTRATION'
  | 'MEETING_BOD'
  | 'REGISTRATION_GOV'
  | 'AUDIT'
  | 'NSCU_STATUTORY'
  | 'PROJECT_EXPENDITURE'
  | 'OTHER_EXPENDITURE'
  | 'OTHER_RECEIPT'
  | 'UNKNOWN'

export type MigrationPaymentMode =
  | 'CASH'
  | 'NSCB'
  | 'SBI'
  | 'OTHER_BANK'
  | 'UPI_ONLINE'
  | 'UNKNOWN'

export type MigrationRowStatus =
  | 'IMPORTED'
  | 'MAPPED'
  | 'NEEDS_REVIEW'
  | 'RECONCILIATION_ERROR'
  | 'APPROVED'
  | 'POSTED'

export interface HistoricalSourceRow {
  id: string
  slno: number
  sourceDocument: string
  sourcePage: number
  sourceRowNumber: number
  sourceDate: string
  sourceParticular: string
  sourceReceipt: number | null
  sourcePayment: number | null
  sourceAmount: number
  
  /* Accounting mappings */
  classification: MigrationClassification
  accountId: string | null
  accountName: string | null
  accountCode: string | null
  
  /* Payment mode resolution (Part 7: UNKNOWN if unstated in source) */
  paymentMode: MigrationPaymentMode
  
  /* Member allocation (Part 8 & 9: UNALLOCATED_HISTORICAL if not in source) */
  memberId: string | null
  memberName: string | null
  
  /* Project tagging (Part 27: BASTENGA_PRODUCTION or UNALLOCATED) */
  projectId: string | null
  projectName: string | null
  
  /* Stock protection (Part 26: no artificial quantity invented) */
  stockItem: string | null
  
  /* Migration control */
  status: MigrationRowStatus
  reviewNotes: string[]
  dateWarning?: boolean
  paymentModeWarning?: boolean
  discrepancyNote?: string
  
  migrationBatchId: string
  approvedAt?: string
  approvedBy?: string
  postedVoucherNo?: string
  postedAt?: string
  
  /* Optional date correction approved by accountant */
  correctedDate?: string
}

export interface HistoricalReconciliationSummary {
  totalSourceRows: number
  importedCount: number
  mappedCount: number
  needsReviewCount: number
  approvedCount: number
  postedCount: number
  errorCount: number
  
  sourceStatedReceipts: number
  calculatedReceipts: number
  receiptsDifference: number
  
  sourceStatedPayments: number
  calculatedPayments: number
  paymentsDifference: number
  
  sourceStatedClosingBalance: number
  calculatedClosingBalance: number
  closingBalanceDifference: number
  
  totalPostedDebit: number
  totalPostedCredit: number
  trialBalanceBalanced: boolean
  trialBalanceDifference: number
}
