/*
 * The plot's one button for everything that is not a snag, complaint or
 * emergency: choices, extras, changes, delays, build updates, site visits —
 * and emails with the customer. Pick the kind, one line, optional photo.
 * Picking "Major change" makes the 14-day consequence explicit before
 * anything is saved (Code 2.9).
 */

import { useState } from 'react'
import { DictationField, PhotoField, Sheet } from './ui'
import { useStore } from '../state/store'
import { todayISO } from '../lib/dates'
import { id } from '../lib/storage'
import { CHANGE_KIND_META } from './ChangesSection'
import { EmailFields } from './CorrespondenceSection'
import type { ChangeKind } from '../types'

export type LogKind = ChangeKind | 'email'

const KINDS: LogKind[] = ['choice', 'extra', 'minor_change', 'major_change', 'delay', 'build_update', 'visit', 'email']

const PLACEHOLDERS: Record<ChangeKind, string> = {
  choice: 'e.g. Front door confirmed: Anthracite grey, Suffolk style',
  extra: 'e.g. Quartz worktop upgrade ordered — £1,850 paid',
  minor_change: 'e.g. Bathroom tiles switched to equivalent range (supplier discontinued)',
  major_change: 'e.g. Kitchen/diner layout revised — window moved to side elevation',
  delay: 'e.g. Completion moved from June to August — brickwork delays',
  visit: 'e.g. Plumber attended 8:30–11:00, fixed S-001 — or: electrician 9am, no access, card left',
  build_update: 'e.g. Roof on and watertight; first fix starts next week — customer emailed with photos',
}

const EMAIL_BLURB =
  'An email to or from the customer, pasted verbatim with the date it was actually sent. It joins the timeline and the export, so the record carries the correspondence.'

export function LogChangeSheet({
  plotId,
  onClose,
  onLogged,
}: {
  plotId: string
  onClose: () => void
  onLogged: (msg: string, kind: LogKind, changeId: string) => void
}) {
  const { dispatch } = useStore()
  const [kind, setKind] = useState<LogKind>('choice')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO())
  const [photo, setPhoto] = useState<string | undefined>(undefined)

  const meta = kind === 'email' ? { label: 'Email', badgeClass: 'complaint', blurb: EMAIL_BLURB } : CHANGE_KIND_META[kind]

  const submit = () => {
    if (kind === 'email' || !description.trim()) return
    const changeId = id('chg_')
    dispatch({
      type: 'LOG_CHANGE',
      plotId,
      changeId,
      kind,
      description,
      date: date || todayISO(),
      photoDataUrl: photo,
    })
    onLogged(
      kind === 'major_change'
        ? 'Major change logged — call the customer, then send the written notice'
        : `${meta.label} logged`,
      kind,
      changeId
    )
  }

  return (
    <Sheet title="Log a choice, change, delay, visit or email" onClose={onClose}>
      <div className="type-picker" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        {KINDS.map((k) => (
          <button
            key={k}
            className={`type-opt${kind === k ? ` active ${k === 'major_change' || k === 'delay' ? 'snag' : 'complaint'}` : ''}`}
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            style={{ fontSize: 12, padding: '10px 2px' }}
          >
            {k === 'email' ? 'Email' : CHANGE_KIND_META[k].label}
          </button>
        ))}
      </div>

      <div
        className={`badge ${meta.badgeClass}`}
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
        }}
      >
        {meta.blurb}
      </div>

      {kind === 'email' ? (
        <EmailFields plotId={plotId} onClose={onClose} onLogged={(msg) => onLogged(msg, 'email', '')} />
      ) : (
        <>
          <div className="field">
            <label>
              {kind === 'visit' ? 'Date of the visit' : kind === 'major_change' ? 'Date the change was identified' : 'Date'}
            </label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="field">
            <label>What happened?</label>
            <DictationField
              value={description}
              onChange={setDescription}
              placeholder={PLACEHOLDERS[kind]}
              rows={3}
            />
          </div>

          <div className="field">
            <label>Photo / drawing (optional)</label>
            <PhotoField value={photo} onChange={setPhoto} />
          </div>

          <div className="sheet-actions">
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={submit} disabled={!description.trim()}>
              Log {meta.label.toLowerCase()}
            </button>
          </div>
        </>
      )}
    </Sheet>
  )
}
