import {
  rawHistoricalRows,
  getInitialMigrationRows,
  computeReconciliationSummary,
  isRowValidForApproval,
  buildTransactionFromApprovedRow,
  SOURCE_DOCUMENT_NAME,
  MIGRATION_BATCH_ID,
  SOURCE_STATED_TOTALS,
} from './src/services/historicalMigrationService'
import { defaultAccounts, type Transaction } from './src/types/accounting'

console.log('========================================================================')
console.log('TRIBAL HARVEST CO-OPERATIVE MULTIPURPOSE SOCIETY LTD.')
console.log('PHASE 2 ACCEPTANCE TEST: HISTORICAL DATA MIGRATION & VALIDATION')
console.log('========================================================================\n')

// 1. Part 2 & Part 3: Source Preservation Check
console.log('--- TEST 1: SOURCE DOCUMENT PRESERVATION & METADATA ---')
const rows = getInitialMigrationRows()
console.log(`Total Source Rows: ${rows.length} (Expected: 49)`)
if (rows.length !== 49) throw new Error(`Expected 49 rows, got ${rows.length}`)

const firstRow = rows[0]
console.log(`Row 1 Particular: "${firstRow.sourceParticular}" | Receipt: ₹${firstRow.sourceReceipt} | Doc: "${firstRow.sourceDocument}"`)
if (firstRow.sourceDocument !== SOURCE_DOCUMENT_NAME) throw new Error('Source document name mismatch')
if (firstRow.migrationBatchId !== MIGRATION_BATCH_ID) throw new Error('Migration batch ID mismatch')
if (firstRow.sourceAmount !== 105000) throw new Error('Row 1 amount mismatch')

// 2. Part 8 & 9: Special Treatment of Share Capital & Membership Fees
console.log('\n--- TEST 2: SHARE CAPITAL & MEMBERSHIP FEE CLASSIFICATION ---')
const row1 = rows.find(r => r.slno === 1)!
const row2 = rows.find(r => r.slno === 2)!
console.log(`Row 1 (Share Capital): Class=${row1.classification}, Member=${row1.memberId}`)
console.log(`Row 2 (Membership Fee): Class=${row2.classification}, Member=${row2.memberId}`)
if (row1.classification !== 'SHARE_CAPITAL' || row1.memberId !== 'UNALLOCATED_HISTORICAL') {
  throw new Error('Row 1 must be SHARE_CAPITAL and UNALLOCATED_HISTORICAL per Part 8')
}
if (row2.classification !== 'MEMBERSHIP_FEE' || row2.memberId !== 'UNALLOCATED_HISTORICAL') {
  throw new Error('Row 2 must be MEMBERSHIP_FEE and UNALLOCATED_HISTORICAL per Part 9')
}

// 3. Part 10: Individual Bastenga Sales Traceability
console.log('\n--- TEST 3: BASTENGA SALES PRESERVATION (NO COMBINING) ---')
const salesRows = rows.filter(r => r.classification === 'SALES')
console.log(`Found ${salesRows.length} individual Bastenga sales entries (Expected: 7)`)
const expectedSalesPktAmounts = [2050, 2733, 5466, 8200, 3416, 2733, 2733]
salesRows.forEach((r, idx) => {
  console.log(`  Sale ${idx + 1}: ${r.sourceDate} — ${r.sourceParticular} — ₹${r.sourceReceipt}`)
  if (r.sourceReceipt !== expectedSalesPktAmounts[idx]) {
    throw new Error(`Sale row ${r.slno} amount mismatch. Expected ${expectedSalesPktAmounts[idx]}, got ${r.sourceReceipt}`)
  }
})

