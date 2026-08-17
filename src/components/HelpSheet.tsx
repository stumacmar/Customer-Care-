/*
 * The dead-simple how-to guide. Toggled from the "?" button in the top bar.
 * Seven short lines — if it needs more than that, the app is too complicated.
 */

import { Sheet } from './ui'
import { BrandMark } from './Brand'
import { Icon, type IconName } from './icons'

type Step = { icon: IconName; tint: string; text: string } | { rag: true; text: string }

const STEPS: Step[] = [
  { icon: 'plus', tint: 'var(--brand)', text: 'Add your development, then add a plot as each sale nears completion.' },
  {
    icon: 'check-circle',
    tint: 'var(--green)',
    text: 'Tick off each document as you give it to the customer. This builds your supporting documentation, ready if the customer ever raises a query in future.',
  },
  {
    icon: 'wrench',
    tint: 'var(--snag)',
    text: 'The moment a customer reports anything, log it: Snag, Complaint or Emergency. The app starts the clock — you never work out a date.',
  },
  {
    rag: true,
    text: 'Glance at the colours daily. Orange = act this week. Red = act today. Green = relax.',
  },
  {
    icon: 'mail',
    tint: 'var(--complaint)',
    text: 'For a complaint, tap "Draft" at each step. The letter is written for you with the right dates — check it, fill the brackets, email it.',
  },
  {
    icon: 'calendar',
    tint: 'var(--brand)',
    text: 'Tap "Remind me" on any issue to drop its deadlines into your phone calendar with alerts.',
  },
  {
    icon: 'file',
    tint: 'var(--text-dim)',
    text: 'If a complaint is ever escalated to the Ombudsman, tap "Export" on the plot — it shows every document you supplied and the dates you did so, all in one file.',
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

export function HelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="How to use NHQB Plot Tracker" subtitle="The whole app in 7 lines." onClose={onClose}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '2px 0 16px',
          padding: '12px 14px',
          background: 'var(--bg-elev-2)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--line)',
        }}
      >
        <BrandMark size={40} className="brand-mark" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, letterSpacing: '0.16em', fontSize: 16 }}>NHQB</div>
          <div className="muted" style={{ fontSize: 12 }}>
            New Homes Quality Code compliance, one plot at a time.
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
        The golden rule: <strong>log it the moment it happens</strong>, on your phone, on site.
        Everything else — deadlines, letters, documentation — follows by itself.
      </p>
      <button className="btn btn-block" onClick={onClose}>
        Got it
      </button>
    </Sheet>
  )
}
