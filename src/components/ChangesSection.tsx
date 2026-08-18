/*
 * Spec & changes — the evidence trail between reservation and completion:
 * customer choices ("front door in Anthracite confirmed"), paid extras,
 * developer changes (minor vs major — Code 2.9), and delays to the timetable
 * (Code 2.6/2.8). Logging a major change starts the customer's 14-day
 * cancellation window automatically and offers the written notice the Code
 * requires.
 */

import { useState } from 'react'
import { majorChangeCancelBy } from '../lib/code'
import { describeCountdown, daysFromToday, formatDate } from '../lib/dates'
import { useStore } from '../state/store'
import { Icon } from './icons'
import type { ChangeKind, ChangeRecord, Plot } from '../types'

export const CHANGE_KIND_META: Record<
  ChangeKind,
  { label: string; badgeClass: string; blurb: string }
> = {
  choice: {
    label: 'Choice',
    badgeClass: 'rag-green',
    blurb: 'A customer choice or confirmation — e.g. front door colour and style.',
  },
  extra: {
    label: 'Extra',
    badgeClass: 'rag-green',
    blurb: 'A paid extra or upgrade the customer ordered. Keep the price and what was agreed.',
  },
  minor_change: {
    label: 'Change',
    badgeClass: 'complaint',
    blurb: 'A change you are making that is NOT major. Code 2.9: keep the customer informed; they cannot cancel for this.',
  },
  major_change: {
    label: 'Major change',
    badgeClass: 'snag',
    blurb: 'Significantly affects size, appearance or value (incl. internal layout). Code 2.9: written notice required — the customer can cancel within 14 days for a full refund, and notice to complete cannot be served in that window.',
  },
  delay: {
    label: 'Delay',
    badgeClass: 'emergency',
    blurb: 'The expected completion timetable has moved. Code 2.6/2.8: keep the customer informed — update the expected completion date on this plot too.',
  },
}

export function ChangesSection({
  plot,
  onLogChange,
  onDraftLetter,
  onResolveMajorChange,
}: {
  plot: Plot
  onLogChange: () => void
  onDraftLetter: (change: ChangeRecord) => void
  onResolveMajorChange: (changeId: string) => void
}) {
  const { dispatch } = useStore()
  const [showAll, setShowAll] = useState(false)

  const sorted = [...plot.changes].sort((a, b) => (a.date < b.date ? 1 : -1))
  const visible = showAll ? sorted : sorted.slice(0, 4)

  const remove = (c: ChangeRecord) => {
    if (!confirm(`Remove "${c.description.slice(0, 60)}" from the log? The timeline keeps a note that it was removed.`)) return
    dispatch({ type: 'DELETE_CHANGE', plotId: plot.id, changeId: c.id })
  }

  return (
    <div className="section">
      <h3>
        Spec &amp; changes <span className="count-pill">{plot.changes.length}</span>
      </h3>

      {plot.changes.length === 0 ? (
        <div className="card muted">
          Log every choice, extra, change and delay here the moment it happens — front door
          colour confirmed, kitchen upgrade ordered, layout change notified. It becomes the
          evidence trail if a query is ever raised.
        </div>
      ) : (
        <div className="stack">
          {visible.map((c) => (
            <ChangeCard
              key={c.id}
              change={c}
              onDraftLetter={() => onDraftLetter(c)}
              onResolve={() => onResolveMajorChange(c.id)}
              onRemove={() => remove(c)}
            />
          ))}
          {sorted.length > 4 && (
            <button className="btn btn-sm btn-ghost btn-block" onClick={() => setShowAll((s) => !s)}>
              {showAll ? 'Show fewer' : `Show all ${sorted.length}`}
            </button>
          )}
        </div>
      )}

      <button className="btn btn-block" style={{ marginTop: 10 }} onClick={onLogChange}>
        <Icon name="plus" size={17} /> Log a choice, extra, change or delay
      </button>
    </div>
  )
}

function ChangeCard({
  change,
  onDraftLetter,
  onResolve,
  onRemove,
}: {
  change: ChangeRecord
  onDraftLetter: () => void
  onResolve: () => void
  onRemove: () => void
}) {
  const meta = CHANGE_KIND_META[change.kind]
  const isMajor = change.kind === 'major_change'
  const windowOpen = isMajor && !change.outcome && daysFromToday(majorChangeCancelBy(change)) >= 0

  return (
    <div className="card">
      <div className="issue-head">
        <span className={`badge ${meta.badgeClass}`}>{meta.label}</span>
        <span className="ref">{formatDate(change.date)}</span>
        {isMajor && !change.outcome && (
          <span className="badge snag" style={{ marginLeft: 'auto' }}>
            {windowOpen
              ? `cancel window ${describeCountdown(daysFromToday(majorChangeCancelBy(change))).replace('due ', 'ends ')}`
              : 'record outcome'}
          </span>
        )}
        {isMajor && change.outcome && (
          <span className={`badge ${change.outcome === 'accepted' ? 'resolved' : 'emergency'}`} style={{ marginLeft: 'auto' }}>
            {change.outcome === 'accepted' ? 'accepted' : 'customer cancelled'}
          </span>
        )}
      </div>
      <div className="issue-desc" style={{ marginBottom: change.photoDataUrl ? 10 : 6 }}>
        {change.description}
      </div>
      {change.photoDataUrl && <img className="issue-photo" src={change.photoDataUrl} alt="Change record" />}
      <div className="wrap-actions">
        {(change.kind === 'major_change' || change.kind === 'delay') && (
          <button className="btn btn-sm btn-primary" onClick={onDraftLetter}>
            <Icon name="mail" size={15} /> {change.kind === 'delay' ? 'Draft update' : 'Draft written notice'}
          </button>
        )}
        {isMajor && !change.outcome && (
          <button className="btn btn-sm" onClick={onResolve}>
            Record outcome
          </button>
        )}
        <button className="btn btn-sm btn-ghost" onClick={onRemove} aria-label="Remove entry">
          <Icon name="trash" size={15} />
        </button>
      </div>
    </div>
  )
}
