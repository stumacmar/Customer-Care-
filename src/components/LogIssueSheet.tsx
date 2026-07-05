/*
 * Log one of the three trigger types. Designed to take under 20 seconds on a
 * phone: pick type → photo → one-line voice/typed description → done. The app
 * then calculates every downstream deadline itself.
 */

import { useState } from 'react'
import { DictationField, PhotoField, Sheet } from './ui'
import { useStore } from '../state/store'
import { SNAG_PUT_RIGHT_DAYS } from '../lib/code'
import type { IssueType } from '../types'

const TYPES: { key: IssueType; label: string; ico: string; blurb: string }[] = [
  { key: 'snag', label: 'Snag', ico: '🔧', blurb: `Starts a ${SNAG_PUT_RIGHT_DAYS}-day put-right clock (Code 3.3).` },
  {
    key: 'complaint',
    label: 'Complaint',
    ico: '📣',
    blurb: 'Starts the formal complaints procedure: acknowledgement (5d), path to resolution (10d), assessment (30d), 8-week letter (56d).',
  },
  {
    key: 'emergency',
    label: 'Emergency',
    ico: '🚨',
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
  const [type, setType] = useState<IssueType>(initialType)
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<string | undefined>(undefined)

  const meta = TYPES.find((t) => t.key === type)!

  const submit = () => {
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
            <span className="ico">{t.ico}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className={`badge ${type}`} style={{ marginBottom: 12 }}>
        {meta.blurb}
      </div>

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
