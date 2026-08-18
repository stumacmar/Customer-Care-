/*
 * The plot's buying journey: a stage strip (Reserved → Exchanged → Notice →
 * Completed) and the Code's pre-completion clocks — cooling-off (2.3), the
 * exchange-by date (2.2), major-change windows (2.9), refunds after
 * cancellation (2.4/2.13), the completion notice period and the
 * pre-completion inspection (2.8). All derived from dates; nothing to work out.
 */

import { journeyClocksForPlot, plotStage, STAGE_LABELS } from '../lib/code'
import { describeCountdown, formatDate } from '../lib/dates'
import { downloadJourneyCalendar } from '../lib/ics'
import { useStore } from '../state/store'
import { Icon } from './icons'
import type { JourneyClock, Plot } from '../types'

const STEPS: { key: 'reserved' | 'exchanged' | 'notice_served' | 'completed'; label: string; dateOf: (p: Plot) => string | undefined }[] = [
  { key: 'reserved', label: 'Reserved', dateOf: (p) => p.reservationDate },
  { key: 'exchanged', label: 'Exchanged', dateOf: (p) => p.exchangeDate },
  { key: 'notice_served', label: 'Notice', dateOf: (p) => p.noticeServedDate },
  { key: 'completed', label: 'Completed', dateOf: (p) => p.completionDate },
]

export function JourneySection({
  plot,
  onToast,
  onResolveMajorChange,
  onExplainCode,
}: {
  plot: Plot
  onToast: (msg: string) => void
  onResolveMajorChange: (changeId: string) => void
  onExplainCode: (ref: string) => void
}) {
  const { state, dispatch } = useStore()
  const stage = plotStage(plot)
  const clocks = journeyClocksForPlot(plot)
  const reached = STEPS.findIndex((s) => s.key === stage)

  const markRefunded = () => {
    dispatch({ type: 'RECORD_REFUND', plotId: plot.id })
    onToast('Refund recorded — plot moves to the archive')
  }

  const remindMe = () => {
    if (downloadJourneyCalendar(plot)) {
      onToast('Calendar file downloaded — open it to add the reminders')
    } else {
      onToast('No upcoming journey dates to remind about')
    }
  }

  return (
    <div className="section">
      <h3>
        Journey <span className="count-pill">{STAGE_LABELS[stage]}</span>
      </h3>

      {stage === 'cancelled' ? (
        <div className="card" style={{ borderColor: 'var(--red)' }}>
          <strong>
            {plot.cancellation?.kind === 'contract' ? 'Contract cancelled' : 'Reservation cancelled'}
          </strong>{' '}
          <span className="muted">— {formatDate(plot.cancellation?.date)}</span>
          {plot.cancellation?.refundedDate ? (
            <div className="muted" style={{ marginTop: 4 }}>
              Refund paid {formatDate(plot.cancellation.refundedDate)}. Record kept for your files.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="journey-strip" aria-label="Journey stages">
          {STEPS.map((s, i) => {
            const date = s.dateOf(plot)
            // A step is "done" when its own date is recorded and the plot has
            // reached at least that stage (a future completion date shows as
            // the upcoming target, not done).
            const done = i <= reached && !!date
            const current = i === reached + 1 || (i === 0 && reached < 0)
            return (
              <div key={s.key} className={`j-step${done ? ' done' : ''}${current ? ' next' : ''}`}>
                <span className="j-dot">{done ? <Icon name="check" size={12} strokeWidth={3} /> : null}</span>
                <span className="j-label">{s.label}</span>
                <span className="j-date">{date ? formatDate(date) : '—'}</span>
              </div>
            )
          })}
        </div>
      )}

      {clocks.length > 0 && (
        <div className="stack" style={{ marginTop: 10 }}>
          {clocks.map((c) => (
            <JourneyClockCard
              key={`${c.kind}-${c.changeId || ''}`}
              clock={c}
              showRef={!!state.showCodeRefs}
              onExplain={() => onExplainCode(c.clause)}
              onMarkRefunded={c.kind === 'refund' ? markRefunded : undefined}
              onResolve={c.kind === 'major_change' && c.changeId ? () => onResolveMajorChange(c.changeId!) : undefined}
            />
          ))}
        </div>
      )}

      {stage !== 'cancelled' && stage !== 'completed' && clocks.some((c) => c.dueDate) && (
        <button className="btn btn-sm btn-ghost" style={{ marginTop: 8 }} onClick={remindMe}>
          <Icon name="calendar" size={15} /> Remind me — add these dates to my calendar
        </button>
      )}
    </div>
  )
}

function JourneyClockCard({
  clock,
  showRef,
  onExplain,
  onMarkRefunded,
  onResolve,
}: {
  clock: JourneyClock
  showRef: boolean
  onExplain: () => void
  onMarkRefunded?: () => void
  onResolve?: () => void
}) {
  return (
    <div className={`card clock rag-${clock.rag}`}>
      <div className="info">
        <div className="label">
          {clock.label}
          {showRef && <span className="clause-ref">Code {clock.clause}</span>}
        </div>
        {clock.detail && (
          <div className="when" style={{ marginTop: 2 }}>
            {clock.detail}{' '}
            <button className="whylink" onClick={onExplain}>
              why?
            </button>
          </div>
        )}
        {(onMarkRefunded || onResolve) && (
          <div className="wrap-actions" style={{ marginTop: 8 }}>
            {onMarkRefunded && (
              <button className="btn btn-sm btn-primary" onClick={onMarkRefunded}>
                Mark refund paid
              </button>
            )}
            {onResolve && (
              <button className="btn btn-sm" onClick={onResolve}>
                Record outcome
              </button>
            )}
          </div>
        )}
      </div>
      {clock.dueDate && (
        <div className="count">
          {clock.info ? (
            <>
              until
              <br />
              {formatDate(clock.dueDate)}
            </>
          ) : (
            describeCountdown(clock.daysRemaining ?? 0)
          )}
        </div>
      )}
    </div>
  )
}
