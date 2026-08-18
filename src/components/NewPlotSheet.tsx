/*
 * Add a plot — now at the RESERVATION stage, where the Code's journey starts.
 * Address, customer and the reservation date are enough: the cooling-off clock
 * (2.3), the stage-grouped document checklist (2.2 → 3.1) and the suggested
 * exchange-by date (2.2m) all come free.
 */

import { useState } from 'react'
import { Sheet } from './ui'
import { useStore } from '../state/store'
import { id } from '../lib/storage'
import { addDays, formatDate, todayISO } from '../lib/dates'
import { COOLING_OFF_DAYS, EXCHANGE_MIN_DAYS } from '../lib/code'

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
  const [reservationDate, setReservationDate] = useState(todayISO())

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
      // The exchange-by date is part of the Reservation Agreement (2.2m) — the
      // Code-minimum default so the clock exists from day one; editable later.
      exchangeDeadline: reservationDate ? addDays(reservationDate, EXCHANGE_MIN_DAYS) : undefined,
    })
    onCreated(plotId)
  }

  return (
    <Sheet
      title="New plot — reserved"
      subtitle="Add it the day the Reservation Agreement is signed."
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
        {reservationDate && (
          <div className="dictate-hint">
            Cooling-off runs to {formatDate(addDays(reservationDate, COOLING_OFF_DAYS))} (Code 2.3).
            Exchange-by will default to {formatDate(addDays(reservationDate, EXCHANGE_MIN_DAYS))} —
            the Code minimum of six weeks (2.2) — and can be edited on the plot.
          </div>
        )}
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
