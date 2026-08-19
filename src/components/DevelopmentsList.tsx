/*
 * Home screen — the list of developments (sites). A small developer has one or
 * two live at a time. Active developments show first with a rolled-up traffic
 * light; finished ones tuck into a collapsed section so moving on declutters
 * the view without losing anything.
 */

import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { developmentStatus } from '../lib/status'
import { diffDays, todayISO } from '../lib/dates'
import { downloadBackup } from '../lib/storage'
import { Icon } from './icons'
import type { Rag } from '../types'

/** Nag for a backup when there is data and none has been taken for a week. */
function backupDue(lastBackupAt: string | undefined, hasData: boolean): boolean {
  if (!hasData) return false
  if (!lastBackupAt) return true
  return diffDays(lastBackupAt.slice(0, 10), todayISO()) >= 7
}

const RAG_RANK: Record<Rag, number> = { red: 0, amber: 1, green: 2 }

export function DevelopmentsList({
  onOpenDevelopment,
  onNewDevelopment,
}: {
  onOpenDevelopment: (devId: string) => void
  onNewDevelopment: () => void
}) {
  const { state, dispatch } = useStore()
  const [showFinished, setShowFinished] = useState(false)
  const [backupDismissed, setBackupDismissed] = useState(false)

  const takeBackup = () => {
    downloadBackup(state)
    dispatch({ type: 'RECORD_BACKUP' })
  }

  const rows = useMemo(
    () =>
      state.developments.map((dev) => ({ dev, status: developmentStatus(dev, state.plots) })),
    [state.developments, state.plots]
  )
  const active = rows
    .filter((r) => r.dev.status === 'active')
    .sort((a, b) => RAG_RANK[a.status.rag] - RAG_RANK[b.status.rag])
  const finished = rows.filter((r) => r.dev.status === 'finished')

  return (
    <div className="content">
      <div className="dash-head">
        <h2>Developments</h2>
        <span className="muted" style={{ fontSize: 14 }}>{active.length} active</span>
      </div>

      {!backupDismissed && backupDue(state.lastBackupAt, state.plots.length > 0) && (
        <div className="backup-banner">
          <div className="bb-body">
            <strong>Back up your records.</strong> Your compliance evidence lives only on this
            device — one lost phone loses it all.
          </div>
          <button className="btn btn-sm btn-primary" onClick={takeBackup}>
            Back up
          </button>
          <button
            className="iconbtn"
            style={{ minWidth: 32, height: 32 }}
            aria-label="Dismiss for now"
            onClick={() => setBackupDismissed(true)}
          >
            ✕
          </button>
        </div>
      )}

      {state.developments.length === 0 ? (
        <div className="empty">
          <div className="big"><Icon name="building" size={46} strokeWidth={1.6} /></div>
          <p>
            No developments yet.
            <br />
            Add your site, then add its plots.
          </p>
          <button className="btn btn-primary" onClick={onNewDevelopment}>
            + Add a development
          </button>
          <div className="empty-sell">
            <div className="sell-row">
              <Icon name="clock" size={17} strokeWidth={1.8} />
              <span>Every Quality Code deadline tracked for you — never work out a date again</span>
            </div>
            <div className="sell-row">
              <Icon name="key" size={17} strokeWidth={1.8} />
              <span>Buyers get their own app through a private link — no server, no accounts</span>
            </div>
            <div className="sell-row">
              <Icon name="mail" size={17} strokeWidth={1.8} />
              <span>Letters drafted with the right dates already filled in</span>
            </div>
            <div className="sell-row">
              <Icon name="printer" size={17} strokeWidth={1.8} />
              <span>One tap exports the whole evidence trail as a PDF</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="plot-list">
            {active.map(({ dev, status }) => (
              <button
                key={dev.id}
                className={`plot-card rag-${status.rag}`}
                onClick={() => onOpenDevelopment(dev.id)}
              >
                <span className="rag-bar" />
                <span className="body">
                  <span className="addr">{dev.name}</span>
                  {dev.location && <span className="cust">{dev.location}</span>}
                  <span className="headline">{status.headline}</span>
                </span>
                <span className="dot-xl" />
              </button>
            ))}
            {active.length === 0 && (
              <div className="card muted">No active developments. Add one, or reopen a finished one below.</div>
            )}
          </div>

          {finished.length > 0 && (
            <div className="section">
              <button
                className="btn btn-sm btn-ghost btn-block"
                onClick={() => setShowFinished((s) => !s)}
              >
                {showFinished ? 'Hide' : 'Show'} finished developments ({finished.length})
              </button>
              {showFinished && (
                <div className="plot-list" style={{ marginTop: 10 }}>
                  {finished.map(({ dev, status }) => (
                    <button
                      key={dev.id}
                      className="plot-card rag-green"
                      style={{ opacity: 0.75 }}
                      onClick={() => onOpenDevelopment(dev.id)}
                    >
                      <span className="rag-bar" style={{ background: 'var(--text-faint)' }} />
                      <span className="body">
                        <span className="addr">{dev.name}</span>
                        <span className="headline">{status.headline}</span>
                      </span>
                      <span className="badge resolved" style={{ alignSelf: 'center' }}>finished</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
