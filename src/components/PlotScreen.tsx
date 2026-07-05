/*
 * The one screen per plot. Everything lives here: the three impossible-to-miss
 * log buttons, the live clocks + issues, the document checklist, the timeline,
 * and the audit export. Nothing competes visually with the three buttons.
 */

import { useState } from 'react'
import { usePlot } from '../state/store'
import { plotStatus, ragLabel } from '../lib/status'
import { formatDate } from '../lib/dates'
import { exportPlotCSV, exportPlotPrintable } from '../lib/export'
import { useStore } from '../state/store'
import { DocumentChecklist } from './DocumentChecklist'
import { IssueSection } from './IssueSection'
import { Timeline } from './Timeline'
import { LogIssueSheet } from './LogIssueSheet'
import { LetterSheet } from './LetterSheet'
import { EditPlotSheet } from './EditPlotSheet'
import type { Issue, IssueType } from '../types'

export function PlotScreen({
  plotId,
  onBack,
  onToast,
}: {
  plotId: string
  onBack: () => void
  onToast: (msg: string) => void
}) {
  const plot = usePlot(plotId)
  const { state, dispatch } = useStore()
  const [logType, setLogType] = useState<IssueType | null>(null)
  const [letterFor, setLetterFor] = useState<{ issue: Issue; key?: string } | null>(null)
  const [editing, setEditing] = useState(false)

  if (!plot) {
    return (
      <div className="content empty">
        <p>Plot not found.</p>
        <button className="btn" onClick={onBack}>
          Back to plots
        </button>
      </div>
    )
  }

  const status = plotStatus(plot)

  const remove = () => {
    if (confirm(`Delete "${plot.address}" and all its records? This cannot be undone.`)) {
      dispatch({ type: 'DELETE_PLOT', plotId: plot.id })
      onBack()
    }
  }

  return (
    <div className="content">
      <div className="row-between" style={{ marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div className="row-between" style={{ justifyContent: 'flex-start', gap: 10 }}>
            <span className={`dot-xl rag-${status.rag}`} />
            <h2 style={{ margin: 0, fontSize: 22, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {plot.address}
            </h2>
          </div>
          <div className="muted" style={{ marginTop: 6, marginLeft: 36 }}>
            {plot.customerNames || 'No customer name'} · <strong>{ragLabel(status.rag)}</strong>
          </div>
        </div>
      </div>

      <div className="meta-grid card" style={{ marginTop: 10 }}>
        <div>
          <div className="k">Reserved</div>
          <div className="v">{formatDate(plot.reservationDate)}</div>
        </div>
        <div>
          <div className="k">Completed</div>
          <div className="v">{formatDate(plot.completionDate)}</div>
        </div>
        <div>
          <div className="k">Customer email</div>
          <div className="v" style={{ overflowWrap: 'anywhere' }}>
            {plot.customerEmail || <span className="muted">not set</span>}
          </div>
        </div>
        <div style={{ alignSelf: 'end' }}>
          <button className="btn btn-sm" onClick={() => setEditing(true)}>
            ✏️ Edit details
          </button>
        </div>
      </div>

      {/* The three impossible-to-miss buttons. */}
      <div className="section">
        <div className="log-buttons">
          <button className="log-btn snag" onClick={() => setLogType('snag')}>
            <span className="ico">🔧</span>
            Snag
            <small>30-day clock</small>
          </button>
          <button className="log-btn complaint" onClick={() => setLogType('complaint')}>
            <span className="ico">📣</span>
            Complaint
            <small>5·10·30·56d</small>
          </button>
          <button className="log-btn emergency" onClick={() => setLogType('emergency')}>
            <span className="ico">🚨</span>
            Emergency
            <small>urgent</small>
          </button>
        </div>
      </div>

      <IssueSection
        plot={plot}
        onToast={onToast}
        onDraftLetter={(issue, key) => setLetterFor({ issue, key })}
      />

      <DocumentChecklist plot={plot} />

      <Timeline plot={plot} />

      {/* Export — one file of everything supplied and when. */}
      <div className="section">
        <h3>Records &amp; export</h3>
        <div className="card">
          <p className="muted" style={{ marginTop: 0 }}>
            One clean file showing every document you supplied and the dates you did so, plus the
            full history — ready if a customer query is ever escalated to the Ombudsman.
          </p>
          <div className="wrap-actions">
            <button className="btn btn-sm btn-primary" onClick={() => exportPlotPrintable(plot, state.developerName)}>
              📄 Export PDF
            </button>
            <button className="btn btn-sm" onClick={() => exportPlotCSV(plot)}>
              📊 Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="section">
        <button className="btn btn-sm btn-danger btn-block" onClick={remove}>
          Delete plot
        </button>
      </div>

      {logType && (
        <LogIssueSheet
          plotId={plot.id}
          initialType={logType}
          onClose={() => setLogType(null)}
          onLogged={(msg) => {
            setLogType(null)
            onToast(msg)
          }}
        />
      )}

      {letterFor && (
        <LetterSheet
          plot={plot}
          issue={letterFor.issue}
          initialKey={letterFor.key}
          onClose={() => setLetterFor(null)}
          onDone={onToast}
        />
      )}

      {editing && <EditPlotSheet plot={plot} onClose={() => setEditing(false)} onSaved={onToast} />}
    </div>
  )
}
