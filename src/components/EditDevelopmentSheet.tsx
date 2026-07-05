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

  const save = () => {
    if (!name.trim()) return
    dispatch({ type: 'UPDATE_DEVELOPMENT', devId: dev.id, patch: { name, location } })
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
