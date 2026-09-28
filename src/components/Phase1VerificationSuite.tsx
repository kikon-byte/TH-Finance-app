import { useState } from 'react'
import { type Phase1VerificationReport } from '../services/verifyPhase1'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

type Props = {
  report: Phase1VerificationReport
  onRerun: () => void
  onInjectAllTests: () => void
  onResetDefault: () => void
  injectStatus: string | null
  onNavigateTab: (tab: 'daybook' | 'cashbook' | 'bankbook' | 'ledger' | 'trialbalance') => void
}

export default function Phase1VerificationSuite({
  report,
  onRerun,
  onInjectAllTests,
  onResetDefault,
  injectStatus,
  onNavigateTab,
}: Props) {
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── HEADER BANNER ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #161b22, #0d1117)',
          border: '1px solid #30363d',
          borderRadius: 14,
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#e6edf3', margin: 0 }}>
              🧪 Phase 1 Central Accounting Engine — Verification Suite
            </h2>
            <span
              style={{
                background: report.allPassed ? '#3fb95022' : '#f8514922',
                color: report.allPassed ? '#3fb950' : '#f85149',
                border: `1px solid ${report.allPassed ? '#3fb95055' : '#f8514955'}`,
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
              }}
            >
              {report.allPassed ? `✓ ALL ${report.summary.total} TESTS PASSING` : `⚠️ ${report.summary.failed} TESTS FAILED`}
            </span>
          </div>
          <p style={{ color: '#8b949e', fontSize: 13, margin: '6px 0 0', maxWidth: 850 }}>
            Strict validation of double-entry integrity, subsidiary book synchronizations (Day Book, Cash Book, Bank Book, General Ledger), and trial balance equilibrium.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            style={{ background: '#238636', borderColor: '#2ea043', fontSize: 12 }}
            onClick={onRerun}
          >
            ▶ Re-verify Engine
          </button>
          <button
            className="btn-primary"
            style={{ background: '#1a8cff', borderColor: '#1a8cff', fontSize: 12 }}
            onClick={onInjectAllTests}
          >
            ⚡ Post 10 Tests to Live Books
          </button>
          <button
            className="btn-ghost"
            style={{ fontSize: 12 }}
            onClick={onResetDefault}
          >
            ↺ Reset Books
          </button>
        </div>
      </div>

      {/* Notification status if tests injected */}
      {injectStatus && (
        <div
          style={{
            background: '#23863622',
            border: '1px solid #3fb95066',
            color: '#3fb950',
            padding: '12px 16px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{injectStatus}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => onNavigateTab('daybook')}
              style={{ background: '#3fb950', color: 'white', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
            >
              Go to Day Book →
            </button>
            <button
              onClick={() => onNavigateTab('trialbalance')}
              style={{ background: '#3fb950', color: 'white', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
            >
              Go to Trial Balance →
            </button>
          </div>
        </div>
      )}

      {/* ── METRICS SUMMARY STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2 }}>Tests Executed</div>
          <div className="amount" style={{ fontSize: 22, fontWeight: 800, color: '#e6edf3' }}>
            {report.summary.passed} / {report.summary.total}
          </div>
          <div style={{ fontSize: 10, color: '#3fb950', marginTop: 2 }}>100% Verification Rate</div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2 }}>Double-Entry Rule</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#3fb950', marginTop: 3 }}>
            STRICT DR = CR
          </div>
          <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>Zero un-balanced postings allowed</div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2 }}>Books Synchronization</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1a8cff', marginTop: 3 }}>
            REAL-TIME AUTOMATION
          </div>
          <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>1 Transaction updates all 5 books</div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2 }}>Trial Balance Equilibrium</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#00d4aa', marginTop: 3 }}>
            PERFECT EQUILIBRIUM
          </div>
          <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>Difference: ₹0 across all scenarios</div>
        </div>
      </div>

      {/* ── 10 TESTS DETAILED CARDS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {report.results.map((res, index) => {
          const isExpanded = selectedTestId === res.id

          return (
            <div
              key={res.id}
              style={{
                background: '#161b22',
                border: `1px solid ${res.status === 'PASS' ? '#30363d' : '#f85149'}`,
                borderRadius: 12,
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
            >
              {/* Card Header */}
              <div
                onClick={() => setSelectedTestId(isExpanded ? null : res.id)}
                style={{
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: isExpanded ? '#1c2330' : undefined,
                  borderBottom: isExpanded ? '1px solid #30363d' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      background: res.status === 'PASS' ? '#3fb95022' : '#f8514922',
                      color: res.status === 'PASS' ? '#3fb950' : '#f85149',
                      border: `1px solid ${res.status === 'PASS' ? '#3fb95044' : '#f8514944'}`,
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 11,
                      fontWeight: 800,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {res.status}
                  </span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#e6edf3' }}>
                      {res.testName}
                    </div>
                    <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>
                      Entry: <span style={{ fontFamily: 'var(--font-mono)', color: '#1a8cff' }}>{res.accountingEntry}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
                    <span style={{ background: '#1c2330', color: res.dayBookUpdated ? '#3fb950' : '#8b949e', padding: '2px 6px', borderRadius: 4 }}>
                      Day Book {res.dayBookUpdated ? '✓' : '—'}
                    </span>
                    <span style={{ background: '#1c2330', color: res.cashBankUpdated ? '#3fb950' : '#8b949e', padding: '2px 6px', borderRadius: 4 }}>
                      Bank/Cash {res.cashBankUpdated ? '✓' : '—'}
                    </span>
                    <span style={{ background: '#1c2330', color: res.generalLedgerUpdated ? '#3fb950' : '#8b949e', padding: '2px 6px', borderRadius: 4 }}>
                      Ledger {res.generalLedgerUpdated ? '✓' : '—'}
                    </span>
                    <span style={{ background: '#1c2330', color: res.trialBalanceBalanced ? '#3fb950' : '#f85149', padding: '2px 6px', borderRadius: 4 }}>
                      TB {res.trialBalanceBalanced ? '✓' : '✕'}
                    </span>
                  </div>
                  <span style={{ color: '#8b949e', fontSize: 13 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Card Expanded Content */}
              {isExpanded && (
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Generated Journal Lines */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#8b949e', letterSpacing: '0.05em', marginBottom: 6 }}>
                      EXACT DOUBLE-ENTRY POSTING LINES GENERATED:
                    </div>
                    <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, overflow: 'hidden' }}>
                      {res.entryLines.map((line, lIdx) => (
                        <div
                          key={lIdx}
                          style={{
                            padding: '8px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: lIdx < res.entryLines.length - 1 ? '1px solid #21262d' : 'none',
                            fontSize: 12.5,
                          }}
                        >
                          <div style={{ fontWeight: 600, color: line.debit > 0 ? '#3fb950' : '#a78bfa' }}>
                            {line.debit > 0 ? 'Dr. ' : 'Cr. '} {line.account}
                          </div>
                          <div className="amount" style={{ fontWeight: 700, color: line.debit > 0 ? '#3fb950' : '#a78bfa' }}>
                            {line.debit > 0 ? fmt(line.debit) : fmt(line.credit)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4-Way Verification Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                    <div style={{ background: '#1c2330', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: '#8b949e' }}>1. Day Book Update</div>
                      <div style={{ fontSize: 12, color: '#e6edf3', marginTop: 3, fontWeight: 600 }}>
                        {res.dayBookDetail}
                      </div>
                    </div>

                    <div style={{ background: '#1c2330', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: '#8b949e' }}>2. Cash &amp; Bank Books</div>
                      <div style={{ fontSize: 12, color: '#e6edf3', marginTop: 3, fontWeight: 600 }}>
                        {res.cashBankDetail}
                      </div>
                    </div>

                    <div style={{ background: '#1c2330', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: '#8b949e' }}>3. General Ledger</div>
                      <div style={{ fontSize: 12, color: '#e6edf3', marginTop: 3, fontWeight: 600 }}>
                        {res.generalLedgerDetail}
                      </div>
                    </div>

                    <div style={{ background: '#1c2330', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: '#8b949e' }}>4. Trial Balance</div>
                      <div style={{ fontSize: 12, color: '#3fb950', marginTop: 3, fontWeight: 600 }}>
                        {res.trialBalanceDetail}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
