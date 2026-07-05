/*
 * Date helpers. Dates that drive clocks are stored as ISO date strings
 * (YYYY-MM-DD) so day arithmetic is stable regardless of timezone. Timestamps
 * on timeline events keep the full ISO datetime.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Today as an ISO date string (YYYY-MM-DD) in local time. */
export function todayISO(): string {
  const now = new Date()
  return toISODate(now)
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseISODate(iso: string): Date {
  // Parse as local midnight to avoid timezone drift.
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Whole days from `fromIso` to `toIso`. Positive if `toIso` is later. */
export function diffDays(fromIso: string, toIso: string): number {
  const a = parseISODate(fromIso).getTime()
  const b = parseISODate(toIso).getTime()
  return Math.round((b - a) / MS_PER_DAY)
}

/** Days from today until `iso`. Negative = in the past (overdue). */
export function daysFromToday(iso: string): number {
  return diffDays(todayISO(), iso)
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** e.g. "5 Jul 2026". Returns '—' for empty input. */
export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = parseISODate(iso.slice(0, 10))
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** e.g. "5 Jul 2026, 14:32". For timeline datetime stamps. */
export function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${time}`
}

/** Human phrasing of a day countdown, e.g. "in 3 days", "today", "2 days overdue". */
export function describeCountdown(days: number): string {
  if (days === 0) return 'due today'
  if (days === 1) return 'due tomorrow'
  if (days > 1) return `due in ${days} days`
  if (days === -1) return '1 day overdue'
  return `${Math.abs(days)} days overdue`
}
