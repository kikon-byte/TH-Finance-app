import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

/* ── Project entry (shared with DayBook) ────────────────────── */
export type ProjectEntry = {
  id: string
  slno: number
  date: string
  projectName: string
  receipt: number | null
  payment: number | null
  source: 'project'
}

/* ── Member Type (from Revised Membership Register 2026) ───── */
export type Gender = 'Male' | 'Female' | 'Other'
export type MemberStatus = 'Active' | 'Inactive' | 'Suspended'

export type Member = {
  id: string
  slno: number
  memberId: string
  name: string
  fatherName: string
  phone: string
  dateOfAdmission: string
  dateOfBirth?: string
  spouse?: string
  gender: Gender
  address: string
  nominee?: string
  aadharNo?: string
  admissionFee: number
  signatureType: 'Signature' | 'Thumb Impression'
  status: MemberStatus
  shares: number
  amountPaid?: number
  receiptNo: string
  certificateNo: string
  shareBookNo?: string
  nstcbDepositAmount?: number
  nstcbDepositDate?: string
  totalAmountDeposit?: number
  remarks?: string
  outstandingLoan?: number
}

/* ── Shareholder / Share Ledger Entry Type with NStCB Banking ── */
export type ShareEntry = {
  id: string
  slno: number
  memberId: string
  name: string
  fatherName?: string
  phone?: string
  address?: string
  date: string
  shareBookNo: string         // No. of Share Book / Folio
  noShares: number            // Actual shares allotted
  valuePerShare: number       // Value per share (default ₹1,000)
  amountWithheld: number      // Capital withheld
  amountWithdrawn: number     // Withdrawals
  balance: number             // Net balance
  period: string              // Period (e.g. '2025', '2026')
  receiptNo: string           // Receipt No.
  certificateNo: string       // Certificate No.
  nstcbDepositAmount: number  // Amount deposit at NStCB
  nstcbDepositDate: string    // Date of deposit at NStCB
  nstcbChallanNo?: string     // NStCB Challan / Scroll No.
  totalAmountDeposit: number  // Total amount deposit
  sharesEntitled: number      // Total share entitle as per share money deposit @1000
  remarks?: string
}

