/*
 * Log one of the three trigger types. Designed to take under 20 seconds on a
 * phone: pick type → photo → one-line voice/typed description → done. The app
 * then calculates every downstream deadline itself.
 */

import { useState } from 'react'
import { DictationField, PhotoField, Sheet } from './ui'
import { usePlot, useStore } from '../state/store'
import { SNAG_PUT_RIGHT_DAYS } from '../lib/code'
import { formatDate } from '../lib/dates'
import { Icon, type IconName } from './icons'
import type { IssueType } from '../types'

const TYPES: { key: IssueType; label: string; ico: IconName; blurb: string }[] = [
  { key: 'snag', label: 'Snag', ico: 'wrench', blurb: `Starts a ${SNAG_PUT_RIGHT_DAYS}-day put-right clock (Code 3.3).` },
  {
    key: 'complaint',
    label: 'Complaint',
    ico: 'megaphone',
    blurb: 'Starts the formal complaints procedure: acknowledgement (5d), path to resolution (10d), assessment (30d), 8-week letter (56d).',
  },
  {
    key: 'emergency',
    label: 'Emergency',
    ico: 'alert',
    blurb: 'Health/safety/wellbeing risk. Flagged urgent — never queued behind routine snags.',
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
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  // Code 3.4: complaints can be combined into one, with the timetable running
  // from the first complaint received. null = start a separate complaint.
  const [combineWith, setCombineWith] = useState<string | null>(null)

  const meta = TYPES.find((t) => t.key === type)!
  const openComplaints = (plot?.issues || []).filter(
    (i) => i.type === 'complaint' && i.status === 'open'
  )

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
    })
    onLogged(`${meta.label} logged — clock started`)
  }

  return (
    <Sheet title="Log something" subtitle="Under 20 seconds: type, photo, one line." onClose={onClose}>
      <div className="type-picker">
        {TYPES.map((t) => (
          <button
            key={t.key}
            className={`type-opt ${t.key}${type === t.key ? ' active' : ''}`}
            onClick={() => setType(t.key)}
          >
            <span className="ico"><Icon name={t.ico} size={22} /></span>
            {t.label}
          </button>
        ))}
      </div>

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
        <label>Description</label>
        <DictationField
          value={description}
          onChange={setDescription}
          placeholder="One line — tap the mic to dictate"
          rows={3}
        />
      </div>

      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={submit}>
          Log {meta.label.toLowerCase()}
        </button>
      </div>
    </Sheet>
  )
}
