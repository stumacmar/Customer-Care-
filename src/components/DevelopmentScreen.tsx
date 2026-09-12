/*
 * A development's plots. Active plots show as the familiar traffic-light rows;
 * plots whose two-year after-sales period has closed archive into a collapsed
 * "Retired" section (kept for the record, out of the daily view). The developer
 * can edit the development, mark it finished when they move on, or reopen it.
 */

import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { plotStatus } from '../lib/status'
import { isPlotRetired } from '../lib/status'
import { formatDate } from '../lib/dates'
import { PART1_TEMPLATE } from '../lib/code'
import type { Plot, Rag } from '../types'
import { EditDevelopmentSheet } from './EditDevelopmentSheet'
import { Icon } from './icons'

const RAG_RANK: Record<Rag, number> = { red: 0, amber: 1, green: 2 }

export function DevelopmentScreen({
  devId,
  onOpenPlot,
  onNewPlot,
  onBack,
  onToast,
}: {
  devId: string
  onOpenPlot: (plotId: string) => void
  onNewPlot: (devId: string) => void
  onBack: () => void
  onToast: (msg: string) => void
}) {
  const { state, dispatch } = useStore()
  const dev = state.developments.find((d) => d.id === devId)
  const [editing, setEditing] = useState(false)
  const [showRetired, setShowRetired] = useState(false)

  const plots = useMemo(() => state.plots.filter((p) => p.developmentId === devId), [state.plots, devId])
  const active = plots.filter((p) => !isPlotRetired(p))
  const retired = plots.filter((p) => isPlotRetired(p))
  const part1Done = PART1_TEMPLATE.filter((t) => dev?.part1?.[t.key]?.completed).length
  const activeRows = active
    .map((p) => ({ plot: p, status: plotStatus(p) }))
    .sort((a, b) => RAG_RANK[a.status.rag] - RAG_RANK[b.status.rag])

  if (!dev) {
    return (
      <div className="content empty">
        <p>Development not found.</p>
        <button className="btn" onClick={onBack}>Back</button>
      </div>
    )
  }

  const toggleFinished = () => {
    const next = dev.status === 'active' ? 'finished' : 'active'
    dispatch({ type: 'UPDATE_DEVELOPMENT', devId, patch: { status: next } })
    onToast(next === 'finished' ? 'Development marked finished' : 'Development reopened')
  }

  const remove = () => {
    if (
      !confirm(
        `Delete "${dev.name}" and all ${plots.length} of its plots and records? Export anything you need first. This cannot be undone.`
      )
    )
      return
    dispatch({ type: 'DELETE_DEVELOPMENT', devId })
    onBack()
  }

  return (
    <div className="content">
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>{dev.name}</h2>
          <div className="muted" style={{ marginTop: 4 }}>
            {dev.location ? `${dev.location} · ` : ''}
            {dev.status === 'finished' ? 'Finished' : `${active.length} active plot${active.length === 1 ? '' : 's'}`}
          </div>
        </div>
      </div>

      <div className="wrap-actions" style={{ marginTop: 12 }}>
        <button className="btn btn-sm" onClick={() => setEditing(true)}>
          <Icon name="edit" size={16} /> Edit
        </button>
        <button className="btn btn-sm" onClick={toggleFinished}>
          {dev.status === 'active' ? (
            <>
              <Icon name="check" size={16} /> Mark finished
            </>
          ) : (
            <>
              <Icon name="reopen" size={16} /> Reopen
            </>
          )}
        </button>
      </div>

      <div className="section">
        <h3>
          Plots <span className="count-pill">{active.length}</span>
        </h3>
        {active.length === 0 ? (
          <div className="card muted">
            No active plots yet. Tap “+ Plot” to add one — its document checklist is created
            automatically.
          </div>
        ) : (
          <div className="plot-list">
            {activeRows.map(({ plot, status }) => (
              <button
                key={plot.id}
                className={`plot-card rag-${status.rag}`}
                onClick={() => onOpenPlot(plot.id)}
              >
                <span className="rag-bar" />
                <span className="body">
                  <span className="addr">{plot.address || 'Untitled plot'}</span>
                  <span className="cust">
                    {plot.customerNames || 'No customer name'} ·{' '}
                    <span className="stage-tag">{status.stageLabel}</span>
                  </span>
                  <span className="headline">
                    {status.hasEmergency && (
                      <Icon
                        name="alert"
                        size={13}
                        strokeWidth={2.2}
                        style={{ color: 'var(--red)', marginRight: 4, verticalAlign: '-2px' }}
                      />
                    )}
                    {status.headline}
                  </span>
                </span>
                <span className="dot-xl" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Part 1 of the Code applies to the site as a whole, before any plot is
          reserved — a small developer working plot by plot can otherwise miss it. */}
      <details className="section guide-item" open={part1Done < PART1_TEMPLATE.length}>
        <summary>
          <h3 style={{ display: 'inline' }}>
            Before reservation — Part 1 of the Code{' '}
            <span className="count-pill">
              {part1Done}/{PART1_TEMPLATE.length}
            </span>
          </h3>
        </summary>
        <div className="card">
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            Selling a new home. Tick each once for this site; the Code tab has the full clause
            behind every line.
          </p>
          {PART1_TEMPLATE.map((t) => {
            const p = dev.part1?.[t.key]
            const on = !!p?.completed
            return (
              <div key={t.key} className="doc">
                <button
                  className={`check${on ? ' on' : ''}`}
                  aria-pressed={on}
                  aria-label={on ? `Mark "${t.label}" not done` : `Mark "${t.label}" done`}
                  onClick={() => dispatch({ type: 'TOGGLE_PART1', devId, key: t.key, completed: !on })}
                >
                  {on && <Icon name="check" size={14} strokeWidth={2.6} />}
                </button>
                <div className="doc-body">
                  <div className="doc-label">
                    {t.label} {state.showCodeRefs && <span className="clause-ref">Code {t.clause}</span>}
                  </div>
                  <div className="doc-hint">{t.hint}</div>
                  {on && p?.completedDate && <div className="doc-hint">Ticked {formatDate(p.completedDate)}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </details>

      {retired.length > 0 && (
        <div className="section">
          <button
            className="btn btn-sm btn-ghost btn-block"
            onClick={() => setShowRetired((s) => !s)}
          >
            {showRetired ? 'Hide' : 'Show'} archived plots ({retired.length})
          </button>
          {showRetired && (
            <div className="plot-list" style={{ marginTop: 10 }}>
              {retired.map((plot: Plot) => (
                <button
                  key={plot.id}
                  className="plot-card rag-green"
                  style={{ opacity: 0.7 }}
                  onClick={() => onOpenPlot(plot.id)}
                >
                  <span className="rag-bar" style={{ background: 'var(--text-faint)' }} />
                  <span className="body">
                    <span className="addr">{plot.address}</span>
                    <span className="headline">
                      {plot.cancellation
                        ? `Cancelled ${formatDate(plot.cancellation.date)} · refund paid`
                        : `Legal completion ${formatDate(plot.completionDate)} · after-sales period ended`}
                    </span>
                  </span>
                  <span className="badge resolved" style={{ alignSelf: 'center' }}>
                    {plot.cancellation ? 'cancelled' : 'archived'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}


      <button className="fab" onClick={() => onNewPlot(devId)}>
        + Plot
      </button>

      {editing && <EditDevelopmentSheet dev={dev} onClose={() => setEditing(false)} onSaved={onToast} onDelete={remove} />}
    </div>
  )
}
