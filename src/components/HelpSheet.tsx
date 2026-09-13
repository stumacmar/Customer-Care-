/*
 * The dead-simple how-to guide. Toggled from the "?" button in the top bar.
 * Nine short lines — if it needs more than that, the app is too complicated.
 */

import { Sheet } from './ui'
import { BrandMark } from './Brand'
import { Icon, type IconName } from './icons'

type Step = { icon: IconName; tint: string; text: string } | { rag: true; text: string }

const STEPS: Step[] = [
  {
    icon: 'plus',
    tint: 'var(--brand)',
    text: 'Add your development, then add a plot the day its Reservation Agreement is signed. The 14-day cooling-off and exchange-by deadlines start themselves.',
  },
  {
    icon: 'key',
    tint: 'var(--brand)',
    text: 'Record each date as it happens — exchange, notice to complete, completion. The journey strip shows where every plot is, and the Code deadlines follow.',
  },
  {
    icon: 'clipboard',
    tint: 'var(--green)',
    text: 'Log every choice, extra, change, delay, site visit and email with the one button under Spec & changes. For a major change, call the customer first; the app drafts the written notice, and the customer\'s 14-day cancellation window runs from the day they receive it.',
  },
  {
    icon: 'check-circle',
    tint: 'var(--green)',
    text: 'Tick off each document as you give it — grouped by stage, from the Reservation Agreement to completion and handover. That is your evidence trail.',
  },
  {
    icon: 'wrench',
    tint: 'var(--snag)',
    text: 'The moment a customer reports anything, log it: Snag (or defect), Complaint, or Emergency — or paste in the email from their app. The app works out the Code deadline — you never calculate a date.',
  },
  {
    rag: true,
    text: 'Glance at the colours daily. Red = overdue, or an emergency. Amber = due within five days. Green = on track, time in hand.',
  },
  {
    icon: 'edit',
    tint: 'var(--complaint)',
    text: 'Letters are drafted for you with the right dates — complaint letters, major-change notices, delay updates. Check, fill the brackets, email.',
  },
  {
    icon: 'mail',
    tint: 'var(--complaint)',
    text: 'Log emails to and from the customer as they happen — pick Email under the same button — so the evidence trail is in the record and not only in your inbox.',
  },
  {
    icon: 'file',
    tint: 'var(--text-dim)',
    text: 'If anything is ever referred to the Ombudsman, tap "Export PDF" — every date, document, change, email and letter in one file.',
  },
]

function StepIcon({ step }: { step: Step }) {
  if ('rag' in step) {
    return (
      <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
        <span className="dot rag-red" />
        <span className="dot rag-amber" />
        <span className="dot rag-green" />
      </span>
    )
  }
  return (
    <span style={{ color: step.tint, display: 'inline-flex' }}>
      <Icon name={step.icon} size={22} />
    </span>
  )
}

export function HelpSheet({ onClose, onOpenGuide }: { onClose: () => void; onOpenGuide?: () => void }) {
  return (
    <Sheet title="How to use NHQB Plot Tracker" subtitle="The whole app in 9 lines." onClose={onClose}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '2px 0 16px',
          padding: '12px 14px',
          background: 'var(--bg-elev)',
          borderRadius: 'var(--radius)',
        }}
      >
        <BrandMark size={40} className="brand-mark" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, letterSpacing: '0.16em', fontSize: 16 }}>NHQB</div>
          <div className="muted" style={{ fontSize: 12 }}>
            Tracks plot progress, keeps customers updated, and keeps you on the Code.
          </div>
        </div>
      </div>
      <div className="stack" style={{ marginBottom: 16 }}>
        {STEPS.map((s, i) => (
          <div key={i} className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ lineHeight: 1.2, marginTop: 1, flex: '0 0 auto' }}>
              <StepIcon step={s} />
            </span>
            <span style={{ fontSize: 15 }}>{s.text}</span>
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 13 }}>
        The one rule: <strong>log it the moment it happens</strong>, on your phone, on site.
        Everything else — deadlines, letters, documentation — follows by itself.
      </p>
      {onOpenGuide && (
        <button className="btn btn-block" style={{ marginBottom: 8 }} onClick={onOpenGuide}>
          Guide and videos
        </button>
      )}
      <button className="btn btn-block btn-primary" onClick={onClose}>
        Got it
      </button>
    </Sheet>
  )
}
