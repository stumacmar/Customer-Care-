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
} from '../lib/code'
import { describeCountdown, formatDate } from '../lib/dates'
import { snagReminderText } from '../lib/letters'
import { downloadCalendar } from '../lib/ics'
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
        Issues &amp; clocks <span className="count-pill">{open.length} open</span>
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
  const clock = clockForIssue(issue)
  const isOpen = issue.status === 'open'

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
          Received {formatDate(issue.receivedAt)} · clock runs from {formatDate(issue.startedAt)} (first
          business day after receipt, per the Code)
        </div>
      )}
      {issue.type === 'emergency' && isOpen && (
        <div className="badge emergency" style={{ marginBottom: 8 }}>
          Health / safety / wellbeing risk — deal with this first.
        </div>
      )}

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

      {isOpen && !resolving && (
        <div className="wrap-actions" style={{ marginTop: 12 }}>
          <button className="btn btn-sm btn-primary" onClick={() => setResolving(true)}>
            {issue.type === 'complaint' ? 'Close complaint' : 'Mark resolved'}
          </button>
          <button
            className="btn btn-sm"
            onClick={() => {
              downloadCalendar(plot, issue)
              onToast('Calendar file downloaded — open it to add the reminders')
            }}
          >
            🗓 Remind me
          </button>
          {issue.type === 'snag' && (
            <button className="btn btn-sm" onClick={copyReminder}>
              📋 Copy reminder
            </button>
          )}
          {issue.type === 'complaint' && (
            <button className="btn btn-sm" onClick={() => onDraftLetter(issue, 'closure')}>
              ✉ Closure letter
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
                ✉ Draft
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
          {m.completed && <span className="badge rag-green">✓</span>}
        </div>
      ))}
    </div>
  )
}