/* ── Seed Data from THMCS Revised Membership Register 2026 ── */
export const defaultMembers: Member[] = [
  {
    id: 'm1', slno: 1, memberId: 'THMCS/MID/001/2025', name: 'MS AKUMNARO SUYA',
    fatherName: 'LATE I. TOSHI', phone: '9862143210', dateOfAdmission: '01/04/2025', dateOfBirth: '15/05/1984',
    spouse: '', gender: 'Female', address: 'Chümoukedima Town, Ward 4, Nagaland', nominee: 'Toshi Suya',
    aadharNo: '7823 4561 9012', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 10, amountPaid: 10000, receiptNo: 'THMCS/REC/001/2025', certificateNo: 'THMCS/SC/001/2025',
    shareBookNo: 'SB-001', nstcbDepositAmount: 10000, nstcbDepositDate: '01/04/2025', totalAmountDeposit: 10000,
    remarks: '', outstandingLoan: 0
  },
  {
    id: 'm2', slno: 2, memberId: 'THMCS/MID/002/2025', name: 'MR VINSON KIKON',
    fatherName: 'R.K LOTHA', phone: '9436021876', dateOfAdmission: '01/04/2025', dateOfBirth: '20/11/1980',
    spouse: 'Mary Kikon', gender: 'Male', address: 'Chümoukedima Town, Ward 1, Nagaland', nominee: 'Mary Kikon',
    aadharNo: '4532 9812 6543', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 10, amountPaid: 10000, receiptNo: 'THMCS/REC/002/2025', certificateNo: 'THMCS/SC/002/2025',
    shareBookNo: 'SB-002', nstcbDepositAmount: 10000, nstcbDepositDate: '01/04/2025', totalAmountDeposit: 10000,
    remarks: '', outstandingLoan: 0
  },
  {
    id: 'm3', slno: 3, memberId: 'THMCS/MID/003/2025', name: 'MR THUNGBEMO SHITIRI',
    fatherName: 'LATE YANRENTHUNG SHITIRI', phone: '9856123489', dateOfAdmission: '01/04/2025', dateOfBirth: '08/09/1978',
    spouse: 'Grace Shitiri', gender: 'Male', address: 'Chümoukedima Town, Ward 2, Nagaland', nominee: 'Grace Shitiri',
    aadharNo: '8912 3456 7812', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 10, amountPaid: 10000, receiptNo: 'THMCS/REC/003/2025', certificateNo: 'THMCS/SC/003/2025',
    shareBookNo: 'SB-003', nstcbDepositAmount: 10000, nstcbDepositDate: '01/04/2025', totalAmountDeposit: 10000,
    remarks: '', outstandingLoan: 0
  },
  {
    id: 'm4', slno: 4, memberId: 'THMCS/MID/004/2025', name: 'MS LILY KIKON',
    fatherName: 'RAMONGO KIKON', phone: '9612345678', dateOfAdmission: '01/04/2025', dateOfBirth: '14/02/1988',
    spouse: '', gender: 'Female', address: 'Chümoukedima Town, Nagaland', nominee: 'Ramongo Kikon',
    aadharNo: '6712 9034 5612', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 4, amountPaid: 4000, receiptNo: 'THMCS/REC/004/2025', certificateNo: 'THMCS/SC/004/2025',
    shareBookNo: 'SB-004', nstcbDepositAmount: 4000, nstcbDepositDate: '01/04/2025', totalAmountDeposit: 4000,
    remarks: '', outstandingLoan: 0
  },
  {
    id: 'm5', slno: 5, memberId: 'THMCS/MID/005/2025', name: 'MR IMLIYANGER',
    fatherName: 'LATE IMKONG TOSHI', phone: '9862567890', dateOfAdmission: '01/04/2025', dateOfBirth: '25/08/1982',
    spouse: 'Arenla Imli', gender: 'Male', address: 'Chümoukedima Town, Ward 5, Nagaland', nominee: 'Arenla Imli',
    aadharNo: '5421 8901 2345', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 7, amountPaid: 7000, receiptNo: 'THMCS/REC/005/2025', certificateNo: 'THMCS/SC/005/2025',
    shareBookNo: 'SB-005', nstcbDepositAmount: 7000, nstcbDepositDate: '01/04/2025', totalAmountDeposit: 7000,
    remarks: '', outstandingLoan: 0
  },
  {
    id: 'm6', slno: 6, memberId: 'THMCS/MID/006/2025', name: 'MR ZUBENTHUNG LOTHA',
    fatherName: 'LATE NLONGTSU', phone: '9436124567', dateOfAdmission: '01/04/2025', dateOfBirth: '11/04/1979',
    spouse: 'Roseline Lotha', gender: 'Male', address: 'Chümoukedima Town, Ward 3, Nagaland', nominee: 'Roseline Lotha',
    aadharNo: '3412 7890 1234', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 7, amountPaid: 7000, receiptNo: 'THMCS/REC/006/2025', certificateNo: 'THMCS/SC/006/2025',
    shareBookNo: 'SB-006', nstcbDepositAmount: 7000, nstcbDepositDate: '01/04/2025', totalAmountDeposit: 7000,
    remarks: '', outstandingLoan: 0
  },
  {
    id: 'm7', slno: 7, memberId: 'THMCS/MID/007/2025', name: 'MS NOTILE KATH',
    fatherName: 'LATE JUHA KATH', phone: '9856789123', dateOfAdmission: '01/04/2025', dateOfBirth: '19/06/1985',
    spouse: '', gender: 'Female', address: 'Chümoukedima Town, Nagaland', nominee: 'Kath Family',
    aadharNo: '9012 3456 1278', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 7, amountPaid: 7000, receiptNo: 'THMCS/REC/007/2025', certificateNo: 'THMCS/SC/007/2025',
    shareBookNo: 'SB-007', nstcbDepositAmount: 7000, nstcbDepositDate: '01/04/2025', totalAmountDeposit: 7000,
    remarks: '', outstandingLoan: 0
  },
  {
    id: 'm8', slno: 8, memberId: 'THMCS/MID/008/2025', name: 'MR T NZANTHUNG KIKON',
    fatherName: 'LATE TSENKHOMO KIKON', phone: '9774123456', dateOfAdmission: '01/04/2025', dateOfBirth: '03/01/1981',
    spouse: 'Helen Kikon', gender: 'Male', address: 'Chümoukedima Town, Ward 2, Nagaland', nominee: 'Helen Kikon',
    aadharNo: '7890 2341 5678', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 3, amountPaid: 3000, receiptNo: 'THMCS/REC/009/2025', certificateNo: 'THMCS/SC/009/2025',
    shareBookNo: 'SB-008', nstcbDepositAmount: 3000, nstcbDepositDate: '01/04/2025', totalAmountDeposit: 3000,
    remarks: '', outstandingLoan: 0
  },
  {
    id: 'm9', slno: 9, memberId: 'THMCS/MID/012/2025', name: 'MS ACHILA AO',
    fatherName: 'LATE PHREHELIE', phone: '9862890123', dateOfAdmission: '01/04/2025', dateOfBirth: '17/12/1987',
    spouse: '', gender: 'Female', address: 'Chümoukedima Town, Nagaland', nominee: 'Ao Family',
    aadharNo: '2345 9012 6789', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 2, amountPaid: 2000, receiptNo: 'THMCS/REC/012/2025', certificateNo: 'THMCS/SC/012/2025',
    shareBookNo: 'SB-009', nstcbDepositAmount: 2000, nstcbDepositDate: '01/04/2025', totalAmountDeposit: 2000,
    remarks: '', outstandingLoan: 0
  },
  {
    id: 'm10', slno: 10, memberId: 'THMCS/MID/014/2025', name: 'MS ATULA AO',
    fatherName: 'LATE IMKONG', phone: '9436567812', dateOfAdmission: '01/04/2025', dateOfBirth: '22/07/1986',
    spouse: '', gender: 'Female', address: 'Chümoukedima Town, Nagaland', nominee: 'Imkong Ao',
    aadharNo: '6789 1234 9012', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 2, amountPaid: 2000, receiptNo: 'THMCS/REC/014/2025', certificateNo: 'THMCS/SC/014/2025',
    shareBookNo: 'SB-010', nstcbDepositAmount: 2000, nstcbDepositDate: '01/04/2025', totalAmountDeposit: 2000,
    remarks: '', outstandingLoan: 0
  },
  {
    id: 'm11', slno: 11, memberId: 'THMCS/MID/015/2025', name: 'MS O BITHUNGLO SHITIRI',
    fatherName: 'OREMO SHITIRI', phone: '9856345678', dateOfAdmission: '01/04/2025', dateOfBirth: '10/03/1989',
    spouse: '', gender: 'Female', address: 'Chümoukedima Town, Nagaland', nominee: 'Oremo Shitiri',
    aadharNo: '8901 4567 2345', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 5, amountPaid: 5000, receiptNo: 'THMCS/REC/015/2025', certificateNo: 'THMCS/SC/015/2025',
    shareBookNo: 'SB-011', nstcbDepositAmount: 5000, nstcbDepositDate: '01/04/2025', totalAmountDeposit: 5000,
    remarks: '', outstandingLoan: 0
  },
  {
    id: 'm12', slno: 12, memberId: 'THMCS/MID/016/2025', name: 'MS AMENLA KHRUOMO',
    fatherName: 'LATE PERHEILIE KHRUOMO', phone: '9612789012', dateOfAdmission: '01/04/2025', dateOfBirth: '05/10/1991',
    spouse: '', gender: 'Female', address: 'Chümoukedima Town, Nagaland', nominee: 'Khruomo Family',
    aadharNo: '1234 7890 3456', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 1, amountPaid: 1000, receiptNo: 'THMCS/REC/016/2025', certificateNo: 'THMCS/SC/016/2025',
    shareBookNo: 'SB-012', nstcbDepositAmount: 1000, nstcbDepositDate: '01/04/2025', totalAmountDeposit: 1000,
    remarks: '', outstandingLoan: 0
  },
  {
    id: 'm13', slno: 13, memberId: 'THMCS/MID/018/2025', name: 'MR YANITHUNG SHITIO',
    fatherName: 'YICHUNGO SHITIO', phone: '9774678901', dateOfAdmission: '01/04/2025', dateOfBirth: '12/08/1983',
    spouse: 'Mhono Shitio', gender: 'Male', address: 'Chümoukedima Town, Nagaland', nominee: 'Mhono Shitio',
    aadharNo: '4567 1234 8901', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 3, amountPaid: 3000, receiptNo: 'THMCS/REC/018/2025', certificateNo: 'THMCS/SC/018/2025',
    shareBookNo: 'SB-013', nstcbDepositAmount: 3000, nstcbDepositDate: '01/04/2025', totalAmountDeposit: 3000,
    remarks: '', outstandingLoan: 0
  },
  {
    id: 'm14', slno: 14, memberId: 'THMCS/MID/022/2025', name: 'MS AVINUO',
    fatherName: 'LATE TOSHI IMKONG SUYU', phone: '9862341278', dateOfAdmission: '01/04/2025', dateOfBirth: '30/01/1990',
    spouse: '', gender: 'Female', address: 'Chümoukedima Town, Nagaland', nominee: 'Suyu Family',
    aadharNo: '7890 4561 2345', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 2, amountPaid: 2000, receiptNo: 'THMCS/REC/022/2025', certificateNo: 'THMCS/SC/022/2025',
    shareBookNo: 'SB-014', nstcbDepositAmount: 2000, nstcbDepositDate: '01/04/2025', totalAmountDeposit: 2000,
    remarks: '', outstandingLoan: 0
  },
  {
    id: 'm15', slno: 15, memberId: 'THMCS/MID/001/2026', name: 'MS AVONO',
    fatherName: '', phone: '9436129876', dateOfAdmission: '08-05-2026', dateOfBirth: '18/04/1992',
    spouse: '', gender: 'Female', address: 'Chümoukedima Town, Nagaland', nominee: '',
    aadharNo: '9012 5678 1234', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 5, amountPaid: 5000, receiptNo: 'THMCS/REC/001/2026', certificateNo: 'THMCS/SC/001/2026',
    shareBookNo: 'SB-015', nstcbDepositAmount: 5000, nstcbDepositDate: '08-05-2026', totalAmountDeposit: 5000,
    remarks: 'AUDITED SHAREHOLDER', outstandingLoan: 0
  },
  {
    id: 'm16', slno: 16, memberId: 'THMCS/MID/002/2026', name: 'MR S. HABETHUNG NGULLIE',
    fatherName: '', phone: '9856456712', dateOfAdmission: '08-05-2026', dateOfBirth: '29/09/1988',
    spouse: '', gender: 'Male', address: 'Chümoukedima Town, Nagaland', nominee: '',
    aadharNo: '2345 8901 4567', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 5, amountPaid: 5000, receiptNo: 'THMCS/REC/002/2026', certificateNo: 'THMCS/SC/002/2026',
    shareBookNo: 'SB-016', nstcbDepositAmount: 5000, nstcbDepositDate: '08-05-2026', totalAmountDeposit: 5000,
    remarks: 'AUDITED SHAREHOLDER', outstandingLoan: 0
  },
  {
    id: 'm17', slno: 17, memberId: 'THMCS/MID/003/2026', name: 'MS KIMIYETOLI Z AWOMI',
    fatherName: 'ZHEKUTO AWOMI', phone: '9612901234', dateOfAdmission: '08-05-2026', dateOfBirth: '07/11/1994',
    spouse: '', gender: 'Female', address: 'Chümoukedima Town, Nagaland', nominee: 'Zhekuto Awomi',
    aadharNo: '5678 2345 9012', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 5, amountPaid: 5000, receiptNo: 'THMCS/REC/003/2026', certificateNo: 'THMCS/SC/003/2026',
    shareBookNo: 'SB-017', nstcbDepositAmount: 5000, nstcbDepositDate: '08-05-2026', totalAmountDeposit: 5000,
    remarks: 'AUDITED SHAREHOLDER', outstandingLoan: 0
  },
  {
    id: 'm18', slno: 18, memberId: 'THMCS/MID/004/2026', name: 'MS LYDIA',
    fatherName: 'W/O MHATHUNG KIKON', phone: '9774345678', dateOfAdmission: '08-05-2026', dateOfBirth: '16/06/1986',
    spouse: 'Mhathung Kikon', gender: 'Female', address: 'Chümoukedima Town, Nagaland', nominee: 'Mhathung Kikon',
    aadharNo: '8901 6789 3456', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 5, amountPaid: 5000, receiptNo: 'THMCS/REC/004/2026', certificateNo: 'THMCS/SC/004/2026',
    shareBookNo: 'SB-018', nstcbDepositAmount: 5000, nstcbDepositDate: '08-05-2026', totalAmountDeposit: 5000,
    remarks: 'AUDITED SHAREHOLDER', outstandingLoan: 0
  },
  {
    id: 'm19', slno: 19, memberId: 'THMCS/MID/005/2026', name: 'MR MOSES R. OVUNG',
    fatherName: '', phone: '9862781234', dateOfAdmission: '08-05-2026', dateOfBirth: '23/03/1985',
    spouse: '', gender: 'Male', address: 'Chümoukedima Town, Nagaland', nominee: '',
    aadharNo: '1234 9012 7890', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 5, amountPaid: 5000, receiptNo: 'THMCS/REC/005/2026', certificateNo: 'THMCS/SC/005/2026',
    shareBookNo: 'SB-019', nstcbDepositAmount: 5000, nstcbDepositDate: '08-05-2026', totalAmountDeposit: 5000,
    remarks: 'AUDITED SHAREHOLDER', outstandingLoan: 0
  },
  {
    id: 'm20', slno: 20, memberId: 'THMCS/MID/006/2026', name: 'MS ROKOVONO',
    fatherName: '', phone: '9436782345', dateOfAdmission: '08-05-2026', dateOfBirth: '11/12/1993',
    spouse: '', gender: 'Female', address: 'Chümoukedima Town, Nagaland', nominee: '',
    aadharNo: '4567 3456 0123', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 5, amountPaid: 5000, receiptNo: 'THMCS/REC/006/2026', certificateNo: 'THMCS/SC/006/2026',
    shareBookNo: 'SB-020', nstcbDepositAmount: 5000, nstcbDepositDate: '08-05-2026', totalAmountDeposit: 5000,
    remarks: 'AUDITED SHAREHOLDER', outstandingLoan: 0
  },
  {
    id: 'm21', slno: 21, memberId: 'THMCS/MID/007/2026', name: 'MS ABENI HUMTSOE',
    fatherName: '', phone: '9856903456', dateOfAdmission: '08-05-2026', dateOfBirth: '04/07/1991',
    spouse: '', gender: 'Female', address: 'Chümoukedima Town, Nagaland', nominee: '',
    aadharNo: '7890 1234 4567', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 5, amountPaid: 5000, receiptNo: 'THMCS/REC/007/2026', certificateNo: 'THMCS/SC/007/2026',
    shareBookNo: 'SB-021', nstcbDepositAmount: 5000, nstcbDepositDate: '08-05-2026', totalAmountDeposit: 5000,
    remarks: 'AUDITED SHAREHOLDER', outstandingLoan: 0
  },
  {
    id: 'm22', slno: 22, memberId: 'THMCS/MID/008/2026', name: 'MS. MHALO JAMI',
    fatherName: '', phone: '9612457890', dateOfAdmission: '08-05-2026', dateOfBirth: '19/08/1990',
    spouse: '', gender: 'Female', address: 'Chümoukedima Town, Nagaland', nominee: '',
    aadharNo: '0123 7890 2345', admissionFee: 100, signatureType: 'Signature', status: 'Active',
    shares: 2, amountPaid: 2000, receiptNo: 'THMCS/REC/008/2026', certificateNo: 'THMCS/SC/008/2026',
    shareBookNo: 'SB-022', nstcbDepositAmount: 2000, nstcbDepositDate: '08-05-2026', totalAmountDeposit: 2000,
    remarks: 'AUDITED SHAREHOLDER', outstandingLoan: 0
  },
]

