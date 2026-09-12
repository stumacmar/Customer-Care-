/*
 * Log one of the three trigger types. Designed to take under 20 seconds on a
 * phone: pick type → photo → one-line voice/typed description → done. The app
 * then calculates every downstream deadline itself.
 *
 * A report from the customer's app arrives by email carrying a small code.
 * Paste that email into the description of any of the three and the sheet
 * decodes it: the customer's own words and the date they sent it are kept,
 * and if their app sent it as a different type the sheet switches to match.
 */

import { useState } from 'react'
import { DictationField, PhotoField, Sheet } from './ui'
import { usePlot, useStore } from '../state/store'
import { SNAG_PUT_RIGHT_DAYS } from '../lib/code'
import { addDays, formatDate, todayISO } from '../lib/dates'
import { decodeShare, extractCode, type BuyerReport } from '../lib/share'
import type { IconName } from './icons'
import type { IssueType } from '../types'

const TYPES: { key: IssueType; label: string; ico: IconName; blurb: string }[] = [
  { key: 'snag', label: 'Snag or defect', ico: 'wrench', blurb: `Put right within ${SNAG_PUT_RIGHT_DAYS} days of the report, or explain the delay and update the customer monthly (Code 3.3).` },
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

export function LogIssueSheet({
  plotId,
  initialType,
  onClose,
  onLogged,
}: {
  plotId: string
  initialType: IssueType
  onClose: () => void
  onLogged: (msg: string) => void
}) {
  const { dispatch } = useStore()
  const plot = usePlot(plotId)
  const [type, setType] = useState<IssueType>(initialType)
  const [description, setDescription] = useState('')
  const [receivedOn, setReceivedOn] = useState(todayISO())
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  // Set once a pasted customer report has been decoded into the fields.
  const [report, setReport] = useState<BuyerReport | null>(null)
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
      setDescription(
        `${decoded.description}\n[Reported by the customer via their plot link` +
          `${decoded.sentOn ? `, sent ${formatDate(decoded.sentOn)}` : ''}]`
      )
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
            ? 'Complaint logged — acknowledge in writing within 5 days'
            : 'Emergency logged — deal with it now'
    )
  }

  return (
    <Sheet title={`Log a${type === 'emergency' ? 'n' : ''} ${meta.label.toLowerCase()}`} subtitle="Date, one line, optional photo — or paste the email from the customer's app." onClose={onClose}>

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
          placeholder="One line — tap the mic to dictate, or paste the email from the customer's app"
          rows={3}
        />
        {report && (
          <div className="dictate-hint">
            From the customer's app{report.sentOn ? `, sent ${formatDate(report.sentOn)}` : ''}. Their words and date are kept.
            {report.type !== initialType && ` Their app sent it as a${report.type === 'emergency' ? 'n' : ''} ${meta.label.toLowerCase()}, so it is logged as one.`}
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
