/*
 * Audit export — the safety net.
 *
 * One button per plot produces the full compliance record: document checklist
 * status, every issue/clock, every letter, and the immutable timeline. This is
 * what gets handed to the NHQB compliance team (30-day response window), the
 * New Homes Ombudsman, or the developer's own insurer/legal adviser.
 *
 * Two formats:
 *   • CSV  — the timeline as a spreadsheet, for archiving / attaching
 *   • Print — a clean printable page the user saves as PDF from the browser
 */

import { clockForIssue } from './code'
import { formatDate, formatDateTime } from './dates'
import type { Plot } from '../types'

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function download(filename: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function safeName(plot: Plot): string {
  const base = (plot.address || 'plot').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')
  return base.toLowerCase().slice(0, 60) || 'plot'
}

/** Timeline as CSV. */
export function exportPlotCSV(plot: Plot): void {
  const rows: string[][] = [['Timestamp', 'Type', 'Summary', 'Detail']]
  for (const e of plot.timeline) {
    rows.push([formatDateTime(e.timestamp), e.type, e.summary, e.detail || ''])
  }
  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n')
  download(`${safeName(plot)}-compliance-timeline.csv`, 'text/csv;charset=utf-8', csv)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Open a clean, print-ready compliance record in a new window and trigger the
 * browser's print dialog (Save as PDF). No dependency on a PDF library.
 */
export function exportPlotPrintable(plot: Plot, developerName: string): void {
  const win = window.open('', '_blank', 'width=900,height=1200')
  if (!win) {
    alert('Please allow pop-ups to export the compliance record.')
    return
  }

  const docRows = plot.documents
    .map(
      (d) => `<tr>
        <td>${d.completed ? '✔' : '—'}</td>
        <td>${escapeHtml(d.label)}</td>
        <td>${d.completed ? formatDate(d.completedDate) : 'Outstanding'}</td>
        <td>${escapeHtml(d.note || d.fileName || '')}</td>
      </tr>`
    )
    .join('')

  const issueRows = plot.issues
    .map((i) => {
      const clock = clockForIssue(i)
      const status =
        i.status === 'open'
          ? clock
            ? clock.urgent
              ? 'OPEN — urgent'
              : `OPEN — ${clock.label}`
            : 'OPEN'
          : `${i.status.toUpperCase()} ${formatDate(i.resolvedAt)}`
      return `<tr>
        <td>${escapeHtml(i.reference || i.id)}</td>
        <td>${escapeHtml(i.type)}</td>
        <td>${escapeHtml(i.description)}</td>
        <td>${formatDate(i.startedAt)}</td>
        <td>${escapeHtml(status)}</td>
      </tr>`
    })
    .join('')

  const timelineRows = plot.timeline
    .map(
      (e) => `<tr>
        <td>${formatDateTime(e.timestamp)}</td>
        <td>${escapeHtml(e.summary)}${e.detail ? `<br><span class="muted">${escapeHtml(e.detail)}</span>` : ''}</td>
      </tr>`
    )
    .join('')

  const letterList = plot.letters
    .map((l) => `<li>${escapeHtml(l.title)} — ${formatDateTime(l.createdAt)}</li>`)
    .join('')

  const docsDone = plot.documents.filter((d) => d.completed).length

  win.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Customer communications record — ${escapeHtml(plot.address)}</title>
<style>
  * { box-sizing: border-box; }
  body { font: 13px/1.5 -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #111; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 28px 0 8px; border-bottom: 2px solid #111; padding-bottom: 4px; }
  .meta { color: #444; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
  th { background: #f2f2f2; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  .muted { color: #777; }
  .foot { margin-top: 32px; color: #777; font-size: 11px; }
  @media print { body { margin: 12mm; } button { display: none; } }
</style></head>
<body>
  <button onclick="window.print()" style="float:right;padding:8px 14px;">Save as PDF / Print</button>
  <h1>Customer Communications Record</h1>
  <div class="meta"><strong>Property:</strong> ${escapeHtml(plot.address || '—')}</div>
  <div class="meta"><strong>Customer(s):</strong> ${escapeHtml(plot.customerNames || '—')}</div>
  <div class="meta"><strong>Reservation:</strong> ${formatDate(plot.reservationDate)} &nbsp; <strong>Completion:</strong> ${formatDate(plot.completionDate)}</div>
  <div class="meta"><strong>Developer:</strong> ${escapeHtml(developerName || '—')}</div>
  <div class="meta"><strong>Record generated:</strong> ${formatDateTime(new Date().toISOString())}</div>

  <h2>Document checklist (${docsDone}/${plot.documents.length} complete)</h2>
  <table><thead><tr><th>Done</th><th>Document</th><th>Date</th><th>Note / file</th></tr></thead>
  <tbody>${docRows}</tbody></table>

  <h2>Issues &amp; clocks (${plot.issues.length})</h2>
  ${
    plot.issues.length
      ? `<table><thead><tr><th>Ref</th><th>Type</th><th>Description</th><th>Started</th><th>Status</th></tr></thead><tbody>${issueRows}</tbody></table>`
      : '<p class="muted">No issues logged.</p>'
  }

  <h2>Letters generated (${plot.letters.length})</h2>
  ${letterList ? `<ul>${letterList}</ul>` : '<p class="muted">No letters generated.</p>'}

  <h2>Full timeline (${plot.timeline.length} events)</h2>
  <table><thead><tr><th style="width:180px">When</th><th>Event</th></tr></thead>
  <tbody>${timelineRows}</tbody></table>

  <div class="foot">This record was generated by Plot Clock (Customer Communications Tracker). Timeline events are recorded at the time each action was taken.</div>
</body></html>`)
  win.document.close()
  win.focus()
}
