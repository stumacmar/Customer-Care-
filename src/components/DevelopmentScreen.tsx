/*
 * A development's plots. Active plots show as the familiar traffic-light rows;
 * plots whose two-year Ombudsman window has closed auto-retire into a collapsed
 * "Retired" section (kept for the record, out of the daily view). The developer
 * can edit the development, mark it finished when they move on, or reopen it.
 */

import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { plotStatus } from '../lib/status'
import { isPlotRetired } from '../lib/status'
import { formatDate } from '../lib/dates'
import type { Plot, Rag } from '../types'
import { EditDevelopmentSheet } from './EditDevelopmentSheet'

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
        <button className="btn btn-sm" onClick={() => setEditing(true)}>✏️ Edit</button>
        <button className="btn btn-sm" onClick={toggleFinished}>
          {dev.status === 'active' ? '✓ Mark finished' : '↩ Reopen'}
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
                  <span className="cust">{plot.customerNames || 'No customer name'}</span>
                  <span className="headline">
                    {status.hasEmergency && <strong style={{ color: 'var(--red)' }}>⚠ </strong>}
                    {status.headline}
                  </span>
                </span>
                <span className="dot-xl" />
              </button>
            ))}
          </div>
        )}
      </div>

      {retired.length > 0 && (
        <div className="section">
          <button
            className="btn btn-sm btn-ghost btn-block"
            onClick={() => setShowRetired((s) => !s)}
          >
            {showRetired ? 'Hide' : 'Show'} retired plots ({retired.length}) · 2-year window closed
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
                      Completed {formatDate(plot.completionDate)} · Ombudsman window closed
                    </span>
                  </span>
                  <span className="badge resolved" style={{ alignSelf: 'center' }}>retired</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="section">
        <button className="btn btn-sm btn-danger btn-block" onClick={remove}>
          Delete development
        </button>
      </div>

      <button className="fab" onClick={() => onNewPlot(devId)}>
        + Plot
      </button>

      {editing && <EditDevelopmentSheet dev={dev} onClose={() => setEditing(false)} onSaved={onToast} />}
    </div>
  )
}
