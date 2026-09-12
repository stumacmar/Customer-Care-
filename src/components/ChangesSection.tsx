/*
 * Spec & changes — the evidence trail between reservation and completion:
 * customer choices ("front door in Anthracite confirmed"), paid extras,
 * developer changes (minor vs major — Code 2.9), and delays to the timetable
 * (Code 2.7/2.8). Logging a major change drafts the written notice the Code
 * requires; the customer's 14-day cancellation window starts when that notice
 * is recorded as received (2.9).
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
    blurb: 'A paid extra or upgrade the customer ordered. Keep the price and what was agreed. If it changes the timescale, tell the customer to take legal advice (Code 2.9).',
  },
  minor_change: {
    label: 'Change',
    badgeClass: 'complaint',
    blurb: 'A change you are making that is NOT major. Keep the customer informed; they cannot cancel for this.',
  },
  major_change: {
    label: 'Major change',
    badgeClass: 'snag',
    blurb: 'Significantly affects size, appearance or value (including internal layout). Call the customer, then tell them in writing — they can cancel within 14 days of receiving it for a full refund, and notice to complete cannot be served in that window.',
  },
  delay: {
    label: 'Delay',
    badgeClass: 'snag',
    blurb: 'The expected completion timetable has moved. Keep the customer informed — and update the expected completion date on this plot too.',
  },
  build_update: {
    label: 'Build update',
    badgeClass: 'complaint',
    blurb: 'A progress update given to the customer — the stage the build has reached and what happens next. Not a change to the home; the record that they were kept informed.',
  },
  visit: {
    label: 'Site visit',
    badgeClass: 'complaint',
    blurb: 'A trade or inspection appointment at the home. Record who, when, and the outcome — attended, no access, or turned away — with a photo of the job sheet if there is one. This is your evidence if attendance is disputed.',
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
          Log every choice, extra, change, delay, site visit and email here the moment it
          happens — front door colour confirmed, kitchen upgrade ordered, layout change
          notified. It becomes the evidence trail if a query is ever raised.
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
        <Icon name="plus" size={17} /> Log a choice, change, delay, visit or email
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
  const cancelBy = isMajor ? majorChangeCancelBy(change) : null
  const windowOpen = isMajor && !change.outcome && !!cancelBy && daysFromToday(cancelBy) >= 0

  return (
    <div className="card">
      <div className="issue-head">
        <span className={`badge ${meta.badgeClass}`}>{meta.label}</span>
        <span className="ref">{formatDate(change.date)}</span>
        {isMajor && !change.outcome && (
          <span className="badge snag" style={{ marginLeft: 'auto' }}>
            {!cancelBy
              ? 'notice not sent'
              : windowOpen
                ? `cancel window ${describeCountdown(daysFromToday(cancelBy)).replace('due ', 'ends ')}`
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
        {isMajor && !change.outcome && !!cancelBy && (
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
