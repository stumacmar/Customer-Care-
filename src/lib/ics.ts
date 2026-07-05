/*
 * Calendar reminders — the simple answer to "how does he know time is closing
 * in" without building any server or notification infrastructure.
 *
 * One tap on an issue downloads a standard .ics calendar file containing every
 * remaining deadline for that clock, each with built-in alerts (3 days before
 * and on the morning it's due). The phone's own calendar then does the
 * nagging — which it is far better at than any web app could be.
 */

import { addDays, todayISO } from './dates'
import { SNAG_PUT_RIGHT_DAYS, computeComplaintMilestones } from './code'
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
    'PRODID:-//Plot Clock//NHQB Compliance Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.map(vevent),
    'END:VCALENDAR',
  ].join('\r\n')

  const safe = (issue.reference || issue.type).toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return { filename: `plot-clock-deadlines-${safe}.ics`, content }
}

export function downloadCalendar(plot: Plot, issue: Issue): boolean {
  const built = buildIssueCalendar(plot, issue)
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
