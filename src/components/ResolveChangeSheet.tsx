/*
 * Record how a major change's 14-day window ended (Code 2.9): the customer
 * accepted the change, or cancelled — in which case the full-refund clock
 * needs to start, so we offer to record the cancellation in the same tap.
 */

import { Sheet } from './ui'
import { useStore } from '../state/store'
import { plotStage } from '../lib/code'
import { todayISO } from '../lib/dates'
import type { ChangeRecord, Plot } from '../types'

export function ResolveChangeSheet({
  plot,
  change,
  onClose,
  onToast,
}: {
  plot: Plot
  change: ChangeRecord
  onClose: () => void
  onToast: (msg: string) => void
}) {
  const { dispatch } = useStore()

  const accept = () => {
    dispatch({ type: 'RESOLVE_CHANGE', plotId: plot.id, changeId: change.id, outcome: 'accepted' })
    onToast('Recorded — customer accepted the change')
    onClose()
  }

  const cancelled = () => {
    dispatch({ type: 'RESOLVE_CHANGE', plotId: plot.id, changeId: change.id, outcome: 'cancelled' })
    // Starting the refund clock needs the cancellation recorded on the plot:
    // deposit within 28 days if contracts were exchanged, reservation fee
    // within 14 days otherwise (Code 2.13 / 2.4).
    const kind = plotStage(plot) === 'exchanged' || plot.exchangeDate ? 'contract' : 'reservation'
    dispatch({ type: 'RECORD_CANCELLATION', plotId: plot.id, kind, date: todayISO() })
    onToast('Cancellation recorded — the refund clock is running')
    onClose()
  }

  return (
    <Sheet
      title="How did the major change end?"
      subtitle={change.description}
      onClose={onClose}
    >
      <div className="stack" style={{ marginBottom: 8 }}>
        <button className="btn btn-block btn-primary" onClick={accept}>
          Customer accepted — carry on
        </button>
        <button className="btn btn-block btn-danger" onClick={cancelled}>
          Customer cancelled the purchase
        </button>
      </div>
      <p className="muted" style={{ fontSize: 13 }}>
        If the customer cancelled, the Code requires a <strong>full refund</strong> of the
        contract deposit, reservation fee and any other payments (2.9) — the refund clock
        starts on this plot the moment you record it.
      </p>
      <button className="btn btn-block btn-ghost" onClick={onClose}>
        Back
      </button>
    </Sheet>
  )
}