// 4. Part 13 & Part 14: Historical Reconciliation & Payment Discrepancy
console.log('\n--- TEST 4: SOURCE-STATED VS CALCULATED RECONCILIATION ---')
const dummyTxs: Transaction[] = []
const summary = computeReconciliationSummary(rows, dummyTxs)
console.log(`Receipts: Source=₹${summary.sourceStatedReceipts} | Calc=₹${summary.calculatedReceipts} | Diff=₹${summary.receiptsDifference}`)
console.log(`Payments: Source=₹${summary.sourceStatedPayments} | Calc=₹${summary.calculatedPayments} | Diff=₹${summary.paymentsDifference}`)
console.log(`Closing Balance: Source=₹${summary.sourceStatedClosingBalance} | Calc=₹${summary.calculatedClosingBalance} | Diff=₹${summary.closingBalanceDifference}`)

if (summary.receiptsDifference !== 0) throw new Error('Receipts difference must be 0')
if (summary.paymentsDifference !== 19732) {
  throw new Error(`Expected payments discrepancy of exactly ₹19,732 (Part 14), got ${summary.paymentsDifference}`)
}
console.log('✓ Part 14 Payment Total Discrepancy (₹19,732.00) correctly detected and preserved without silent correction!')

// 5. Part 15: Date Validation
console.log('\n--- TEST 5: DATE VALIDATION ALERT (ROW 4: 04-05-2026) ---')
const row4 = rows.find(r => r.slno === 4)!
console.log(`Row 4 Date: "${row4.sourceDate}" | Date Warning: ${row4.dateWarning}`)
if (!row4.dateWarning) throw new Error('Row 4 must have dateWarning=true per Part 15')

// 6. Part 19: Strict Approval Safety Rules
console.log('\n--- TEST 6: APPROVAL SAFETY VALIDATION ---')
const checkRow1 = isRowValidForApproval(row1)
console.log(`Row 1 Approval Check: valid=${checkRow1.valid}, reason="${checkRow1.reason}"`)
if (checkRow1.valid) throw new Error('Row 1 cannot be approved while paymentMode is UNKNOWN')

const checkRow4 = isRowValidForApproval(row4)
console.log(`Row 4 Approval Check: valid=${checkRow4.valid}, reason="${checkRow4.reason}"`)
if (checkRow4.valid) throw new Error('Row 4 cannot be approved while date is unreviewed')

// Resolve payment mode and test approval
const resolvedRow9 = rows.find(r => r.slno === 9)!
const checkRow9 = isRowValidForApproval(resolvedRow9)
console.log(`Row 9 (FSSAI online) Check: valid=${checkRow9.valid}`)
if (!checkRow9.valid) throw new Error('Row 9 should be valid for approval since paymentMode is UPI_ONLINE')

// 7. Part 20: Double-Entry Posting of Approved Row
console.log('\n--- TEST 7: DOUBLE-ENTRY TRANSACTION GENERATION ---')
const approvedRow9 = { ...resolvedRow9, status: 'APPROVED' as const }
const generatedTx = buildTransactionFromApprovedRow(approvedRow9, [], defaultAccounts)
console.log(`Generated Voucher: ${generatedTx.voucherNo} | Amount: ₹${generatedTx.amount} | Type: ${generatedTx.type}`)
console.log(`Lines count: ${generatedTx.lines.length}`)
generatedTx.lines.forEach(l => {
  console.log(`  ${l.debit > 0 ? 'Dr' : 'Cr'} ${l.accountName} (${l.accountId}): ₹${l.debit || l.credit}`)
})
const totalDr = generatedTx.lines.reduce((s, l) => s + l.debit, 0)
const totalCr = generatedTx.lines.reduce((s, l) => s + l.credit, 0)
if (totalDr !== totalCr || totalDr !== 3400) throw new Error('Generated transaction double entry does not balance!')
if (generatedTx.migrationBatchId !== MIGRATION_BATCH_ID) throw new Error('Missing migrationBatchId')
if (generatedTx.sourceRowNumber !== 9) throw new Error('Missing sourceRowNumber')

console.log('\n========================================================================')
console.log('ALL PHASE 2 ACCEPTANCE TESTS PASSED WITH 100% COMPLIANCE')
console.log('========================================================================')
