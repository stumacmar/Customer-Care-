/*
 * The Guide tab — three ways in, one at a time:
 *
 *   Watch  a poster grid of the tour and the fifteen scenario videos,
 *          grouped by where they fall in a plot's life. Tap one and it
 *          plays in a theatre sheet — only ever one player on screen.
 *   Read   the manual, text first, with compact chips that open the
 *          theatre at the relevant video (or the right second of the tour).
 *   Print  the step-by-step picture guide, with its cover.
 *
 * Browsing and watching are separate on purpose: fifteen inline players
 * stacked in an accordion is how this tab used to feel, and it felt like it.
 */

import { useEffect, useRef, useState } from 'react'
import { Icon } from './icons'
import { Sheet } from './ui'
import { VIDEOS, type VideoSlug } from '../lib/videoLibrary'

type Panel = 'watch' | 'read' | 'print'
type Playing = { kind: 'scenario'; slug: VideoSlug } | { kind: 'tour'; at?: number }

const PANEL_KEY = 'nhqb-guide-panel'
const TOUR_DURATION = 139

/** The Watch grid, in journey order. Theatre's "Next" follows this order. */
const GROUPS: { title: string; slugs: VideoSlug[] }[] = [
  { title: 'Getting started', slugs: ['setup'] },
  {
    title: 'Before completion',
    slugs: ['reservation', 'exchange', 'choices', 'major-change', 'delay', 'notice-inspection', 'completion', 'cooling-off-cancellation'],
  },
  { title: 'After completion', slugs: ['snag', 'complaint', 'emergency', 'emails', 'second-owner', 'ombudsman'] },
]
const ORDER: VideoSlug[] = GROUPS.flatMap((g) => g.slugs)

/**
 * The manual. Each section names the scenario videos that belong to it, or a
 * second in the tour for the two sections that are about the screen rather
 * than a Code stage. IMPORTANT: tour timestamps must be refreshed whenever
 * demo.mp4 is re-recorded; the scenario videos regenerate with the app.
 */
