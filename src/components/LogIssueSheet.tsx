/*
 * Log one of the three trigger types. Designed to take under 20 seconds on a
 * phone: pick type → photo → one-line voice/typed description → done. The app
 * then calculates every downstream deadline itself.
 *
 * A report from the customer's app arrives by email with a link. Tapping the
 * link opens this sheet filled in (initialReport): the customer's own words
 * and the date they sent it are kept. Pasting the email into the description
 * does the same, as a fallback when the link opens outside the installed app.
 */

import { useState } from 'react'
import { DictationField, PhotoField, Sheet } from './ui'
import { usePlot, useStore } from '../state/store'
import { SNAG_PUT_RIGHT_DAYS } from '../lib/code'
import { addDays, formatDate, nextBusinessDay, todayISO } from '../lib/dates'
import { decodeShare, extractCode, type BuyerReport } from '../lib/share'
import type { IconName } from './icons'
import type { IssueType } from '../types'

const TYPES: { key: IssueType; label: string; ico: IconName; blurb: string }[] = [
  { key: 'snag', label: 'Snag or defect', ico: 'wrench', blurb: `Acknowledge it as soon as possible, then put it right within ${SNAG_PUT_RIGHT_DAYS} days of the report, or explain the delay and update the customer monthly (Code 3.3).` },
  {
    key: 'complaint',
    label: 'Complaint',
    ico: 'megaphone',
    blurb: 'The formal complaints procedure: acknowledgement by day 5, Path to Resolution letter by day 10, Complaint Assessment and Response letter by day 30, Eight-Week Letter by day 56 (Code 3.4).',
  },
  {
    key: 'emergency',
    label: 'Emergency',
    ico: 'alert',
    blurb: 'An immediate threat to safety, security, health or well-being. Flagged urgent and kept at the top of every list.',
  },
]

/** The customer's words, plus the line that shows on the record where they came from. */
function describeReport(r: BuyerReport): string {
  return `${r.description}\n[Reported by the customer via their plot link${r.sentOn ? `, sent ${formatDate(r.sentOn)}` : ''}]`
}

