/*
 * Add a plot. Deliberately short — address and customer are all that's needed
 * to start the clock; dates are optional. Creating the plot auto-generates the
 * full document checklist (Code 2.11 / 3.1) so nothing is forgotten.
 */

import { useState } from 'react'
import { Sheet } from './ui'
import { useStore } from '../state/store'
import { id } from '../lib/storage'

export function NewPlotSheet({
  developmentId,
  onClose,
  onCreated,
}: {
  developmentId: string
  onClose: () => void
  onCreated: (plotId: string) => void
}) {
  const { dispatch } = useStore()
  const [address, setAddress] = useState('')
  const [customerNames, setCustomerNames] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [reservationDate, setReservationDate] = useState('')
  const [completionDate, setCompletionDate] = useState('')

  const submit = () => {
    if (!address.trim()) return
    const plotId = id('plot_')
    dispatch({
      type: 'ADD_PLOT',
      plotId,
      developmentId,
      address,
      customerNames,
      customerEmail: customerEmail || undefined,
      reservationDate: reservationDate || undefined,
      completionDate: completionDate || undefined,
    })
    onCreated(plotId)
  }

  return (
    <Sheet
      title="New plot"
      subtitle="Adds the document checklist automatically."
      onClose={onClose}
    >
      <div className="field">
        <label>Address / plot name</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. Plot 3, Meadow View"
          autoFocus
        />
      </div>
      <div className="field">
        <label>Customer name(s)</label>
        <input
          value={customerNames}
          onChange={(e) => setCustomerNames(e.target.value)}
          placeholder="e.g. Mr & Mrs Patel"
        />
      </div>
      <div className="field">
        <label>Customer email (optional — lets you email letters in one tap)</label>
        <input
          type="email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          placeholder="e.g. customer@email.com"
        />
      </div>
      <div className="field">
        <label>Reservation date</label>
        <input type="date" value={reservationDate} onChange={(e) => setReservationDate(e.target.value)} />
      </div>
      <div className="field">
        <label>Completion date</label>
        <input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
      </div>

      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={!address.trim()}>
          Create plot
        </button>
      </div>
    </Sheet>
  )
}