const SECTIONS: { title: string; videos?: VideoSlug[]; watchAt?: number; body: string[] }[] = [
  {
    title: 'Set up once (two minutes)',
    videos: ['setup'],
    body: [
      'Open Settings (the gear, top right). Enter your company name — it appears on every letter and export — and your email, which is where buyer reports arrive when you share a plot link.',
      'Take your first backup from Settings too. Everything lives only on this device, so the backup file (kept in your email, Drive or iCloud) is your safety net — and how you move your records between phone and computer.',
      'On your phone, open plotclock.co.uk in the browser and choose "Add to Home Screen" — the app then works like any other app, including with no signal on site.',
    ],
  },
  {
    title: 'The day a home is reserved',
    videos: ['reservation'],
    body: [
      'Add the development if it\'s new, then "+ Plot" — address, customer name and email, reservation date. That\'s all the typing.',
      'The app starts the 14-day cooling-off period itself, and sets the exchange-by date to the Code minimum of six weeks (edit it if your Reservation Agreement says different).',
      'Tick off the reservation documents as you hand them over: the signed Reservation Agreement and the Affordability Schedule. The checklist only ever asks for what\'s due at the stage you\'ve reached.',
    ],
  },
  {
    title: 'Reading the screen',
    watchAt: 13,
    body: [
      'Every plot leads with one line — the next thing to do and when. If you only glance at one thing, glance at that.',
      'Colours: green means on track, orange means act this week, red means act today. Anything red sorts to the top of every list.',
      'The journey strip shows where the plot is: Reserved → Exchanged → Notice → Completed. Record each date as it happens via "Edit details & dates" — the right deadlines follow automatically.',
      'Tap "why?" on any deadline or checklist group to see the exact Code rule behind it, quoted. (Clause numbers stay out of your way otherwise — turn them on in Settings if you want them visible.)',
    ],
  },
  {
    title: 'Exchange of contracts',
    videos: ['exchange'],
    body: [
      'Before exchange, the checklist asks for the pre-contract information — sent to the buyer\'s solicitor or conveyancer — and for the contract terms to be confirmed compliant. Exchange must happen by the agreed exchange-by date, which the Code sets at no less than six weeks from reservation unless the buyer asks for earlier.',
      'When contracts exchange, record the date under "Edit details & dates". The journey moves on, the checklist moves to the next stage, and the buyer\'s app shows them where they are.',
    ],
  },
  {
    title: 'Choices, changes and delays',
    videos: ['choices', 'major-change', 'delay'],
    body: [
      '"Log a choice, change, delay or visit" on the plot — one line, optional photo, ten seconds. Front door colour confirmed, worktop upgrade paid, completion slipping three weeks, plumber attended (or got no access): log it the day it happens and the evidence trail builds itself.',
      'A MAJOR change (one that significantly affects size, appearance or value) is special: the app starts the customer\'s 14-day cancellation window, warns you not to serve notice to complete during it, and drafts the written notice the Code requires. When the window ends, record whether they accepted or cancelled.',
      'A delay offers a ready-drafted timetable update letter — and remember to update the expected completion date on the plot.',
      'A site visit takes ten seconds to log: who came, when, and whether they attended, got no access, or were turned away — with a photo of the job sheet if there is one. Attendance disputes are among the most common Code disputes, and this is the evidence that settles them.',
    ],
  },
  {
    title: 'Emails with the customer',
    videos: ['emails'],
    body: [
      'The evidence trail is only complete if the emails are in it — and at dispute time nobody wants to be dragging messages out of Outlook. "Log an email" on the plot takes a pasted email, to or from the customer, with the date it was actually sent (not the date you pasted it).',
      'It joins the timeline and both exports, so the file you hand the Ombudsman carries the correspondence alongside the dates, documents and letters.',
      'On Android you can skip the copying: share an email straight from your mail app to Plot Tracker, pick the plot, and the form arrives filled in. On iPhone, copy and paste.',
      'Log it the day it happens, like everything else. A one-line "chasing the plumber again" is worth more six months later than a perfect memory of what you think you sent.',
    ],
  },
  {
    title: 'Notice, inspection and completion',
    videos: ['notice-inspection', 'completion'],
    body: [
      'When you serve notice to complete, record the date. The app checks you\'ve left at least 14 calendar days before completion and chases you to offer the pre-completion inspection — the buyer can attend themselves or send a professional, using the NHQB checklist.',
      'Anything the inspection finds that breaches warranty standards: log it as a snag — fix ideally before completion, or within 30 days.',
      'At completion, work down the handover group of the checklist: schedules of incomplete work, home demonstration, warranty documents, complaints procedure, health & safety file, building regs certificate, after-sales statement. Attach files as you go.',
    ],
  },
  {
    title: 'After they move in: snags, complaints, emergencies',
    videos: ['snag', 'complaint', 'emergency'],
    body: [
      'The moment a customer reports anything, log it with one of the three big buttons. Never work out a date — the app does it.',
      'Snag: a 30-day put-right deadline. If it can\'t be settled in 30 days, the app reminds you to update the customer at least monthly until it is.',
      'Complaint: the formal timetable starts — acknowledgement by day 5, Path to Resolution by day 10, Assessment & Response by day 30, Eight-Week letter by day 56, then 28-day updates. Each step has a "Draft" button; the letter comes pre-filled with the right dates. Check it, fill the brackets, email it. If a second complaint arrives while one is open, you can add it to the existing one — a single timetable from the first.',
      'Emergency: an immediate threat to safety, security, health or well-being. It\'s flagged urgent and never queues behind routine work.',
      '"Remind me" on any issue (or on the journey) drops its deadlines into your phone calendar with alerts.',
    ],
  },
  {
    title: 'If the home is sold on',
    videos: ['second-owner'],
    body: [
      'If the home changes hands within the two years, the Code\'s after-sales cover follows the home. Record the ownership transfer under "Edit details & dates", update the customer name and email to the new owner, and share a fresh buyer link.',
      'The new owner\'s app is an after-sales-only view — no purchase history, which belonged to the first buyer — with their cover date, the guided report flow, and their rights under the Code.',
    ],
  },
  {
    title: 'Sharing with your buyer',
    watchAt: 91,
    body: [
      '"Share with buyer" on the plot creates a private link — the plot\'s details travel inside the link itself, not through any server. Copy it into WhatsApp or use the pre-written email.',
      'The buyer sees their own app: where their home is up to, their rights under the Code, the documents they\'ve received, their choices, and any issues with the response deadlines they\'re entitled to. They can add it to their home screen.',
      'When they report a problem, you get an email carrying a small code. Tap "Paste a report from the buyer\'s app" under the three log buttons, paste the email, and it logs with the correct Code timescale — their words and date preserved. Their app keeps their own record of what they sent and when.',
      'Their side is guided, so they never have to know the Code\'s vocabulary: they choose what the issue is about — the home, money or a refund, specification, timescales, a missed appointment — and the app routes it to the right process. Worth knowing: before completion everything arrives as a formal complaint, because under the Code snags only exist after completion; and the emergency option only appears to them once they have moved in. So do not be surprised by a "complaint" for something you would call a snag — that is the Code\'s classification, and its timetable applies.',
      'Share a fresh link whenever there\'s an update worth showing — each new link replaces their snapshot.',
    ],
  },
  {
    title: 'If the sale falls through',
    videos: ['cooling-off-cancellation'],
    body: [
      'Record it under "Edit details & dates" → "If the customer pulls out". The refund deadline starts: the reservation fee within 14 days (in full if they\'re still in cooling-off), or the contract deposit within 28 days if contracts had been exchanged.',
      'Mark the refund paid when it\'s done — the plot then archives itself with its evidence intact.',
    ],
  },
  {
    title: 'Formal complaints to the Ombudsman',
    videos: ['ombudsman'],
    body: [
      'Tap "Export PDF" on the plot: every date, document, change, email, letter and timeline event in one clean file — the record you hand to the NHQB compliance team, the New Homes Ombudsman, or your insurer.',
      'Plots archive themselves two years after completion, when the Ombudsman window closes. Settings → Data housekeeping then prompts you to export a copy and delete the personal data (that\'s the GDPR-friendly habit).',
    ],
  },
]

