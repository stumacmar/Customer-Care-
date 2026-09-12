/*
 * Add a development (site). Just a name to start — the developer adds plots
 * inside it next. Location is optional.
 */

import { useState } from 'react'
import { Sheet } from './ui'
import { useStore } from '../state/store'
import { id } from '../lib/storage'

export function NewDevelopmentSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (devId: string) => void
}) {
  const { dispatch } = useStore()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [tradingName, setTradingName] = useState('')

  const submit = () => {
    if (!name.trim()) return
    const devId = id('dev_')
    dispatch({ type: 'ADD_DEVELOPMENT', devId, name, location: location || undefined, tradingName: tradingName || undefined })
    onCreated(devId)
  }

  return (
    <Sheet title="New development" subtitle="A site you're building. Add its plots next." onClose={onClose}>
      <div className="field">
        <label>Development name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Meadow View"
          autoFocus
        />
      </div>
      <div className="field">
        <label>Location (optional)</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Cheltenham"
        />
      </div>
      <div className="field">
        <label>Trading name for letters (optional)</label>
        <input
          value={tradingName}
          onChange={(e) => setTradingName(e.target.value)}
          placeholder="Only if this site trades under a different name, e.g. a subsidiary or JV"
        />
      </div>
      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={!name.trim()}>
          Create development
        </button>
      </div>
    </Sheet>
  )
}
