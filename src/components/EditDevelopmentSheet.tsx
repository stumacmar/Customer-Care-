/*
 * Edit a development's name/location. Kept editable so a mistyped site name or
 * a change of plan is a two-second fix.
 */

import { useState } from 'react'
import { Sheet } from './ui'
import { useStore } from '../state/store'
import type { Development } from '../types'

export function EditDevelopmentSheet({
  dev,
  onClose,
  onSaved,
}: {
  dev: Development
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const { dispatch } = useStore()
  const [name, setName] = useState(dev.name)
  const [location, setLocation] = useState(dev.location || '')
  const [tradingName, setTradingName] = useState(dev.tradingName || '')

  const save = () => {
    if (!name.trim()) return
    dispatch({ type: 'UPDATE_DEVELOPMENT', devId: dev.id, patch: { name, location, tradingName } })
    onSaved('Development updated')
    onClose()
  }

  return (
    <Sheet title="Edit development" onClose={onClose}>
      <div className="field">
        <label>Development name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label>Location (optional)</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div className="field">
        <label>Trading name for letters (optional)</label>
        <input
          value={tradingName}
          onChange={(e) => setTradingName(e.target.value)}
          placeholder="Only if this site trades under a different name, e.g. a subsidiary or JV"
        />
        <div className="dictate-hint">Used on letters, exports and the customer's app for this site instead of the company name in Settings.</div>
      </div>
      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={save} disabled={!name.trim()}>
          Save
        </button>
      </div>
    </Sheet>
  )
}
