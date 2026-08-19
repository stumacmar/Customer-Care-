/*
 * The Guide tab — the full instruction manual, in plain English, with the
 * demo video at the top. The "?" button's quick sheet covers the first five
 * minutes; this covers everything, grouped by the moments in a plot's life
 * when you'd reach for the app.
 */

import { useRef } from 'react'
import { Icon } from './icons'

/**
 * Where each manual section's moment appears in the demo video, in seconds —
 * taken from the narration sync pipeline's detected scene offsets, so they
 * are exact. Sections without a scene simply have no link. IMPORTANT: these
 * must be refreshed whenever the demo video is re-recorded.
 */
const SECTIONS: { title: string; watchAt?: number; body: string[] }[] = [
  {
    title: 'Set up once (two minutes)',
    body: [
      'Open Settings (the gear, top right). Enter your company name — it appears on every letter and export — and your email, which is where buyer reports arrive when you share a plot link.',
      'Take your first backup from Settings too. Everything lives only on this device, so the backup file (kept in your email, Drive or iCloud) is your safety net — and how you move your records between phone and computer.',
      'On your phone, open plotclock.co.uk in the browser and choose "Add to Home Screen" — the app then works like any other app, including with no signal on site.',
    ],
  },
  {
    title: 'The day a home is reserved',
    watchAt: 40,
    body: [
      'Add the development if it\'s new, then "+ Plot" — address, customer name and email, reservation date. That\'s all the typing.',
      'The app starts the 14-day cooling-off period itself, and sets the exchange-by date to the Code minimum of six weeks (edit it if your Reservation Agreement says different).',
      'Tick off the reservation documents as you hand them over: the signed Reservation Agreement and the Affordability Schedule. The checklist only ever asks for what\'s due at the stage you\'ve reached.',
    ],
  },
  {
    title: 'Reading the screen',
    watchAt: 11,
    body: [
      'Every plot leads with one line — the next thing to do and when. If you only glance at one thing, glance at that.',
      'Colours: green means on track, orange means act this week, red means act today. Anything red sorts to the top of every list.',
      'The journey strip shows where the plot is: Reserved → Exchanged → Notice → Completed. Record each date as it happens via "Edit details & dates" — the right clocks follow automatically.',
      'Tap "why?" on any clock or checklist group to see the exact Code rule behind it, quoted. (Clause numbers stay out of your way otherwise — turn them on in Settings if you want them visible.)',
    ],
  },
  {
    title: 'Choices, changes and delays',
    watchAt: 50,
    body: [
      '"Log a choice, extra, change or delay" on the plot — one line, optional photo, ten seconds. Front door colour confirmed, worktop upgrade paid, completion slipping three weeks: log it the day it happens and the evidence trail builds itself.',
      'A MAJOR change (one that significantly affects size, appearance or value) is special: the app starts the customer\'s 14-day cancellation window, warns you not to serve notice to complete during it, and drafts the written notice the Code requires. When the window ends, record whether they accepted or cancelled.',
      'A delay offers a ready-drafted timetable update letter — and remember to update the expected completion date on the plot.',
    ],
  },
  {
    title: 'Notice, inspection and completion',
    body: [
      'When you serve notice to complete, record the date. The app checks you\'ve left at least 14 calendar days before completion and chases you to offer the pre-completion inspection — the buyer can attend themselves or send a professional, using the NHQB checklist.',
      'Anything the inspection finds that breaches warranty standards: log it as a snag — fix ideally before completion, or within 30 days.',
      'At completion, work down the handover group of the checklist: schedules of incomplete work, home demonstration, warranty documents, complaints procedure, health & safety file, building regs certificate, after-sales statement. Attach files as you go.',
    ],
  },
  {
    title: 'After they move in: snags, complaints, emergencies',
    watchAt: 70,
    body: [
      'The moment a customer reports anything, log it with one of the three big buttons. Never work out a date — the app does it.',
      'Snag: a 30-day put-right clock. If it can\'t be settled in 30 days, the app reminds you to update the customer at least monthly until it is.',
      'Complaint: the formal timetable starts — acknowledgement by day 5, Path to Resolution by day 10, Assessment & Response by day 30, Eight-Week letter by day 56, then 28-day updates. Each step has a "Draft" button; the letter comes pre-filled with the right dates. Check it, fill the brackets, email it. If a second complaint arrives while one is open, you can add it to the existing one — a single timetable from the first.',
      'Emergency: anything that\'s an immediate risk to safety, security or health. It\'s flagged urgent and never queues behind routine work.',
      '"Remind me" on any issue (or on the journey) drops its deadlines into your phone calendar with alerts.',
    ],
  },
  {
    title: 'Sharing with your buyer',
    watchAt: 94,
    body: [
      '"Share with buyer" on the plot creates a private link — the plot\'s details travel inside the link itself, not through any server. Copy it into WhatsApp or use the pre-written email.',
      'The buyer sees their own app: where their home is up to, their rights in plain English, the documents they\'ve received, their choices, and any issues with the response deadlines they\'re entitled to. They can add it to their home screen.',
      'When they report a problem, you get an email carrying a small code. Tap "Paste a report from the buyer\'s app" under the three log buttons, paste the email, and it logs with the correct clock — their words and date preserved. Their app keeps their own record of what they sent and when.',
      'Share a fresh link whenever there\'s an update worth showing — each new link replaces their snapshot.',
    ],
  },
  {
    title: 'If the sale falls through',
    body: [
      'Record it under "Edit details & dates" → "If the customer pulls out". The refund clock starts: the reservation fee within 14 days (in full if they\'re still in cooling-off), or the contract deposit within 28 days if contracts had been exchanged.',
      'Mark the refund paid when it\'s done — the plot then archives itself with its evidence intact.',
    ],
  },
  {
    title: 'If it ever goes to the Ombudsman',
    body: [
      'Tap "Export PDF" on the plot: every date, document, change, letter and timeline event in one clean file — the record you hand to the NHQB compliance team, the New Homes Ombudsman, or your insurer.',
      'Plots archive themselves two years after completion, when the Ombudsman window closes. Settings → Data housekeeping then prompts you to export a copy and delete the personal data (that\'s the GDPR-friendly habit).',
    ],
  },
]

function formatStamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function GuideTab() {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Jump the one demo video to a section's scene and play it — the manual's
  // "mini demos" without shipping nine separate films.
  const watch = (t: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = t
    void v.play().catch(() => {
      /* some browsers refuse play() before any interaction — seek still lands */
    })
    v.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="content">
      <div className="dash-head">
        <h2>Guide</h2>
      </div>

      <div className="card" style={{ padding: 10, marginBottom: 4 }}>
        <video
          ref={videoRef}
          className="demo-video"
          src="./demo.mp4"
          controls
          playsInline
          preload="metadata"
          aria-label="Demo video tour of the app"
        />
        <p className="muted" style={{ fontSize: 12.5, margin: '8px 4px 2px' }}>
          The whole app in two and a half minutes — narrated, with captions. Sound on.
        </p>
      </div>

      <div className="section">
        <h3>The manual</h3>
        <div className="stack">
          {SECTIONS.map((s) => (
            <details key={s.title} className="guide-item">
              <summary>
                <span>{s.title}</span>
                <Icon name="arrow-right" size={16} className="guide-chev" />
              </summary>
              <div className="guide-body">
                {s.watchAt !== undefined && (
                  <button className="watch-chip" onClick={() => watch(s.watchAt!)}>
                    ▶ Watch this bit in the demo ({formatStamp(s.watchAt)})
                  </button>
                )}
                {s.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>

      <p className="muted" style={{ fontSize: 12, marginTop: 20, lineHeight: 1.55 }}>
        The golden rule behind all of it: <strong>log things the moment they happen</strong>, on
        your phone, on site. Deadlines, letters and the audit trail follow by themselves. For
        the rules behind any clock, see The Code tab — or tap "why?" wherever you see it.
      </p>
    </div>
  )
}
