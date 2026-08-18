/*
 * Calendar reminders — the simple answer to "how does he know time is closing
 * in" without building any server or notification infrastructure.
 *
 * One tap on an issue downloads a standard .ics calendar file containing every
 * remaining deadline for that clock, each with built-in alerts (3 days before
 * and on the morning it's due). The phone's own calendar then does the
 * nagging — which it is far better at than any web app could be.
 */

import { addDays, daysFromToday, todayISO } from './dates'
import {
  computeComplaintMilestones,
  CONTRACT_REFUND_DAYS,
  majorChangeCancelBy,
  plotStage,
  RESERVATION_REFUND_DAYS,
  SNAG_PUT_RIGHT_DAYS,
} from './code'
import type { Issue, Plot } from '../types'

function icsDate(iso: string): string {
  return iso.replace(/-/g, '')
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

interface CalEvent {
  uid: string
  date: string // ISO date (all-day event)
  summary: string
  description: string
}

function vevent(e: CalEvent): string {
  return [
    'BEGIN:VEVENT',
    `UID:${e.uid}@plotclock`,
    `DTSTAMP:${icsDate(todayISO())}T000000Z`,
    `DTSTART;VALUE=DATE:${icsDate(e.date)}`,
    `DTEND;VALUE=DATE:${icsDate(addDays(e.date, 1))}`,
    `SUMMARY:${esc(e.summary)}`,
    `DESCRIPTION:${esc(e.description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P3D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(`3 days left: ${e.summary}`)}`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT15H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(`Due today: ${e.summary}`)}`,
    'END:VALARM',
    'END:VEVENT',
  ].join('\r\n')
}

/** Build the .ics content for an issue's remaining deadlines. */
export function buildIssueCalendar(plot: Plot, issue: Issue): { filename: string; content: string } | null {
  const events: CalEvent[] = []
  const where = plot.address || 'plot'

  if (issue.type === 'snag') {
    const due = addDays(issue.startedAt, SNAG_PUT_RIGHT_DAYS)
    events.push({
      uid: `${issue.id}-snag`,
      date: due,
      summary: `Snag deadline — ${where}`,
      description: `30-day put-right deadline (${issue.reference || ''}): ${issue.description}`,
    })
  } else if (issue.type === 'complaint') {
    for (const m of computeComplaintMilestones(issue)) {
      if (m.completed) continue
      events.push({
        uid: `${issue.id}-${m.key}`,
        date: m.dueDate,
        summary: `${m.label} due — ${where}`,
        description: `Complaint ${issue.reference || ''} (New Homes Quality Code deadline): ${issue.description}`,
      })
    }
  } else {
    // Emergencies have no Code deadline — remind for tomorrow so it can't slip.
    events.push({
      uid: `${issue.id}-emergency`,
      date: addDays(todayISO(), 1),
      summary: `EMERGENCY still open — ${where}`,
      description: `Urgent health/safety issue (${issue.reference || ''}): ${issue.description}`,
    })
  }

  if (events.length === 0) return null

  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NHQB//Quality Code Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.map(vevent),
    'END:VCALENDAR',
  ].join('\r\n')

  const safe = (issue.reference || issue.type).toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return { filename: `nhqb-deadlines-${safe}.ics`, content }
}

function wrap(events: CalEvent[], filename: string): { filename: string; content: string } | null {
  if (events.length === 0) return null
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NHQB//Quality Code Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.map(vevent),
    'END:VCALENDAR',
  ].join('\r\n')
  return { filename, content }
}

/**
 * Build the .ics content for a plot's upcoming journey deadlines — the
 * pre-completion dates the developer would otherwise have to keep in their
 * head: exchange-by, open major-change windows, refunds after a cancellation,
 * and the completion date itself.
 */
export function buildJourneyCalendar(plot: Plot): { filename: string; content: string } | null {
  const events: CalEvent[] = []
  const where = plot.address || 'plot'
  const stage = plotStage(plot)

  if (plot.cancellation && !plot.cancellation.refundedDate) {
    const isContract = plot.cancellation.kind === 'contract'
    events.push({
      uid: `${plot.id}-refund`,
      date: addDays(plot.cancellation.date, isContract ? CONTRACT_REFUND_DAYS : RESERVATION_REFUND_DAYS),
      summary: `Refund due — ${where}`,
      description: isContract
        ? 'Refund the contract deposit and any other amounts due (within 28 days of cancellation).'
        : 'Refund the reservation fee, less any agreed deductions (within 14 days of the notice).',
    })
  }
  if (stage === 'reserved' && plot.exchangeDeadline && daysFromToday(plot.exchangeDeadline) >= 0) {
    events.push({
      uid: `${plot.id}-exchange`,
      date: plot.exchangeDeadline,
      summary: `Exchange contracts by today — ${where}`,
      description: 'The exchange-by date agreed in the Reservation Agreement. If it passes, agree a new date with the customer in writing.',
    })
  }
  for (const c of plot.changes) {
    if (c.kind !== 'major_change' || c.outcome) continue
    const cancelBy = majorChangeCancelBy(c)
    if (daysFromToday(cancelBy) < 0) continue
    events.push({
      uid: `${plot.id}-${c.id}-window`,
      date: cancelBy,
      summary: `Major-change window closes — ${where}`,
      description: `Last day the customer can cancel over the major change (${c.description.slice(0, 80)}). Notice to complete cannot be served before this date. Record the outcome afterwards.`,
    })
  }
  if (plot.completionDate && daysFromToday(plot.completionDate) >= 0 && stage !== 'cancelled') {
    events.push({
      uid: `${plot.id}-completion`,
      date: plot.completionDate,
      summary: `Completion — ${where}`,
      description: 'Handover day: final quality check done, documents handed over, home demonstration booked, pre-completion inspection offered.',
    })
  }

  const safe = (plot.address || 'plot').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
  return wrap(events, `nhqb-journey-${safe}.ics`)
}

function downloadIcs(built: { filename: string; content: string } | null): boolean {
  if (!built) return false
  const blob = new Blob([built.content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = built.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return true
}

export function downloadCalendar(plot: Plot, issue: Issue): boolean {
  return downloadIcs(buildIssueCalendar(plot, issue))
}

export function downloadJourneyCalendar(plot: Plot): boolean {
  return downloadIcs(buildJourneyCalendar(plot))
}