/* ── Default Shareholders generated from Members register with NStCB banking ── */
export const defaultShares: ShareEntry[] = [
  {
    id: 's1', slno: 1, memberId: 'THMCS/MID/001/2025', name: 'MS AKUMNARO SUYA',
    fatherName: 'LATE I. TOSHI', phone: '9862143210', address: 'Chümoukedima Town, Ward 4, Nagaland',
    date: '01/04/2025', shareBookNo: 'SB-001', noShares: 10, valuePerShare: 1000,
    amountWithheld: 10000, amountWithdrawn: 0, balance: 10000, period: '2025',
    receiptNo: 'THMCS/REC/001/2025', certificateNo: 'THMCS/SC/001/2025',
    nstcbDepositAmount: 10000, nstcbDepositDate: '01/04/2025', nstcbChallanNo: 'NSTCB-CH-1021',
    totalAmountDeposit: 10000, sharesEntitled: 10, remarks: 'Paid in full at NStCB Chümoukedima Branch'
  },
  {
    id: 's2', slno: 2, memberId: 'THMCS/MID/002/2025', name: 'MR VINSON KIKON',
    fatherName: 'R.K LOTHA', phone: '9436021876', address: 'Chümoukedima Town, Ward 1, Nagaland',
    date: '01/04/2025', shareBookNo: 'SB-002', noShares: 10, valuePerShare: 1000,
    amountWithheld: 10000, amountWithdrawn: 0, balance: 10000, period: '2025',
    receiptNo: 'THMCS/REC/002/2025', certificateNo: 'THMCS/SC/002/2025',
    nstcbDepositAmount: 10000, nstcbDepositDate: '01/04/2025', nstcbChallanNo: 'NSTCB-CH-1022',
    totalAmountDeposit: 10000, sharesEntitled: 10, remarks: 'Paid in full at NStCB'
  },
  {
    id: 's3', slno: 3, memberId: 'THMCS/MID/003/2025', name: 'MR THUNGBEMO SHITIRI',
    fatherName: 'LATE YANRENTHUNG SHITIRI', phone: '9856123489', address: 'Chümoukedima Town, Ward 2, Nagaland',
    date: '01/04/2025', shareBookNo: 'SB-003', noShares: 10, valuePerShare: 1000,
    amountWithheld: 10000, amountWithdrawn: 0, balance: 10000, period: '2025',
    receiptNo: 'THMCS/REC/003/2025', certificateNo: 'THMCS/SC/003/2025',
    nstcbDepositAmount: 10000, nstcbDepositDate: '01/04/2025', nstcbChallanNo: 'NSTCB-CH-1023',
    totalAmountDeposit: 10000, sharesEntitled: 10, remarks: 'Paid in full at NStCB'
  },
  {
    id: 's4', slno: 4, memberId: 'THMCS/MID/004/2025', name: 'MS LILY KIKON',
    fatherName: 'RAMONGO KIKON', phone: '9612345678', address: 'Chümoukedima Town, Nagaland',
    date: '01/04/2025', shareBookNo: 'SB-004', noShares: 4, valuePerShare: 1000,
    amountWithheld: 4000, amountWithdrawn: 0, balance: 4000, period: '2025',
    receiptNo: 'THMCS/REC/004/2025', certificateNo: 'THMCS/SC/004/2025',
    nstcbDepositAmount: 4000, nstcbDepositDate: '01/04/2025', nstcbChallanNo: 'NSTCB-CH-1024',
    totalAmountDeposit: 4000, sharesEntitled: 4, remarks: ''
  },
  {
    id: 's5', slno: 5, memberId: 'THMCS/MID/005/2025', name: 'MR IMLIYANGER',
    fatherName: 'LATE IMKONG TOSHI', phone: '9862567890', address: 'Chümoukedima Town, Ward 5, Nagaland',
    date: '01/04/2025', shareBookNo: 'SB-005', noShares: 7, valuePerShare: 1000,
    amountWithheld: 7000, amountWithdrawn: 0, balance: 7000, period: '2025',
    receiptNo: 'THMCS/REC/005/2025', certificateNo: 'THMCS/SC/005/2025',
    nstcbDepositAmount: 7000, nstcbDepositDate: '01/04/2025', nstcbChallanNo: 'NSTCB-CH-1025',
    totalAmountDeposit: 7000, sharesEntitled: 7, remarks: ''
  },
  {
    id: 's6', slno: 6, memberId: 'THMCS/MID/006/2025', name: 'MR ZUBENTHUNG LOTHA',
    fatherName: 'LATE NLONGTSU', phone: '9436124567', address: 'Chümoukedima Town, Ward 3, Nagaland',
    date: '01/04/2025', shareBookNo: 'SB-006', noShares: 7, valuePerShare: 1000,
    amountWithheld: 7000, amountWithdrawn: 0, balance: 7000, period: '2025',
    receiptNo: 'THMCS/REC/006/2025', certificateNo: 'THMCS/SC/006/2025',
    nstcbDepositAmount: 7000, nstcbDepositDate: '01/04/2025', nstcbChallanNo: 'NSTCB-CH-1026',
    totalAmountDeposit: 7000, sharesEntitled: 7, remarks: ''
  },
  {
    id: 's7', slno: 7, memberId: 'THMCS/MID/007/2025', name: 'MS NOTILE KATH',
    fatherName: 'LATE JUHA KATH', phone: '9856789123', address: 'Chümoukedima Town, Nagaland',
    date: '01/04/2025', shareBookNo: 'SB-007', noShares: 7, valuePerShare: 1000,
    amountWithheld: 7000, amountWithdrawn: 0, balance: 7000, period: '2025',
    receiptNo: 'THMCS/REC/007/2025', certificateNo: 'THMCS/SC/007/2025',
    nstcbDepositAmount: 7000, nstcbDepositDate: '01/04/2025', nstcbChallanNo: 'NSTCB-CH-1027',
    totalAmountDeposit: 7000, sharesEntitled: 7, remarks: ''
  },
  {
    id: 's8', slno: 8, memberId: 'THMCS/MID/008/2025', name: 'MR T NZANTHUNG KIKON',
    fatherName: 'LATE TSENKHOMO KIKON', phone: '9774123456', address: 'Chümoukedima Town, Ward 2, Nagaland',
    date: '01/04/2025', shareBookNo: 'SB-008', noShares: 3, valuePerShare: 1000,
    amountWithheld: 3000, amountWithdrawn: 0, balance: 3000, period: '2025',
    receiptNo: 'THMCS/REC/009/2025', certificateNo: 'THMCS/SC/009/2025',
    nstcbDepositAmount: 3000, nstcbDepositDate: '01/04/2025', nstcbChallanNo: 'NSTCB-CH-1028',
    totalAmountDeposit: 3000, sharesEntitled: 3, remarks: ''
  },
  {
    id: 's9', slno: 9, memberId: 'THMCS/MID/012/2025', name: 'MS ACHILA AO',
    fatherName: 'LATE PHREHELIE', phone: '9862890123', address: 'Chümoukedima Town, Nagaland',
    date: '01/04/2025', shareBookNo: 'SB-009', noShares: 2, valuePerShare: 1000,
    amountWithheld: 2000, amountWithdrawn: 0, balance: 2000, period: '2025',
    receiptNo: 'THMCS/REC/012/2025', certificateNo: 'THMCS/SC/012/2025',
    nstcbDepositAmount: 2000, nstcbDepositDate: '01/04/2025', nstcbChallanNo: 'NSTCB-CH-1029',
    totalAmountDeposit: 2000, sharesEntitled: 2, remarks: ''
  },
  {
    id: 's10', slno: 10, memberId: 'THMCS/MID/014/2025', name: 'MS ATULA AO',
    fatherName: 'LATE IMKONG', phone: '9436567812', address: 'Chümoukedima Town, Nagaland',
    date: '01/04/2025', shareBookNo: 'SB-010', noShares: 2, valuePerShare: 1000,
    amountWithheld: 2000, amountWithdrawn: 0, balance: 2000, period: '2025',
    receiptNo: 'THMCS/REC/014/2025', certificateNo: 'THMCS/SC/014/2025',
    nstcbDepositAmount: 2000, nstcbDepositDate: '01/04/2025', nstcbChallanNo: 'NSTCB-CH-1030',
    totalAmountDeposit: 2000, sharesEntitled: 2, remarks: ''
  },
  {
    id: 's11', slno: 11, memberId: 'THMCS/MID/015/2025', name: 'MS O BITHUNGLO SHITIRI',
    fatherName: 'OREMO SHITIRI', phone: '9856345678', address: 'Chümoukedima Town, Nagaland',
    date: '01/04/2025', shareBookNo: 'SB-011', noShares: 5, valuePerShare: 1000,
    amountWithheld: 5000, amountWithdrawn: 0, balance: 5000, period: '2025',
    receiptNo: 'THMCS/REC/015/2025', certificateNo: 'THMCS/SC/015/2025',
    nstcbDepositAmount: 5000, nstcbDepositDate: '01/04/2025', nstcbChallanNo: 'NSTCB-CH-1031',
    totalAmountDeposit: 5000, sharesEntitled: 5, remarks: ''
  },
  {
    id: 's12', slno: 12, memberId: 'THMCS/MID/016/2025', name: 'MS AMENLA KHRUOMO',
    fatherName: 'LATE PERHEILIE KHRUOMO', phone: '9612789012', address: 'Chümoukedima Town, Nagaland',
    date: '01/04/2025', shareBookNo: 'SB-012', noShares: 1, valuePerShare: 1000,
    amountWithheld: 1000, amountWithdrawn: 0, balance: 1000, period: '2025',
    receiptNo: 'THMCS/REC/016/2025', certificateNo: 'THMCS/SC/016/2025',
    nstcbDepositAmount: 1000, nstcbDepositDate: '01/04/2025', nstcbChallanNo: 'NSTCB-CH-1032',
    totalAmountDeposit: 1000, sharesEntitled: 1, remarks: ''
  },
  {
    id: 's13', slno: 13, memberId: 'THMCS/MID/018/2025', name: 'MR YANITHUNG SHITIO',
    fatherName: 'YICHUNGO SHITIO', phone: '9774678901', address: 'Chümoukedima Town, Nagaland',
    date: '01/04/2025', shareBookNo: 'SB-013', noShares: 3, valuePerShare: 1000,
    amountWithheld: 3000, amountWithdrawn: 0, balance: 3000, period: '2025',
    receiptNo: 'THMCS/REC/018/2025', certificateNo: 'THMCS/SC/018/2025',
    nstcbDepositAmount: 3000, nstcbDepositDate: '01/04/2025', nstcbChallanNo: 'NSTCB-CH-1033',
    totalAmountDeposit: 3000, sharesEntitled: 3, remarks: ''
  },
  {
    id: 's14', slno: 14, memberId: 'THMCS/MID/022/2025', name: 'MS AVINUO',
    fatherName: 'LATE TOSHI IMKONG SUYU', phone: '9862341278', address: 'Chümoukedima Town, Nagaland',
    date: '01/04/2025', shareBookNo: 'SB-014', noShares: 2, valuePerShare: 1000,
    amountWithheld: 2000, amountWithdrawn: 0, balance: 2000, period: '2025',
    receiptNo: 'THMCS/REC/022/2025', certificateNo: 'THMCS/SC/022/2025',
    nstcbDepositAmount: 2000, nstcbDepositDate: '01/04/2025', nstcbChallanNo: 'NSTCB-CH-1034',
    totalAmountDeposit: 2000, sharesEntitled: 2, remarks: ''
  },
  {
    id: 's15', slno: 15, memberId: 'THMCS/MID/001/2026', name: 'MS AVONO',
    fatherName: '', phone: '9436129876', address: 'Chümoukedima Town, Nagaland',
    date: '08-05-2026', shareBookNo: 'SB-015', noShares: 5, valuePerShare: 1000,
    amountWithheld: 5000, amountWithdrawn: 0, balance: 5000, period: '2026',
    receiptNo: 'THMCS/REC/001/2026', certificateNo: 'THMCS/SC/001/2026',
    nstcbDepositAmount: 5000, nstcbDepositDate: '08-05-2026', nstcbChallanNo: 'NSTCB-CH-1035',
    totalAmountDeposit: 5000, sharesEntitled: 5, remarks: 'Paid at NStCB Chümoukedima Branch'
  },
  {
    id: 's16', slno: 16, memberId: 'THMCS/MID/002/2026', name: 'MR S. HABETHUNG NGULLIE',
    fatherName: '', phone: '9856456712', address: 'Chümoukedima Town, Nagaland',
    date: '08-05-2026', shareBookNo: 'SB-016', noShares: 5, valuePerShare: 1000,
    amountWithheld: 5000, amountWithdrawn: 0, balance: 5000, period: '2026',
    receiptNo: 'THMCS/REC/002/2026', certificateNo: 'THMCS/SC/002/2026',
    nstcbDepositAmount: 5000, nstcbDepositDate: '08-05-2026', nstcbChallanNo: 'NSTCB-CH-1036',
    totalAmountDeposit: 5000, sharesEntitled: 5, remarks: 'Paid at NStCB'
  },
  {
    id: 's17', slno: 17, memberId: 'THMCS/MID/003/2026', name: 'MS KIMIYETOLI Z AWOMI',
    fatherName: 'ZHEKUTO AWOMI', phone: '9612901234', address: 'Chümoukedima Town, Nagaland',
    date: '08-05-2026', shareBookNo: 'SB-017', noShares: 5, valuePerShare: 1000,
    amountWithheld: 5000, amountWithdrawn: 0, balance: 5000, period: '2026',
    receiptNo: 'THMCS/REC/003/2026', certificateNo: 'THMCS/SC/003/2026',
    nstcbDepositAmount: 5000, nstcbDepositDate: '08-05-2026', nstcbChallanNo: 'NSTCB-CH-1037',
    totalAmountDeposit: 5000, sharesEntitled: 5, remarks: 'Paid at NStCB'
  },
  {
    id: 's18', slno: 18, memberId: 'THMCS/MID/004/2026', name: 'MS LYDIA',
    fatherName: 'W/O MHATHUNG KIKON', phone: '9774345678', address: 'Chümoukedima Town, Nagaland',
    date: '08-05-2026', shareBookNo: 'SB-018', noShares: 5, valuePerShare: 1000,
    amountWithheld: 5000, amountWithdrawn: 0, balance: 5000, period: '2026',
    receiptNo: 'THMCS/REC/004/2026', certificateNo: 'THMCS/SC/004/2026',
    nstcbDepositAmount: 5000, nstcbDepositDate: '08-05-2026', nstcbChallanNo: 'NSTCB-CH-1038',
    totalAmountDeposit: 5000, sharesEntitled: 5, remarks: 'Paid at NStCB'
  },
  {
    id: 's19', slno: 19, memberId: 'THMCS/MID/005/2026', name: 'MR MOSES R. OVUNG',
    fatherName: '', phone: '9862781234', address: 'Chümoukedima Town, Nagaland',
    date: '08-05-2026', shareBookNo: 'SB-019', noShares: 5, valuePerShare: 1000,
    amountWithheld: 5000, amountWithdrawn: 0, balance: 5000, period: '2026',
    receiptNo: 'THMCS/REC/005/2026', certificateNo: 'THMCS/SC/005/2026',
    nstcbDepositAmount: 5000, nstcbDepositDate: '08-05-2026', nstcbChallanNo: 'NSTCB-CH-1039',
    totalAmountDeposit: 5000, sharesEntitled: 5, remarks: 'Paid at NStCB'
  },
  {
    id: 's20', slno: 20, memberId: 'THMCS/MID/006/2026', name: 'MS ROKOVONO',
    fatherName: '', phone: '9436782345', address: 'Chümoukedima Town, Nagaland',
    date: '08-05-2026', shareBookNo: 'SB-020', noShares: 5, valuePerShare: 1000,
    amountWithheld: 5000, amountWithdrawn: 0, balance: 5000, period: '2026',
    receiptNo: 'THMCS/REC/006/2026', certificateNo: 'THMCS/SC/006/2026',
    nstcbDepositAmount: 5000, nstcbDepositDate: '08-05-2026', nstcbChallanNo: 'NSTCB-CH-1040',
    totalAmountDeposit: 5000, sharesEntitled: 5, remarks: 'Paid at NStCB'
  },
  {
    id: 's21', slno: 21, memberId: 'THMCS/MID/007/2026', name: 'MS ABENI HUMTSOE',
    fatherName: '', phone: '9856903456', address: 'Chümoukedima Town, Nagaland',
    date: '08-05-2026', shareBookNo: 'SB-021', noShares: 5, valuePerShare: 1000,
    amountWithheld: 5000, amountWithdrawn: 0, balance: 5000, period: '2026',
    receiptNo: 'THMCS/REC/007/2026', certificateNo: 'THMCS/SC/007/2026',
    nstcbDepositAmount: 5000, nstcbDepositDate: '08-05-2026', nstcbChallanNo: 'NSTCB-CH-1041',
    totalAmountDeposit: 5000, sharesEntitled: 5, remarks: 'Paid at NStCB'
  },
  {
    id: 's22', slno: 22, memberId: 'THMCS/MID/008/2026', name: 'MS. MHALO JAMI',
    fatherName: '', phone: '9612457890', address: 'Chümoukedima Town, Nagaland',
    date: '08-05-2026', shareBookNo: 'SB-022', noShares: 2, valuePerShare: 1000,
    amountWithheld: 2000, amountWithdrawn: 0, balance: 2000, period: '2026',
    receiptNo: 'THMCS/REC/008/2026', certificateNo: 'THMCS/SC/008/2026',
    nstcbDepositAmount: 2000, nstcbDepositDate: '08-05-2026', nstcbChallanNo: 'NSTCB-CH-1042',
    totalAmountDeposit: 2000, sharesEntitled: 2, remarks: 'Paid at NStCB'
  },
]

