/*
 * Live clocks + issue detail for a plot.
 *
 * Open issues sort to the top, most urgent first. A snag shows its 30-day
 * put-right countdown; a complaint shows its milestone ladder with a "Draft
 * letter" button on each Code-mandated step; an emergency is flagged urgent
 * with no fixed clock. Resolved issues collapse to the bottom for the record.
 */

import { useState } from 'react'
import { useStore } from '../state/store'
import {
  clockForIssue,
  computeComplaintMilestones,
  snagUpdateSchedule,
} from '../lib/code'
import { describeCountdown, formatDate } from '../lib/dates'
import { snagReminderText } from '../lib/letters'
import { downloadCalendar } from '../lib/ics'
import { Icon } from './icons'
import type { Issue, Plot } from '../types'

export function IssueSection({
  plot,
  onDraftLetter,
  onToast,
}: {
  plot: Plot
  onDraftLetter: (issue: Issue, milestoneKey?: string) => void
  onToast: (msg: string) => void
}) {
  const open = plot.issues.filter((i) => i.status === 'open')
  const closed = plot.issues.filter((i) => i.status !== 'open')

  return (
    <div className="section">
      <h3>
        Issues &amp; deadlines <span className="count-pill">{open.length} open</span>
      </h3>

      {plot.issues.length === 0 ? (
        <div className="card muted">
          Nothing logged yet. Use the three buttons above the moment something comes up.
        </div>
      ) : (
        <div className="stack">
          {open.map((issue) => (
            <IssueCard
              key={issue.id}
              plot={plot}
              issue={issue}
              onDraftLetter={onDraftLetter}
              onToast={onToast}
            />
          ))}
          {closed.map((issue) => (
            <IssueCard
              key={issue.id}
              plot={plot}
              issue={issue}
              onDraftLetter={onDraftLetter}
              onToast={onToast}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function IssueCard({
  plot,
  issue,
  onDraftLetter,
  onToast,
}: {
  plot: Plot
  issue: Issue
  onDraftLetter: (issue: Issue, milestoneKey?: string) => void
  onToast: (msg: string) => void
}) {
  const { state, dispatch } = useStore()
  const [resolving, setResolving] = useState(false)
  const [note, setNote] = useState('')
  const [noting, setNoting] = useState(false)
  const [newNote, setNewNote] = useState('')
  const clock = clockForIssue(issue)
  const isOpen = issue.status === 'open'
  // Everything filed against this issue between the milestones — phone calls
  // noted, emails logged — so the record is the whole exchange.
  const record = plot.timeline.filter(
    (e) => e.issueId === issue.id && (e.type === 'note' || e.type === 'correspondence_logged')
  )

  const addNote = () => {
    if (!newNote.trim()) return
    dispatch({ type: 'ADD_NOTE', plotId: plot.id, note: newNote, issueId: issue.id })
    setNewNote('')
    setNoting(false)
    onToast('Note added to the record')
  }

  const resolve = () => {
    dispatch({ type: 'RESOLVE_ISSUE', plotId: plot.id, issueId: issue.id, note })
    setResolving(false)
    setNote('')
    onToast('Marked resolved')
  }

  const copyReminder = async () => {
    try {
      await navigator.clipboard.writeText(snagReminderText(plot, issue, state.developerName))
      onToast('Reminder copied')
    } catch {
      onToast('Could not copy')
    }
  }

  return (
    <div className="card" style={{ opacity: isOpen ? 1 : 0.7 }}>
      <div className="issue-head">
        <span className={`badge ${issue.type}`}>{issue.type}</span>
        <span className="ref">{issue.reference}</span>
        <span style={{ flex: 1 }} />
        {!isOpen && <span className="badge resolved">resolved</span>}
        {isOpen && clock && !clock.urgent && clock.daysRemaining !== undefined && (
          <span className={`badge rag-${clock.rag}`}>{describeCountdown(clock.daysRemaining)}</span>
        )}
        {isOpen && clock?.urgent && <span className="badge emergency">urgent</span>}
      </div>

      {issue.photoDataUrl && <img className="issue-photo" src={issue.photoDataUrl} alt="Logged" />}
      <p className="issue-desc">{issue.description || <span className="muted">No description</span>}</p>

      {isOpen && clock && !clock.urgent && clock.dueDate && (
        <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
          {clock.label} — due {formatDate(clock.dueDate)}
        </div>
      )}
      {issue.type === 'complaint' && issue.receivedAt && issue.receivedAt !== issue.startedAt && (
        <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
          Received {formatDate(issue.receivedAt)} · timescale runs from {formatDate(issue.startedAt)} (first
          business day after receipt, per the Code)
        </div>
      )}
      {issue.type === 'emergency' && isOpen && (
        <div className="badge emergency" style={{ marginBottom: 8 }}>
          Health / safety / wellbeing risk — deal with this first.
        </div>
      )}

      {issue.type === 'snag' && isOpen && <SnagUpdates plot={plot} issue={issue} />}

      {issue.type === 'complaint' && <ComplaintMilestones plot={plot} issue={issue} onDraftLetter={onDraftLetter} />}

      {!isOpen && issue.resolutionNote && (
        <div className="muted" style={{ fontSize: 13 }}>
          Resolution: {issue.resolutionNote}
        </div>
      )}
      {!isOpen && (
        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          Resolved {formatDate(issue.resolvedAt)}
        </div>
      )}

      {record.length > 0 && (
        <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
          {record.slice(0, 3).map((e) => (
            <div key={e.id} style={{ marginBottom: 3 }}>
              <span style={{ opacity: 0.7 }}>{formatDate(e.timestamp.slice(0, 10))}</span> · {e.summary}
            </div>
          ))}
          {record.length > 3 && <div style={{ opacity: 0.7 }}>+{record.length - 3} more in the timeline</div>}
        </div>
      )}

      {isOpen && noting && (
        <div style={{ marginTop: 10 }}>
          <textarea
            rows={2}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="e.g. Phoned Mr Ali 10:15 — agreed the plumber returns Thursday"
          />
          <div className="wrap-actions" style={{ marginTop: 8 }}>
            <button className="btn btn-sm btn-primary" onClick={addNote} disabled={!newNote.trim()}>
              Add to the record
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => setNoting(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {isOpen && !resolving && !noting && (
        <div className="wrap-actions" style={{ marginTop: 12 }}>
          <button className="btn btn-sm btn-primary" onClick={() => setResolving(true)}>
            {issue.type === 'complaint' ? 'Close complaint' : 'Mark resolved'}
          </button>
          <button className="btn btn-sm" onClick={() => setNoting(true)}>
            <Icon name="edit" size={16} /> Add a note
          </button>
          <button
            className="btn btn-sm"
            onClick={() => {
              downloadCalendar(plot, issue)
              onToast('Calendar file downloaded — open it to add the reminders')
            }}
          >
            <Icon name="calendar" size={16} /> Remind me
          </button>
          {issue.type === 'snag' && (
            <button className="btn btn-sm" onClick={copyReminder}>
              <Icon name="copy" size={16} /> Copy reminder
            </button>
          )}
          {issue.type === 'complaint' && (
            <button className="btn btn-sm" onClick={() => onDraftLetter(issue, 'closure')}>
              <Icon name="mail" size={16} /> Closure letter
            </button>
          )}
        </div>
      )}

      {isOpen && resolving && (
        <div style={{ marginTop: 12 }}>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was done to put it right? (optional)"
          />
          <div className="wrap-actions" style={{ marginTop: 8 }}>
            <button className="btn btn-sm btn-primary" onClick={resolve}>
              Confirm resolved
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => setResolving(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <div style={{ marginTop: 10 }}>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => dispatch({ type: 'REOPEN_ISSUE', plotId: plot.id, issueId: issue.id })}
          >
            Re-open
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Monthly-update reminders for a snag that has run past its 30-day put-right
 * window — the Code requires the customer to be updated at least once a month
 * until the matter is settled, and this is the row that makes sure it happens.
 */
function SnagUpdates({ plot, issue }: { plot: Plot; issue: Issue }) {
  const { dispatch } = useStore()
  const schedule = snagUpdateSchedule(issue)
  if (schedule.length === 0) return null

  return (
    <div className="milestones">
      {schedule.map((u) => (
        <div key={u.key} className={`milestone rag-${u.completed ? 'green' : u.daysRemaining < 0 ? 'red' : u.daysRemaining <= 5 ? 'amber' : 'green'}${u.completed ? ' done' : ''}`}>
          <div className="m-info">
            <div className="m-label">Monthly update to customer #{u.n}</div>
            <div className="m-due">
              {u.completed
                ? `Sent ${formatDate(u.completedDate)}`
                : `Due ${formatDate(u.dueDate)} · ${describeCountdown(u.daysRemaining)}`}
            </div>
          </div>
          {!u.completed && (
            <button
              className="btn btn-sm"
              onClick={() =>
                dispatch({
                  type: 'COMPLETE_MILESTONE',
                  plotId: plot.id,
                  issueId: issue.id,
                  milestoneKey: u.key,
                  milestoneLabel: `Monthly update on delayed snag (${issue.reference || ''})`,
                })
              }
            >
              Update sent
            </button>
          )}
          {u.completed && (
            <span className="badge rag-green" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Icon name="check" size={14} strokeWidth={2.4} />
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function ComplaintMilestones({
  plot,
  issue,
  onDraftLetter,
}: {
  plot: Plot
  issue: Issue
  onDraftLetter: (issue: Issue, milestoneKey?: string) => void
}) {
  const { dispatch } = useStore()
  const milestones = computeComplaintMilestones(issue)

  return (
    <div className="milestones">
      {milestones.map((m) => (
        <div key={m.key} className={`milestone rag-${m.rag}${m.completed ? ' done' : ''}`}>
          <div className="m-info">
            <div className="m-label">{m.label}</div>
            <div className="m-due">
              {m.completed
                ? `Done ${formatDate(m.completedDate)}`
                : `Due ${formatDate(m.dueDate)} · ${describeCountdown(m.daysRemaining)}`}
            </div>
          </div>
          {!m.completed &&
            (m.hasLetter ? (
              <button className="btn btn-sm btn-primary" onClick={() => onDraftLetter(issue, m.key)}>
                <Icon name="mail" size={16} /> Draft
              </button>
            ) : (
              <button
                className="btn btn-sm"
                onClick={() =>
                  dispatch({
                    type: 'COMPLETE_MILESTONE',
                    plotId: plot.id,
                    issueId: issue.id,
                    milestoneKey: m.key,
                    milestoneLabel: m.label,
                  })
                }
              >
                Mark done
              </button>
            ))}
          {m.completed && (
            <span className="badge rag-green" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Icon name="check" size={14} strokeWidth={2.4} />
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
