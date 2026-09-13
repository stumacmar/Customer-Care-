/*
 * Correspondence — emails with the customer, pasted into the plot's record
 * so the evidence trail doesn't live in Outlook. The Ombudsman bundle is
 * only complete if the emails are in it; ten seconds of pasting at the time
 * beats an evening of dragging at dispute time.
 *
 * Emails are logged from the plot's one "Log a choice, change, delay, visit
 * or email" button (LogChangeSheet); EmailFields is the form it shows. The
 * Android share target opens the same form on its own (LogEmailSheet).
 */

import { useState } from 'react'
import { DictationField, Sheet } from './ui'
import { usePlot, useStore } from '../state/store'
import { formatDate, todayISO } from '../lib/dates'
import type { Plot } from '../types'

const SHOW_COUNT = 3

export function CorrespondenceSection({ plot }: { plot: Plot }) {
  const [showAll, setShowAll] = useState(false)
  const items = plot.correspondence || []
  const visible = showAll ? items : items.slice(0, SHOW_COUNT)

  return (
    <div className="section">
      <h3>
        Correspondence{' '}
        {items.length > 0 && <span className="count-pill">{items.length}</span>}
      </h3>
      {items.length === 0 ? (
        <p className="muted" style={{ fontSize: 12.5, marginTop: 0 }}>
          Emails to and from the customer, logged the day they happen under "Log a choice,
          change, delay, visit or email". They join the timeline and the export.
        </p>
      ) : (
        <div className="stack" style={{ marginTop: 10 }}>
          {visible.map((c) => (
            <div key={c.id} className="card">
              <div className="issue-head">
                <span className={`badge ${c.direction === 'to_customer' ? 'resolved' : 'complaint'}`}>
                  {c.direction === 'to_customer' ? 'To customer' : 'From customer'}
                </span>
                <span className="ref">{formatDate(c.date)}</span>
                {c.issueId && (
                  <span className="ref" style={{ marginLeft: 'auto' }}>
                    re {plot.issues.find((i) => i.id === c.issueId)?.reference || 'issue'}
                  </span>
                )}
              </div>
              {c.subject && (
                <div style={{ fontWeight: 600, fontSize: 14, margin: '2px 0 4px' }}>{c.subject}</div>
              )}
              <p className="issue-desc" style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                {c.body.length > 260 ? `${c.body.slice(0, 259)}…` : c.body}
              </p>
            </div>
          ))}
          {items.length > SHOW_COUNT && (
            <button className="btn btn-sm btn-ghost btn-block" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show fewer' : `Show all ${items.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** The email form: direction, the email's own date, subject, body, and the complaint or snag it is about. */
export function EmailFields({
  plotId,
  initialBody,
  onClose,
  onLogged,
}: {
  plotId: string
  /** Pre-filled body — e.g. an email shared into the app from the mail client. */
  initialBody?: string
  onClose: () => void
  onLogged: (msg: string) => void
}) {
  const { dispatch } = useStore()
  const plot = usePlot(plotId)
  const [direction, setDirection] = useState<'to_customer' | 'from_customer'>('from_customer')
  const [date, setDate] = useState(todayISO())
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState(initialBody || '')
  const [issueId, setIssueId] = useState<string>('')
  // Emails about a live complaint or snag are filed under it, so the NHOS
  // bundle carries the whole exchange, not just the milestone letters.
  const openIssues = (plot?.issues || []).filter((i) => i.status === 'open')

  const submit = () => {
    if (!body.trim()) return
    dispatch({ type: 'LOG_CORRESPONDENCE', plotId, direction, date: date || todayISO(), subject, body, issueId: issueId || undefined })
    onLogged('Email logged to the record')
  }

  return (
    <>
      <div className="type-picker" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <button
          className={`type-opt${direction === 'from_customer' ? ' active complaint' : ''}`}
          onClick={() => setDirection('from_customer')}
        >
          From the customer
        </button>
        <button
          className={`type-opt${direction === 'to_customer' ? ' active complaint' : ''}`}
          onClick={() => setDirection('to_customer')}
        >
          To the customer
        </button>
      </div>

      <div className="field">
        <label>Date the email was sent</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {openIssues.length > 0 && (
        <div className="field">
          <label>About an open complaint or snag? (optional)</label>
          <select value={issueId} onChange={(e) => setIssueId(e.target.value)}>
            <option value="">General — not about a specific issue</option>
            {openIssues.map((i) => (
              <option key={i.id} value={i.id}>
                {i.reference} — {i.type}: {i.description.slice(0, 50)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label>Subject (optional)</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Re: kitchen visit Tuesday"
        />
      </div>

      <div className="field">
        <label>The email — paste the text</label>
        <DictationField
          value={body}
          onChange={setBody}
          placeholder="Copy the email in your mail app, then paste it here"
          rows={6}
        />
      </div>

      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={!body.trim()}>
          Log email
        </button>
      </div>
    </>
  )
}

/** The email form on its own sheet — used when an email is shared into the app from the mail client. */
export function LogEmailSheet({
  plotId,
  initialBody,
  onClose,
  onLogged,
}: {
  plotId: string
  initialBody?: string
  onClose: () => void
  onLogged: (msg: string) => void
}) {
  return (
    <Sheet
      title="Log an email"
      subtitle="Paste it verbatim — this is a copy of what was said, kept with the plot's evidence."
      onClose={onClose}
    >
      <EmailFields
        plotId={plotId}
        initialBody={initialBody}
        onClose={onClose}
        onLogged={(msg) => {
          onLogged(msg)
          onClose()
        }}
      />
    </Sheet>
  )
}
