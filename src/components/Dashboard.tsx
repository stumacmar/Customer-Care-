/*
 * The traffic-light dashboard — the whole point of the product.
 * One row per plot. Colour, not text, does the work: the builder scans, not
 * reads. Rows are sorted worst-first so anything on fire is at the top.
 */

import { useMemo } from 'react'
import { useStore } from '../state/store'
import { plotStatus } from '../lib/status'
import type { Rag } from '../types'

const RAG_RANK: Record<Rag, number> = { red: 0, amber: 1, green: 2 }

export function Dashboard({
  onOpenPlot,
  onNewPlot,
}: {
  onOpenPlot: (plotId: string) => void
  onNewPlot: () => void
}) {
  const { state } = useStore()

  const rows = useMemo(
    () =>
      state.plots
        .map((p) => ({ plot: p, status: plotStatus(p) }))
        .sort((a, b) => RAG_RANK[a.status.rag] - RAG_RANK[b.status.rag]),
    [state.plots]
  )

  const counts = useMemo(() => {
    const c = { red: 0, amber: 0, green: 0 }
    rows.forEach((r) => (c[r.status.rag] += 1))
    return c
  }, [rows])

  return (
    <div className="content">
      <div className="dash-head">
        <h2>Plots</h2>
        <span className="muted" style={{ fontSize: 14 }}>
          {state.plots.length} total
        </span>
      </div>

      {state.plots.length > 0 && (
        <div className="legend">
          <span>
            <span className="dot rag-red" /> {counts.red} need action
          </span>
          <span>
            <span className="dot rag-amber" /> {counts.amber} due soon
          </span>
          <span>
            <span className="dot rag-green" /> {counts.green} on track
          </span>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="empty">
          <div className="big">🏗️</div>
          <p>
            No plots yet.
            <br />
            Add your first plot to start its clock.
          </p>
          <button className="btn btn-primary" onClick={onNewPlot}>
            + Add a plot
          </button>
        </div>
      ) : (
        <div className="plot-list">
          {rows.map(({ plot, status }) => (
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
  )
}
