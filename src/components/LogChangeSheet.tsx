/*
 * Log a spec-and-changes entry in under 20 seconds: pick the kind, one line,
 * optional photo. Picking "Major change" makes the 14-day consequence explicit
 * before anything is saved (Code 2.9).
 */

import { useState } from 'react'
import { DictationField, PhotoField, Sheet } from './ui'
import { useStore } from '../state/store'
import { todayISO } from '../lib/dates'
import { id } from '../lib/storage'
import { CHANGE_KIND_META } from './ChangesSection'
import type { ChangeKind } from '../types'

const KINDS: ChangeKind[] = ['choice', 'extra', 'minor_change', 'major_change', 'delay']

const PLACEHOLDERS: Record<ChangeKind, string> = {
  choice: 'e.g. Front door confirmed: Anthracite grey, Suffolk style',
  extra: 'e.g. Quartz worktop upgrade ordered — £1,850 paid',
  minor_change: 'e.g. Bathroom tiles switched to equivalent range (supplier discontinued)',
  major_change: 'e.g. Kitchen/diner layout revised — window moved to side elevation',
  delay: 'e.g. Completion moved from June to August — brickwork delays',
}

export function LogChangeSheet({
  plotId,
  onClose,
  onLogged,
}: {
  plotId: string
  onClose: () => void
  onLogged: (msg: string, changeKind: ChangeKind, changeId: string) => void
}) {
  const { dispatch } = useStore()
  const [kind, setKind] = useState<ChangeKind>('choice')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO())
  const [photo, setPhoto] = useState<string | undefined>(undefined)

  const meta = CHANGE_KIND_META[kind]

  const submit = () => {
    if (!description.trim()) return
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
        ? 'Major change logged — 14-day cancellation window started'
        : `${meta.label} logged`,
      kind,
      changeId
    )
  }

  return (
    <Sheet
      title="Log to Spec & changes"
      subtitle="Choices, extras, changes and delays — the evidence trail."
      onClose={onClose}
    >
      <div className="type-picker" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
        {KINDS.map((k) => (
          <button
            key={k}
            className={`type-opt${kind === k ? ` active ${k === 'major_change' ? 'snag' : k === 'delay' ? 'emergency' : 'complaint'}` : ''}`}
            onClick={() => setKind(k)}
            style={{ fontSize: 12, padding: '10px 2px' }}
          >
            {CHANGE_KIND_META[k].label}
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

      <div className="field">
        <label>
          {kind === 'delay' ? 'Date the customer was told' : kind.endsWith('change') ? 'Date notified to the customer' : 'Date agreed / confirmed'}
        </label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="field">
        <label>What exactly? One clear line.</label>
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
    </Sheet>
  )
}
