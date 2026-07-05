/*
 * Settings: developer name, demo data, data protection (GDPR) guidance,
 * 2-year retention housekeeping, and a reset that is deliberately hard to
 * trigger by accident. Still no permission trees, no org config — one small
 * team, one screen.
 */

import { useState } from 'react'
import { Sheet } from './ui'
import { useStore } from '../state/store'
import { buildSeedState } from '../lib/seed'
import { formatDate } from '../lib/dates'
import { exportPlotPrintable } from '../lib/export'
import { isPlotRetired } from '../lib/status'

export function SettingsSheet({ onClose, onToast }: { onClose: () => void; onToast: (m: string) => void }) {
  const { state, dispatch } = useStore()
  const [name, setName] = useState(state.developerName)
  const [showGdpr, setShowGdpr] = useState(false)

  const saveName = (v: string) => {
    setName(v)
    dispatch({ type: 'SET_DEVELOPER_NAME', name: v })
  }

  const loadDemo = () => {
    if (state.plots.length && !confirm('Load demo data? This adds a sample development alongside what you have.')) return
    const seed = buildSeedState(state.developerName || 'Meadow Homes Ltd')
    dispatch({
      type: 'REPLACE_STATE',
      state: {
        ...seed,
        developments: [...seed.developments, ...state.developments],
        plots: [...seed.plots, ...state.plots],
      },
    })
    onToast('Demo development added')
    onClose()
  }

  const reset = () => {
    // Deliberately hard to do by accident: explain exactly what happens, then
    // require the word DELETE to be typed.
    const typed = prompt(
      'This permanently wipes EVERY plot, issue, letter and photo stored on this device. ' +
        'It cannot be undone.\n\nExported PDFs/CSVs you saved elsewhere are NOT affected.\n\n' +
        'If you have not exported your plots, cancel and do that first.\n\n' +
        'Type DELETE (in capitals) to confirm:'
    )
    if (typed !== 'DELETE') {
      if (typed !== null) onToast('Not deleted — you must type DELETE exactly')
      return
    }
    dispatch({
      type: 'REPLACE_STATE',
      state: { version: 2, developerName: name, developments: [], plots: [] },
    })
    onToast('All data cleared')
    onClose()
  }

  const deletePlot = (plotId: string, address: string) => {
    if (!confirm(`Delete "${address}" and all its records? Export it first if you haven't. This cannot be undone.`)) return
    dispatch({ type: 'DELETE_PLOT', plotId })
    onToast('Plot deleted')
  }

  // Housekeeping: retired plots — completion over 2 years ago, so the New Homes
  // Ombudsman window has closed. They already auto-retire out of the active
  // view; here (GDPR data minimisation) is where you export a copy and delete
  // the personal data for good.
  const oldPlots = state.plots.filter((p) => isPlotRetired(p))
  const devName = (id: string) => state.developments.find((d) => d.id === id)?.name || ''

  return (
    <Sheet title="Settings" onClose={onClose}>
      <div className="field">
        <label>Developer / company name (appears on letters and exports)</label>
        <input
          value={name}
          onChange={(e) => saveName(e.target.value)}
          placeholder="e.g. Meadow Homes Ltd"
        />
      </div>

      <div className="section" style={{ marginTop: 8 }}>
        <h3>Data housekeeping</h3>
        <div className="card">
          {oldPlots.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              Nothing needs attention. Plots completed more than 2 years ago will appear here —
              that's when the customer's window to go to the Ombudsman closes, so you can
              export a copy for your records and delete the personal data.
            </p>
          ) : (
            <>
              <p className="muted" style={{ marginTop: 0 }}>
                These plots completed over 2 years ago. The Ombudsman window has closed —
                export a copy for your files, then consider deleting them (GDPR says don't
                keep personal data longer than you need it).
              </p>
              <div className="stack">
                {oldPlots.map((p) => (
                  <div key={p.id} className="row-between">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{p.address}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {devName(p.developmentId) ? `${devName(p.developmentId)} · ` : ''}
                        Completed {formatDate(p.completionDate)}
                      </div>
                    </div>
                    <div className="wrap-actions">
                      <button
                        className="btn btn-sm"
                        onClick={() => exportPlotPrintable(p, state.developerName)}
                      >
                        📄 Export
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => deletePlot(p.id, p.address)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="section">
        <h3>Data protection (GDPR)</h3>
        <div className="card">
          <button className="linklike" onClick={() => setShowGdpr((s) => !s)}>
            {showGdpr ? 'Hide' : 'Show'} the plain-English version
          </button>
          {showGdpr && (
            <div className="muted" style={{ fontSize: 14, marginTop: 8 }}>
              <p style={{ marginTop: 0 }}>
                <strong>Where the data lives:</strong> everything you enter stays on this device
                only. Nothing is sent to us or anyone else — there is no server. Emailing a
                letter uses your own email account.
              </p>
              <p>
                <strong>You are the data controller</strong> for your customers' details (names,
                addresses, emails, photos). In practice that means three habits:
              </p>
              <p>
                1. <strong>Store the minimum</strong> — name, address, email. Nothing else is
                needed, so don't add more. Avoid photographing people.
                <br />
                2. <strong>Answer requests</strong> — if a customer asks what you hold, the
                plot's Export gives them everything. If they ask you to erase it (and you no
                longer need it for a live complaint or the Ombudsman window), delete the plot.
                <br />
                3. <strong>Don't keep it forever</strong> — the housekeeping section above
                flags plots 2 years after completion, when the Ombudsman window closes. Export
                for your files, then delete.
              </p>
              <p style={{ marginBottom: 0 }}>
                <strong>Losing your phone:</strong> your phone's passcode is the lock on this
                data — keep one set. This note is practical guidance, not legal advice.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <h3>Demo</h3>
        <div className="card">
          <p className="muted" style={{ marginTop: 0 }}>
            See the app with a realistic development — a snag ticking down, a live complaint
            mid-procedure, an emergency, plus a finished development with a retired plot.
          </p>
          <button className="btn btn-sm btn-primary" onClick={loadDemo}>
            Load demo data
          </button>
        </div>
      </div>

      <div className="section">
        <h3>Danger zone</h3>
        <div className="card">
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            Wipes every plot, issue, letter and photo on this device. You'll be asked to type
            DELETE to confirm. Exports you saved elsewhere are unaffected.
          </p>
          <button className="btn btn-sm btn-danger" onClick={reset}>
            Reset all data
          </button>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
        Data is stored on this device only. Export a plot's compliance record to keep a copy.
      </p>
    </Sheet>
  )
}
