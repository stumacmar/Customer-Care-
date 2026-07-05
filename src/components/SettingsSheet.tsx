/*
 * Settings: the developer's name (used to pre-fill letters and the audit
 * record), a one-tap demo dataset to see the app populated, and a reset.
 * Deliberately tiny — no permission trees, no org config. One small team.
 */

import { useState } from 'react'
import { Sheet } from './ui'
import { useStore } from '../state/store'
import { buildSeedState } from '../lib/seed'

export function SettingsSheet({ onClose, onToast }: { onClose: () => void; onToast: (m: string) => void }) {
  const { state, dispatch } = useStore()
  const [name, setName] = useState(state.developerName)

  const saveName = (v: string) => {
    setName(v)
    dispatch({ type: 'SET_DEVELOPER_NAME', name: v })
  }

  const loadDemo = () => {
    if (state.plots.length && !confirm('Load demo plots? This adds sample data alongside what you have.')) return
    const seed = buildSeedState(state.developerName || 'Meadow Homes Ltd')
    dispatch({ type: 'REPLACE_STATE', state: { ...seed, plots: [...seed.plots, ...state.plots] } })
    onToast('Demo plots added')
    onClose()
  }

  const reset = () => {
    if (!confirm('Delete ALL plots and data? This cannot be undone.')) return
    dispatch({ type: 'REPLACE_STATE', state: { version: 1, developerName: name, plots: [] } })
    onToast('All data cleared')
    onClose()
  }

  return (
    <Sheet title="Settings" subtitle="Used to pre-fill letters and the audit record." onClose={onClose}>
      <div className="field">
        <label>Developer / company name</label>
        <input
          value={name}
          onChange={(e) => saveName(e.target.value)}
          placeholder="e.g. Meadow Homes Ltd"
        />
      </div>

      <div className="section" style={{ marginTop: 8 }}>
        <h3>Demo</h3>
        <div className="card">
          <p className="muted" style={{ marginTop: 0 }}>
            See the app with realistic plots — a snag ticking down, a live complaint mid-procedure,
            and an emergency.
          </p>
          <button className="btn btn-sm btn-primary" onClick={loadDemo}>
            Load demo plots
          </button>
        </div>
      </div>

      <div className="section">
        <button className="btn btn-sm btn-danger btn-block" onClick={reset}>
          Reset all data
        </button>
      </div>

      <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
        Data is stored on this device only. Export a plot's compliance record to keep a copy.
      </p>
    </Sheet>
  )
}
