/*
 * Edit a plot's details and journey dates. The dates drive the Code clocks:
 * reservation starts the 14-day cooling-off (2.3), the exchange-by date is the
 * 2.2m deadline, notice-to-complete opens the PCI window (2.8), and completion
 * starts the two-year after-sales period (3.1). Cancellation lives here too —
 * recording it starts the refund clock (2.4 / 2.13).
 */

import { useState } from 'react'
import { Sheet } from './ui'
import { useStore } from '../state/store'
import { addDays, formatDate, todayISO } from '../lib/dates'
import { EXCHANGE_MIN_DAYS } from '../lib/code'
import { Icon } from './icons'
import type { Plot } from '../types'

export function EditPlotSheet({
  plot,
  onClose,
  onSaved,
  onDelete,
}: {
  plot: Plot
  onClose: () => void
  onSaved: (msg: string) => void
  onDelete?: () => void
}) {
  const { dispatch } = useStore()
  const [address, setAddress] = useState(plot.address)
  const [customerNames, setCustomerNames] = useState(plot.customerNames)
  const [customerEmail, setCustomerEmail] = useState(plot.customerEmail || '')
  const [reservationDate, setReservationDate] = useState(plot.reservationDate || '')
  const [exchangeDeadline, setExchangeDeadline] = useState(plot.exchangeDeadline || '')
  const [exchangeAgreementNote, setExchangeAgreementNote] = useState(plot.exchangeAgreementNote || '')
  const [exchangeDate, setExchangeDate] = useState(plot.exchangeDate || '')
  const [noticeServedDate, setNoticeServedDate] = useState(plot.noticeServedDate || '')
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(plot.expectedCompletionDate || '')
  const [completionDate, setCompletionDate] = useState(plot.completionDate || '')
  const [cancelDate, setCancelDate] = useState(todayISO())

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
        exchangeDeadline: exchangeDeadline || undefined,
        exchangeAgreementNote: exchangeAgreementNote || undefined,
        exchangeDate: exchangeDate || undefined,
        noticeServedDate: noticeServedDate || undefined,
        expectedCompletionDate: expectedCompletionDate || undefined,
        completionDate: completionDate || undefined,
      },
    })
    onSaved('Details saved')
    onClose()
  }

  const recordCancellation = (kind: 'reservation' | 'contract') => {
    const what = kind === 'contract' ? 'contract' : 'reservation'
    if (
      !confirm(
        `Record that the customer cancelled the ${what}? The refund is due within ` +
          `${kind === 'contract' ? '28 days (Code 2.13)' : '14 days (Code 2.4)'} of their notice.`
      )
    )
      return
    dispatch({ type: 'RECORD_CANCELLATION', plotId: plot.id, kind, date: cancelDate || todayISO() })
    onSaved('Cancellation recorded')
    onClose()
  }

  const suggestedExchange = reservationDate ? addDays(reservationDate, EXCHANGE_MIN_DAYS) : ''
  const exchangeTooEarly = !!reservationDate && !!exchangeDeadline && exchangeDeadline < suggestedExchange
  // Journey dates must run in order; a slip here quietly picks the wrong stage.
  const orderProblems: string[] = []
  if (reservationDate && exchangeDate && exchangeDate < reservationDate) orderProblems.push('exchange is before reservation')
  if (exchangeDate && noticeServedDate && noticeServedDate < exchangeDate) orderProblems.push('notice to complete is before exchange')
  if (noticeServedDate && completionDate && completionDate < noticeServedDate) orderProblems.push('legal completion is before notice')
  if (completionDate && completionDate > todayISO()) orderProblems.push('legal completion is in the future — use the expected date until it happens')

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
        <label>Exchange-by date (from the Reservation Agreement)</label>
        <input type="date" value={exchangeDeadline} onChange={(e) => setExchangeDeadline(e.target.value)} />
        {reservationDate && !exchangeDeadline && (
          <div className="dictate-hint">
            The Code minimum is six weeks after reservation: {formatDate(suggestedExchange)}.{' '}
            <button
              className="linklike"
              style={{ padding: 0 }}
              onClick={() => setExchangeDeadline(suggestedExchange)}
            >
              Use that date
            </button>
          </div>
        )}
        {exchangeDeadline && (
          <input
            style={{ marginTop: 8 }}
            value={exchangeAgreementNote}
            onChange={(e) => setExchangeAgreementNote(e.target.value)}
            placeholder="Agreed extension or change? Note the reason and who agreed it (kept on the record)"
          />
        )}
        {exchangeTooEarly && (
          <div className="dictate-hint" style={{ color: 'var(--amber)' }}>
            Earlier than the Code minimum of six weeks ({formatDate(suggestedExchange)}). Code 2.2
            allows this only where the customer asked for an earlier date — keep their request
            in writing.
          </div>
        )}
      </div>
      <div className="field">
        <label>Exchange of contracts</label>
        <input type="date" value={exchangeDate} onChange={(e) => setExchangeDate(e.target.value)} />
      </div>
      <div className="field">
        <label>Notice to complete served</label>
        <input type="date" value={noticeServedDate} onChange={(e) => setNoticeServedDate(e.target.value)} />
      </div>
      <div className="field">
        <label>Expected completion</label>
        <input type="date" value={expectedCompletionDate} onChange={(e) => setExpectedCompletionDate(e.target.value)} />
      </div>
      <div className="field">
        <label>Legal completion</label>
        <input type="date" value={completionDate} max={todayISO()} onChange={(e) => setCompletionDate(e.target.value)} />
      </div>
      {orderProblems.length > 0 && (
        <div className="dictate-hint" style={{ color: 'var(--amber)', marginBottom: 10 }}>
          <Icon name="alert" size={14} /> Check the dates: {orderProblems.join('; ')}.
        </div>
      )}

      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={save} disabled={!address.trim()}>
          Save
        </button>
      </div>

      {!plot.cancellation && !plot.completionDate && (
        <div className="section">
          <h3>If the customer pulls out</h3>
          <div className="card">
            <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
              Recording a cancellation keeps the plot (and its evidence) and starts the refund
              deadline: the reservation fee within 14 days (in full if still in cooling-off), or
              the contract deposit within 28 days.
            </p>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Date the customer's notice was received</label>
              <input type="date" value={cancelDate} max={todayISO()} onChange={(e) => setCancelDate(e.target.value)} />
            </div>
            <div className="wrap-actions">
              <button className="btn btn-sm btn-danger" onClick={() => recordCancellation('reservation')}>
                Reservation cancelled
              </button>
              {(plot.exchangeDate || exchangeDate || completionDate) && (
                <button className="btn btn-sm btn-danger" onClick={() => recordCancellation('contract')}>
                  Contract cancelled
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {onDelete && (
        <div className="section">
          <button className="btn btn-sm btn-danger btn-block" onClick={onDelete}>
            Delete this plot and its records
          </button>
        </div>
      )}
    </Sheet>
  )
}
