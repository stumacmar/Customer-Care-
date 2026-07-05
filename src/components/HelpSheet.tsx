/*
 * The dead-simple how-to guide. Toggled from the "?" button in the top bar.
 * Seven short lines — if it needs more than that, the app is too complicated.
 */

import { Sheet } from './ui'

const STEPS: { ico: string; text: string }[] = [
  { ico: '➕', text: 'Add a plot when a sale is nearing completion.' },
  { ico: '✅', text: 'Tick off each document as you hand it to the customer — that list is your proof.' },
  {
    ico: '🔧',
    text: 'The moment a customer reports anything, log it: Snag, Complaint or Emergency. The app starts the legal clock — you never work out a date.',
  },
  {
    ico: '🟠',
    text: 'Glance at the colours daily. Orange = act this week. Red = act today. Green = relax.',
  },
  {
    ico: '✉',
    text: 'For a complaint, tap "Draft" at each step. The letter is written for you with the right dates — check it, fill the brackets, email it.',
  },
  { ico: '🗓', text: 'Tap "Remind me" on any issue to drop its deadlines into your phone calendar with alerts.' },
  { ico: '📄', text: 'If NHQB or the Ombudsman ever asks, tap "Export" on the plot. That\'s your whole defence, in one file.' },
]

export function HelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="How to use Plot Clock" subtitle="The whole app in 7 lines." onClose={onClose}>
      <div className="stack" style={{ marginBottom: 16 }}>
        {STEPS.map((s, i) => (
          <div key={i} className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22, lineHeight: 1.2 }}>{s.ico}</span>
            <span style={{ fontSize: 15 }}>{s.text}</span>
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 13 }}>
        The golden rule: <strong>log it the moment it happens</strong>, on your phone, on site.
        Everything else — deadlines, letters, evidence — follows by itself.
      </p>
      <button className="btn btn-block" onClick={onClose}>
        Got it
      </button>
    </Sheet>
  )
}