type RegistersCtx = {
  projectEntries: ProjectEntry[]
  addProjectEntry: (e: Omit<ProjectEntry, 'id' | 'slno' | 'source'>) => void

  /* Member CRUD */
  members: Member[]
  addMember: (m: Omit<Member, 'id' | 'slno'>) => void
  updateMember: (id: string, m: Partial<Member>) => void
  deleteMember: (id: string) => void
  resetMembersToDefault: () => void

  /* Share CRUD */
  shareEntries: ShareEntry[]
  addShareEntry: (s: Omit<ShareEntry, 'id' | 'slno'>) => void
  updateShareEntry: (id: string, s: Partial<ShareEntry>) => void
  deleteShareEntry: (id: string) => void
  resetSharesToDefault: () => void
}

const Ctx = createContext<RegistersCtx | null>(null)

const projectSeed: ProjectEntry[] = []

export function RegistersProvider({ children }: { children: ReactNode }) {
  // Clear obsolete dummy data from previous sessions
  useEffect(() => {
    try {
      localStorage.removeItem('th_projects_v1')
      localStorage.removeItem('th_projects_seed')
      localStorage.removeItem('th_members_v1')
      localStorage.removeItem('th_members_v2')
      localStorage.removeItem('th_members_v3')
      localStorage.removeItem('th_shares_v1')
      localStorage.removeItem('th_shares_v2')
      localStorage.removeItem('th_shares_v3')
      localStorage.removeItem('th_shares_v4')
    } catch (e) {
      // ignore
    }
  }, [])

  const [projectEntries, setProjectEntries] = useState<ProjectEntry[]>(() => {
    try {
      localStorage.removeItem('th_projects_v1')
      const saved = localStorage.getItem('th_projects_v2')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {
      console.error(e)
    }
    return projectSeed
  })

  useEffect(() => {
    try {
      localStorage.setItem('th_projects_v2', JSON.stringify(projectEntries))
    } catch (e) {
      console.error(e)
    }
  }, [projectEntries])

  /* Members state with localStorage - Preserved uploaded members */
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem('th_members_v4_audit')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(m => Boolean(m.name && m.name.trim()))) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Failed to load members from localStorage', e)
    }
    return defaultMembers
  })

  /* Share entries state with localStorage - Preserved uploaded share data */
  const [shareEntries, setShareEntries] = useState<ShareEntry[]>(() => {
    try {
      const saved = localStorage.getItem('th_shares_v5_audit')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(s => Boolean(s.name && s.name.trim()))) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Failed to load shares from localStorage', e)
    }
    return defaultShares
  })

  /* Save to localStorage */
  useEffect(() => {
    try {
      localStorage.setItem('th_members_v4_audit', JSON.stringify(members))
    } catch (e) {
      console.error('Failed to save members to localStorage', e)
    }
  }, [members])

  useEffect(() => {
    try {
      localStorage.setItem('th_shares_v5_audit', JSON.stringify(shareEntries))
    } catch (e) {
      console.error('Failed to save shares to localStorage', e)
    }
  }, [shareEntries])

  /* Project actions */
  const addProjectEntry = (e: Omit<ProjectEntry, 'id' | 'slno' | 'source'>) => {
    setProjectEntries(prev => [
      ...prev,
      { ...e, id: `p${Date.now()}`, slno: prev.length + 1, source: 'project' },
    ])
  }

  /* Member CRUD */
  const addMember = (m: Omit<Member, 'id' | 'slno'>) => {
    setMembers(prev => {
      const newMember: Member = {
        ...m,
        id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        slno: prev.length + 1,
      }
      return [...prev, newMember]
    })
  }

  const updateMember = (id: string, updatedFields: Partial<Member>) => {
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, ...updatedFields } : m)))

    // If member details changed, also keep matching share entry in sync
    setShareEntries(prev =>
      prev.map(s => {
        const targetMember = members.find(m => m.id === id)
        if (!targetMember || (s.memberId !== targetMember.memberId && s.id !== id)) return s
        return {
          ...s,
          name: updatedFields.name ?? s.name,
          fatherName: updatedFields.fatherName ?? s.fatherName,
          phone: updatedFields.phone ?? s.phone,
          address: updatedFields.address ?? s.address,
          shareBookNo: updatedFields.shareBookNo ?? s.shareBookNo,
          receiptNo: updatedFields.receiptNo ?? s.receiptNo,
          certificateNo: updatedFields.certificateNo ?? s.certificateNo,
          remarks: updatedFields.remarks ?? s.remarks,
        }
      })
    )
  }

  const deleteMember = (id: string) => {
    setMembers(prev => {
      const filtered = prev.filter(m => m.id !== id)
      return filtered.map((m, idx) => ({ ...m, slno: idx + 1 }))
    })
  }

  const resetMembersToDefault = () => {
    setMembers(defaultMembers)
  }

  /* Share CRUD */
  const addShareEntry = (s: Omit<ShareEntry, 'id' | 'slno'>) => {
    const totalDeposit = s.totalAmountDeposit ?? (s.nstcbDepositAmount ?? (s.noShares * (s.valuePerShare || 1000)))
    const entitled = Math.floor(totalDeposit / 1000)
    const amountWithheld = s.amountWithheld ?? (s.noShares * (s.valuePerShare || 1000))
    const balance = amountWithheld - (s.amountWithdrawn || 0)

    setShareEntries(prev => {
      const newEntry: ShareEntry = {
        ...s,
        id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        slno: prev.length + 1,
        totalAmountDeposit: totalDeposit,
        sharesEntitled: entitled,
        amountWithheld,
        balance,
      }
      return [...prev, newEntry]
    })

    // Also update member if matching memberId exists
    if (s.memberId) {
      setMembers(prev =>
        prev.map(m => {
          if (m.memberId !== s.memberId) return m
          return {
            ...m,
            shares: s.noShares,
            shareBookNo: s.shareBookNo,
            receiptNo: s.receiptNo || m.receiptNo,
            certificateNo: s.certificateNo || m.certificateNo,
            nstcbDepositAmount: s.nstcbDepositAmount,
            nstcbDepositDate: s.nstcbDepositDate,
            totalAmountDeposit: totalDeposit,
            remarks: s.remarks || m.remarks,
          }
        })
      )
    }
  }

  const updateShareEntry = (id: string, updatedFields: Partial<ShareEntry>) => {
    setShareEntries(prev =>
      prev.map(s => {
        if (s.id !== id) return s
        const merged = { ...s, ...updatedFields }
        const totalDeposit = merged.totalAmountDeposit ?? (merged.nstcbDepositAmount ?? (merged.noShares * merged.valuePerShare))
        const sharesEntitled = Math.floor(totalDeposit / 1000)
        const amountWithheld = merged.noShares * merged.valuePerShare
        const balance = amountWithheld - (merged.amountWithdrawn || 0)

        const finalEntry: ShareEntry = {
          ...merged,
          totalAmountDeposit: totalDeposit,
          sharesEntitled,
          amountWithheld,
          balance,
        }

        // Keep matching member in sync
        setMembers(memList =>
          memList.map(m => {
            if (m.memberId !== finalEntry.memberId && m.name !== finalEntry.name) return m
            return {
              ...m,
              name: finalEntry.name,
              fatherName: finalEntry.fatherName ?? m.fatherName,
              phone: finalEntry.phone ?? m.phone,
              address: finalEntry.address ?? m.address,
              shares: finalEntry.noShares,
              shareBookNo: finalEntry.shareBookNo,
              receiptNo: finalEntry.receiptNo,
              certificateNo: finalEntry.certificateNo,
              nstcbDepositAmount: finalEntry.nstcbDepositAmount,
              nstcbDepositDate: finalEntry.nstcbDepositDate,
              totalAmountDeposit: finalEntry.totalAmountDeposit,
              remarks: finalEntry.remarks ?? m.remarks,
            }
          })
        )

        return finalEntry
      })
    )
  }

  const deleteShareEntry = (id: string) => {
    setShareEntries(prev => {
      const filtered = prev.filter(s => s.id !== id)
      return filtered.map((s, idx) => ({ ...s, slno: idx + 1 }))
    })
  }

  const resetSharesToDefault = () => {
    setShareEntries(defaultShares)
  }

  return (
    <Ctx.Provider
      value={{
        projectEntries,
        addProjectEntry,
        members,
        addMember,
        updateMember,
        deleteMember,
        resetMembersToDefault,
        shareEntries,
        addShareEntry,
        updateShareEntry,
        deleteShareEntry,
        resetSharesToDefault,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useRegisters() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRegisters must be used inside RegistersProvider')
  return ctx
}