const sectionId = (title: string) => 'guide-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
const sectionFor = (slug: VideoSlug) => SECTIONS.find((s) => s.videos?.includes(slug))

function formatStamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function loadPanel(): Panel {
  try {
    const p = localStorage.getItem(PANEL_KEY)
    if (p === 'read' || p === 'print') return p
  } catch {
    /* ignore */
  }
  return 'watch'
}

// ---------------------------------------------------------------------------

function PosterCard({ slug, onPlay }: { slug: VideoSlug; onPlay: () => void }) {
  const v = VIDEOS[slug]
  return (
    <button className="vcard" onClick={onPlay} aria-label={`Play: ${v.title}`}>
      <span className="poster">
        <img src={`./videos/${slug}.jpg`} alt="" loading="lazy" />
        <span className="play">▶</span>
        <span className="dur">{formatStamp(v.duration)}</span>
      </span>
      <span className="vt">
        <b>{v.title}</b>
        <span>{v.code}</span>
      </span>
    </button>
  )
}

function TourHero({ onPlay }: { onPlay: () => void }) {
  return (
    <button className="vhero" onClick={onPlay} aria-label="Play the two-minute tour">
      <img src="./demo.jpg" alt="" />
      <span className="vh-text">
        <span className="vh-kicker">Start here</span>
        <b>The two-minute tour</b>
        <span className="vh-sub">The whole app, narrated with captions — {formatStamp(TOUR_DURATION)}. Sound on.</span>
        <span className="vh-play">▶ Play</span>
      </span>
    </button>
  )
}

