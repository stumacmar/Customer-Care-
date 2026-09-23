/*
 * A customer's report has arrived by link but the app could not open it on
 * a plot by itself: either this phone has no plots (the link opened in a web
 * browser rather than the app on the home screen), or none of the plots here
 * match. Show the report and the one thing to do next.
 */

import { Sheet } from './ui'
import { formatDate } from '../lib/dates'
import { reportLink, type BuyerReport } from '../lib/share'
import type { IssueType, Plot } from '../types'

const TYPE_LABEL: Record<IssueType, string> = {
  snag: 'Snag or defect',
  complaint: 'Complaint',
  emergency: 'Emergency',
}

export function IncomingReportSheet({
  report,
  code,
  plots,
  onPick,
  onClose,
  onToast,
}: {
  report: BuyerReport
  /** The report's share code, so "Copy the report" carries something the app can decode. */
  code: string
  plots: Plot[]
  onPick: (plotId: string) => void
  onClose: () => void
  onToast: (msg: string) => void
}) {
  const copy = async () => {
    const text =
      `${TYPE_LABEL[report.type]} — ${report.address}\n` +
      `From ${report.customerNames || 'the customer'}, sent ${formatDate(report.sentOn)}\n\n` +
      `${report.description}\n\n${reportLink(code)}`
    try {
      await navigator.clipboard.writeText(text)
      onToast('Report copied — open New Home Tracker, tap Snag, Complaint or Emergency, and paste')
    } catch {
      onToast('Could not copy — select the text and copy it instead')
    }
  }

  return (
    <Sheet
      title={`Report from ${report.customerNames || 'your customer'}`}
      subtitle={`${TYPE_LABEL[report.type]} · ${report.address} · sent ${formatDate(report.sentOn)}`}
      onClose={onClose}
    >
      <div className="card" style={{ marginBottom: 12 }}>
        <p className="issue-desc" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{report.description}</p>
      </div>

      {plots.length === 0 ? (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            This phone has no plots in New Home Tracker, so the report cannot be logged here. If the
            app is on your home screen, open it there: tap Snag, Complaint or Emergency on the
            plot and paste this report in.
          </p>
          <button className="btn btn-primary btn-block" onClick={() => void copy()}>
            Copy the report
          </button>
          <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={onClose}>
            Close
          </button>
        </>
      ) : (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            Which plot is this report about?
          </p>
          <div className="stack" style={{ marginBottom: 10 }}>
            {plots.map((p) => (
              <button
                key={p.id}
                className="card"
                style={{ textAlign: 'left', width: '100%' }}
                onClick={() => onPick(p.id)}
              >
                <div style={{ fontWeight: 700 }}>{p.address}</div>
                <div className="muted" style={{ fontSize: 13 }}>{p.customerNames}</div>
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-block" onClick={onClose}>
            Not now
          </button>
        </>
      )}
    </Sheet>
  )
}
