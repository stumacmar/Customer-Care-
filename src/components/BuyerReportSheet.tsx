/*
 * Ingest a buyer's report. The buyer's app sends an email containing a small
 * paste-code; pasting it (or the whole email) here decodes the report and
 * hands it to the normal logging flow — so the clock starts exactly as if the
 * developer had typed it, with the buyer's own words preserved.
 */

import { useState } from 'react'
import { Sheet } from './ui'
import { decodeShare, extractCode, type BuyerReport } from '../lib/share'
import { formatDate } from '../lib/dates'
import type { IssueType } from '../types'

const TYPE_LABEL: Record<IssueType, string> = {
  snag: 'Snag',
  complaint: 'Complaint',
  emergency: 'Emergency',
}

export function BuyerReportSheet({
  onClose,
  onDecoded,
}: {
  onClose: () => void
  /** Hands the decoded report to the logging flow. */
  onDecoded: (type: IssueType, description: string) => void
}) {
  const [text, setText] = useState('')
  const [report, setReport] = useState<BuyerReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parse = async (value: string) => {
    setText(value)
    setError(null)
    setReport(null)
    const code = extractCode(value)
    if (!code) return
    const decoded = await decodeShare(code)
    if (decoded && decoded.k === 'report') {
      setReport(decoded)
    } else if (value.trim().length > 20) {
      setError('That does not look like a buyer report code — paste the whole email if unsure.')
    }
  }

  const log = () => {
    if (!report) return
    const description =
      `${report.description}\n[Reported by the buyer via their plot link` +
      `${report.sentOn ? `, sent ${formatDate(report.sentOn)}` : ''}]`
    onDecoded(report.type, description)
  }

  return (
    <Sheet
      title="Paste a buyer report"
      subtitle="Paste the code (or the whole email) from the buyer's message."
      onClose={onClose}
    >
      <div className="field">
        <label>Buyer's report</label>
        <textarea
          rows={5}
          value={text}
          onChange={(e) => parse(e.target.value)}
          placeholder="Paste here — the code looks like v1.AbC12…"
          autoFocus
        />
        {error && (
          <div className="dictate-hint" style={{ color: 'var(--red)' }}>
            {error}
          </div>
        )}
      </div>

      {report && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="issue-head">
            <span className={`badge ${report.type}`}>{TYPE_LABEL[report.type]}</span>
            <span className="ref">sent {formatDate(report.sentOn)}</span>
          </div>
          <p className="issue-desc" style={{ marginBottom: 0 }}>
            {report.description}
          </p>
        </div>
      )}

      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={log} disabled={!report}>
          Log it — start the clock
        </button>
      </div>
    </Sheet>
  )
}