export function LogIssueSheet({
  plotId,
  initialType,
  initialReport,
  onClose,
  onLogged,
}: {
  plotId: string
  initialType: IssueType
  /** A report that arrived by link — the sheet opens filled in from it. */
  initialReport?: BuyerReport
  onClose: () => void
  onLogged: (msg: string) => void
}) {
  const { dispatch } = useStore()
  const plot = usePlot(plotId)
  const [type, setType] = useState<IssueType>(initialReport?.type ?? initialType)
  const [description, setDescription] = useState(initialReport ? describeReport(initialReport) : '')
  const [receivedOn, setReceivedOn] = useState(
    initialReport?.sentOn && initialReport.sentOn <= todayISO() ? initialReport.sentOn : todayISO()
  )
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  // The customer's report, once it has arrived by link or been decoded from a paste.
  const [report, setReport] = useState<BuyerReport | null>(initialReport ?? null)
  // Code 3.4: complaints can be combined into one, with the timetable running
  // from the first complaint received. null = start a separate complaint.
  const [combineWith, setCombineWith] = useState<string | null>(null)

  const meta = TYPES.find((t) => t.key === type)!
  const openComplaints = (plot?.issues || []).filter(
    (i) => i.type === 'complaint' && i.status === 'open'
  )

  // The description field doubles as the place to paste the customer's email.
  const onDescription = (value: string) => {
    setDescription(value)
    const code = extractCode(value)
    if (!code) return
    void decodeShare(code).then((decoded) => {
      if (!decoded || decoded.k !== 'report') return
      setReport(decoded)
      setType(decoded.type)
      setDescription(describeReport(decoded))
      if (decoded.sentOn && decoded.sentOn <= todayISO()) setReceivedOn(decoded.sentOn)
    })
  }

  const submit = () => {
    if (type === 'complaint' && combineWith) {
      const target = openComplaints.find((i) => i.id === combineWith)
      dispatch({
        type: 'APPEND_TO_COMPLAINT',
        plotId,
        issueId: combineWith,
        description,
        photoDataUrl: photo,
      })
      onLogged(`Added to complaint ${target?.reference || ''} — one timetable, from the first complaint`)
      return
    }
    dispatch({
      type: 'LOG_ISSUE',
      plotId,
      issueType: type,
      description,
      photoDataUrl: photo,
      receivedOn: receivedOn || undefined,
    })
    onLogged(
      report
        ? `${meta.label} logged from the customer's report`
        : type === 'snag'
          ? `${meta.label} logged — put right by ${formatDate(addDays(receivedOn || todayISO(), SNAG_PUT_RIGHT_DAYS))}`
          : type === 'complaint'
            ? `Complaint logged — acknowledge in writing by ${formatDate(addDays(nextBusinessDay(receivedOn || todayISO()), 5))}`
            : 'Emergency logged — deal with it now'
    )
  }

  return (
    <Sheet title={`Log a${type === 'emergency' ? 'n' : ''} ${meta.label.toLowerCase()}`} subtitle={report ? "From the customer's app. Check it, then log it." : 'Date, one line, optional photo.'} onClose={onClose}>

      <div
        className={`badge ${type}`}
        style={{
          marginBottom: 12,
          whiteSpace: 'normal',
          lineHeight: 1.5,
          textTransform: 'none',
          letterSpacing: '-0.005em',
          fontWeight: 500,
          fontSize: 13,
          padding: '9px 12px',
          borderRadius: 12,
          display: 'block',
        }}
      >
        {meta.blurb}
      </div>

      {report && (
        <div className="field">
          <label>Log as</label>
          <div className="type-picker" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {TYPES.map((t) => (
              <button
                key={t.key}
                className={`type-opt${type === t.key ? ` active ${t.key}` : ''}`}
                aria-pressed={type === t.key}
                onClick={() => setType(t.key)}
                style={{ fontSize: 12, padding: '10px 2px' }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="dictate-hint">The customer's app chose {TYPES.find((t) => t.key === report.type)?.label.toLowerCase()}. A snag reported to you is not automatically a complaint — change it if that is right.</div>
        </div>
      )}

      {type === 'complaint' && openComplaints.length > 0 && (
        <div className="field">
          <label>Is this part of an existing complaint?</label>
          <div className="stack" style={{ gap: 8 }}>
            <button
              className={`type-opt${combineWith === null ? ' active complaint' : ''}`}
              style={{ alignItems: 'flex-start', textAlign: 'left', padding: '10px 12px' }}
              onClick={() => setCombineWith(null)}
            >
              Start a separate complaint (its own timetable)
            </button>
            {openComplaints.map((c) => (
              <button
                key={c.id}
                className={`type-opt${combineWith === c.id ? ' active complaint' : ''}`}
                style={{ alignItems: 'flex-start', textAlign: 'left', padding: '10px 12px' }}
                onClick={() => setCombineWith(c.id)}
              >
                Add to {c.reference} — started {formatDate(c.startedAt)}
                <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>
                  One combined timetable, running from the first complaint
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <label>Photo (optional but recommended)</label>
        <PhotoField value={photo} onChange={setPhoto} />
      </div>

      <div className="field">
        <label>Date the customer reported it</label>
        <input type="date" value={receivedOn} max={todayISO()} onChange={(e) => setReceivedOn(e.target.value)} />
        {type === 'complaint' && (
          <div className="dictate-hint">The Code timescale runs from the first business day after this date.</div>
        )}
      </div>

      <div className="field">
        <label>Description</label>
        <DictationField
          value={description}
          onChange={onDescription}
          placeholder="One line — tap the mic to dictate"
          rows={3}
        />
        {report && (
          <div className="dictate-hint">
            From the customer's app{report.sentOn ? `, sent ${formatDate(report.sentOn)}` : ''}. Their words and date are kept.

          </div>
        )}
      </div>

      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={!description.trim()}>
          Log {type === 'snag' ? 'snag' : meta.label.toLowerCase()}
        </button>
      </div>
    </Sheet>
  )
}
