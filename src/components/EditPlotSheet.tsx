/*
 * Edit a plot's details after creation — including the customer's email,
 * which is what makes one-tap "Email to customer" work on letters.
 */

import { useState } from 'react'
import { Sheet } from './ui'
import { useStore } from '../state/store'
import type { Plot } from '../types'

export function EditPlotSheet({
  plot,
  onClose,
  onSaved,
}: {
  plot: Plot
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const { dispatch } = useStore()
  const [address, setAddress] = useState(plot.address)
  const [customerNames, setCustomerNames] = useState(plot.customerNames)
  const [customerEmail, setCustomerEmail] = useState(plot.customerEmail || '')
  const [reservationDate, setReservationDate] = useState(plot.reservationDate || '')
  const [completionDate, setCompletionDate] = useState(plot.completionDate || '')

  const save = () => {
    if (!address.trim()) return
    dispatch({
      type: 'UPDATE_PLOT_DETAILS',
      plotId: plot.id,
      patch: {
        address,
        customerNames,
        customerEmail,
        reservationDate: reservationDate || undefined,
        completionDate: completionDate || undefined,
      },
    })
    onSaved('Details saved')
    onClose()
  }

  return (
    <Sheet title="Edit plot details" onClose={onClose}>
      <div className="field">
        <label>Address / plot name</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="field">
        <label>Customer name(s)</label>
        <input value={customerNames} onChange={(e) => setCustomerNames(e.target.value)} />
      </div>
      <div className="field">
        <label>Customer email (for sending letters)</label>
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
        <button className="btn btn-primary" onClick={save} disabled={!address.trim()}>
          Save
        </button>
      </div>
    </Sheet>
  )
}
