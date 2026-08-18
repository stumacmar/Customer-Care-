/*
 * The one screen per plot — the whole journey from reservation to the end of
 * the two-year after-sales window. Top to bottom: the journey strip and its
 * Code clocks, the three impossible-to-miss log buttons, the spec-and-changes
 * evidence log, live issues, the stage-grouped document checklist, the
 * timeline, and the audit export.
 */

import { useState } from 'react'
import { usePlot } from '../state/store'
import { describeAction, plotStatus } from '../lib/status'
import { formatDate } from '../lib/dates'
import { exportPlotCSV, exportPlotPrintable } from '../lib/export'
import { useStore } from '../state/store'
import { DocumentChecklist } from './DocumentChecklist'
import { IssueSection } from './IssueSection'
import { JourneySection } from './JourneySection'
import { ChangesSection } from './ChangesSection'
import { LogChangeSheet } from './LogChangeSheet'
import { ChangeLetterSheet } from './ChangeLetterSheet'
import { ResolveChangeSheet } from './ResolveChangeSheet'
import { Timeline } from './Timeline'
import { LogIssueSheet } from './LogIssueSheet'
import { LetterSheet } from './LetterSheet'
import { EditPlotSheet } from './EditPlotSheet'
import { Icon } from './icons'
import type { Issue, IssueType } from '../types'

export function PlotScreen({
  plotId,
  onBack,
  onToast,
  onExplainCode,
}: {
  plotId: string
  onBack: () => void
  onToast: (msg: string) => void
  onExplainCode: (ref: string) => void
}) {
  const plot = usePlot(plotId)
  const { state, dispatch } = useStore()
  const [logType, setLogType] = useState<IssueType | null>(null)
  const [letterFor, setLetterFor] = useState<{ issue: Issue; key?: string } | null>(null)
  const [editing, setEditing] = useState(false)
  const [loggingChange, setLoggingChange] = useState(false)
  const [changeLetterForId, setChangeLetterForId] = useState<string | null>(null)
  const [resolvingChangeId, setResolvingChangeId] = useState<string | null>(null)

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
  // Derived from ids so the sheets always see the freshest record.
  const changeLetterFor = plot.changes.find((c) => c.id === changeLetterForId) || null
  const resolvingChange = plot.changes.find((c) => c.id === resolvingChangeId) || null

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
            {plot.customerNames || 'No customer name'} · {status.stageLabel}
          </div>
        </div>
      </div>

      {/* The one thing to do next — everything else on this screen is detail. */}
      <div className={`next-banner rag-${status.next.rag}`}>
        <span className="next-k">Next</span>
        <span className="next-label">{describeAction(status.next)}</span>
      </div>

      <div className="meta-grid card" style={{ marginTop: 10 }}>
        <div>
          <div className="k">Reserved</div>
          <div className="v">{formatDate(plot.reservationDate)}</div>
        </div>
        <div>
          <div className="k">Exchange due</div>
          <div className="v">{formatDate(plot.exchangeDeadline)}</div>
        </div>
        <div>
          <div className="k">Exchanged</div>
          <div className="v">{formatDate(plot.exchangeDate)}</div>
        </div>
        <div>
          <div className="k">Notice to complete</div>
          <div className="v">{formatDate(plot.noticeServedDate)}</div>
        </div>
        <div>
          <div className="k">Completion</div>
          <div className="v">{formatDate(plot.completionDate)}</div>
        </div>
        <div>
          <div className="k">Customer email</div>
          <div className="v" style={{ overflowWrap: 'anywhere' }}>
            {plot.customerEmail || <span className="muted">not set</span>}
          </div>
        </div>
        <div style={{ alignSelf: 'end', gridColumn: '1 / -1' }}>
          <button className="btn btn-sm" onClick={() => setEditing(true)}>
            <Icon name="edit" size={16} /> Edit details &amp; dates
          </button>
        </div>
      </div>

      <JourneySection
        plot={plot}
        onToast={onToast}
        onResolveMajorChange={setResolvingChangeId}
        onExplainCode={onExplainCode}
      />

      {/* The three impossible-to-miss buttons. Snags cover pre-completion
          inspection findings too (Code 2.8); complaints can arise at any stage
          about Part 1 and Part 2 obligations (Code 3.4). */}
      <div className="section">
        <div className="log-buttons">
          <button className="log-btn snag" onClick={() => setLogType('snag')}>
            <span className="ico"><Icon name="wrench" size={26} /></span>
            Snag
            <small>30-day clock</small>
          </button>
          <button className="log-btn complaint" onClick={() => setLogType('complaint')}>
            <span className="ico"><Icon name="megaphone" size={26} /></span>
            Complaint
            <small>5·10·30·56d</small>
          </button>
          <button className="log-btn emergency" onClick={() => setLogType('emergency')}>
            <span className="ico"><Icon name="alert" size={26} /></span>
            Emergency
            <small>urgent</small>
          </button>
        </div>
      </div>

      <ChangesSection
        plot={plot}
        onLogChange={() => setLoggingChange(true)}
        onDraftLetter={(change) => setChangeLetterForId(change.id)}
        onResolveMajorChange={setResolvingChangeId}
      />

      <IssueSection
        plot={plot}
        onToast={onToast}
        onDraftLetter={(issue, key) => setLetterFor({ issue, key })}
      />

      <DocumentChecklist plot={plot} onExplainCode={onExplainCode} />

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
              <Icon name="file" size={16} /> Export PDF
            </button>
            <button className="btn btn-sm" onClick={() => exportPlotCSV(plot)}>
              <Icon name="chart" size={16} /> Export CSV
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

      {loggingChange && (
        <LogChangeSheet
          plotId={plot.id}
          onClose={() => setLoggingChange(false)}
          onLogged={(msg, kind, changeId) => {
            setLoggingChange(false)
            onToast(msg)
            // A major change must be notified in writing (Code 2.9) — open the
            // draft notice for the record that was just logged.
            if (kind === 'major_change') setChangeLetterForId(changeId)
          }}
        />
      )}

      {changeLetterFor && (
        <ChangeLetterSheet
          plot={plot}
          change={changeLetterFor}
          onClose={() => setChangeLetterForId(null)}
          onToast={onToast}
        />
      )}

      {resolvingChange && (
        <ResolveChangeSheet
          plot={plot}
          change={resolvingChange}
          onClose={() => setResolvingChangeId(null)}
          onToast={onToast}
        />
      )}

      {editing && <EditPlotSheet plot={plot} onClose={() => setEditing(false)} onSaved={onToast} />}
    </div>
  )
}