function Theatre({
  playing,
  onClose,
  onNext,
  onRead,
}: {
  playing: Playing
  onClose: () => void
  onNext: (() => void) | null
  onRead: (() => void) | null
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const isTour = playing.kind === 'tour'
  const meta = isTour ? null : VIDEOS[playing.slug]
  const title = isTour ? 'The two-minute tour' : meta!.title
  const sub = isTour
    ? playing.at !== undefined
      ? `From ${formatStamp(playing.at)} — the moment this section is about.`
      : `The whole app in ${formatStamp(TOUR_DURATION)}.`
    : `${meta!.code} · ${formatStamp(meta!.duration)} · what you do, then what your buyer sees`

  useEffect(() => {
    const v = ref.current
    if (!v) return
    // Seek straight away — browsers honour a currentTime set before metadata
    // as the start position, so there is no flash of frame zero — and again
    // once metadata lands, for the ones that don't.
    const seek = () => {
      if (isTour && playing.at !== undefined) {
        try {
          v.currentTime = playing.at
        } catch {
          /* not seekable yet — the loadedmetadata pass will do it */
        }
      }
    }
    seek()
    const start = () => {
      seek()
      void v.play().catch(() => {
        /* browsers that refuse autoplay leave the controls ready */
      })
    }
    if (v.readyState >= 1) start()
    else v.addEventListener('loadedmetadata', start, { once: true })
    return () => v.removeEventListener('loadedmetadata', start)
  }, [playing, isTour])

  return (
    <Sheet title={title} subtitle={sub} onClose={onClose}>
      <video
        ref={ref}
        className="theatre-video"
        src={isTour ? './demo.mp4' : `./videos/${playing.slug}.mp4`}
        controls
        playsInline
        preload="auto"
        aria-label={`Video: ${title}`}
      />
      <div className="wrap-actions" style={{ marginTop: 12 }}>
        {onNext && (
          <button className="btn btn-sm btn-primary" onClick={onNext}>
            Next video <Icon name="arrow-right" size={15} />
          </button>
        )}
        {onRead && (
          <button className="btn btn-sm" onClick={onRead}>
            <Icon name="book" size={15} /> Read about this
          </button>
        )}
        <button className="btn btn-sm btn-ghost" onClick={onClose}>
          Done
        </button>
      </div>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------

export function GuideTab() {
  const [panel, setPanelState] = useState<Panel>(loadPanel)
  const [playing, setPlaying] = useState<Playing | null>(null)

  const setPanel = (p: Panel) => {
    setPanelState(p)
    try {
      localStorage.setItem(PANEL_KEY, p)
    } catch {
      /* ignore */
    }
  }

  const play = (slug: VideoSlug) => setPlaying({ kind: 'scenario', slug })
  const playTour = (at?: number) => setPlaying({ kind: 'tour', at })

  const next = (): (() => void) | null => {
    if (!playing) return null
    if (playing.kind === 'tour') return () => play(ORDER[0])
    const i = ORDER.indexOf(playing.slug)
    return i >= 0 && i < ORDER.length - 1 ? () => play(ORDER[i + 1]) : null
  }

  const readAbout = (): (() => void) | null => {
    if (!playing || playing.kind === 'tour') return null
    const section = sectionFor(playing.slug)
    if (!section) return null
    return () => {
      setPlaying(null)
      setPanel('read')
      setTimeout(() => {
        const el = document.getElementById(sectionId(section.title)) as HTMLDetailsElement | null
        if (el) {
          el.open = true
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 60)
    }
  }

  return (
    <div className="content">
      <div className="dash-head">
        <h2>Guide</h2>
      </div>

      <div className="seg" role="tablist" aria-label="Guide sections">
        {(
          [
            ['watch', 'Watch'],
            ['read', 'Read'],
            ['print', 'Print'],
          ] as [Panel, string][]
        ).map(([p, label]) => (
          <button key={p} role="tab" aria-selected={panel === p} className={panel === p ? 'on' : ''} onClick={() => setPanel(p)}>
            {label}
          </button>
        ))}
      </div>

      {panel === 'watch' && (
        <>
          <TourHero onPlay={() => playTour()} />
          {GROUPS.map((g) => (
            <div key={g.title} className="section vgroup">
              <h3>
                {g.title} <span className="count-pill">{g.slugs.length}</span>
              </h3>
              <div className="vgrid">
                {g.slugs.map((slug) => (
                  <PosterCard key={slug} slug={slug} onPlay={() => play(slug)} />
                ))}
              </div>
            </div>
          ))}
          <p className="muted" style={{ fontSize: 12, marginTop: 18, lineHeight: 1.55 }}>
            One video per moment in a plot's life — what you do, then what your buyer sees, then
            what the Code says. Each is under a minute and a half.
          </p>
        </>
      )}

      {panel === 'read' && (
        <div className="section" style={{ marginTop: 0 }}>
          <div className="stack">
            {SECTIONS.map((s) => (
              <details key={s.title} id={sectionId(s.title)} className="guide-item">
                <summary>
                  <span>{s.title}</span>
                  <Icon name="arrow-right" size={16} className="guide-chev" />
                </summary>
                <div className="guide-body">
                  <div className="chips">
                    {s.watchAt !== undefined && (
                      <button className="watch-chip" onClick={() => playTour(s.watchAt)}>
                        ▶ Watch in the tour ({formatStamp(s.watchAt)})
                      </button>
                    )}
                    {s.videos?.map((slug) => (
                      <button key={slug} className="watch-chip" onClick={() => play(slug)}>
                        ▶ {VIDEOS[slug].title} · {formatStamp(VIDEOS[slug].duration)}
                      </button>
                    ))}
                  </div>
                  {s.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 20, lineHeight: 1.55 }}>
            The golden rule behind all of it: <strong>log things the moment they happen</strong>,
            on your phone, on site. Deadlines, letters and the audit trail follow by themselves.
            For the rules behind any deadline, see The Code tab — or tap "why?" wherever you see it.
          </p>
        </div>
      )}

      {panel === 'print' && (
        <div className="section" style={{ marginTop: 0 }}>
          <a className="print-card" href="./guide.pdf" target="_blank" rel="noreferrer">
            <img src="./guide-cover.jpg" alt="" />
            <span className="pc-text">
              <span className="vh-kicker">Picture guide</span>
              <b>Ten steps, one screen each</b>
              <span className="muted">
                Every function ringed and explained on an A4 page — for the wall of the site
                office, or anyone who prefers paper.
              </span>
              <span className="btn btn-sm btn-primary" style={{ alignSelf: 'flex-start', marginTop: 10 }}>
                <Icon name="printer" size={15} /> Open the PDF
              </span>
            </span>
          </a>
          <p className="muted" style={{ fontSize: 12, marginTop: 14, lineHeight: 1.55 }}>
            The picture guide is regenerated from the live app whenever a screen changes, so it
            always matches what you see on the phone.
          </p>
        </div>
      )}

      {playing && <Theatre playing={playing} onClose={() => setPlaying(null)} onNext={next()} onRead={readAbout()} />}
    </div>
  )
}
