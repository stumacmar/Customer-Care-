/*
 * The buyer's app — what the customer sees when they open the private link
 * their developer shared (Phase 5 of the brief, without a server).
 *
 * The link's fragment carries a snapshot of their plot: journey dates,
 * documents received, choices and changes, and issue status. It is stored
 * locally so the app works offline and can be added to the home screen.
 * Reporting a problem generates a pre-addressed email carrying a small code
 * the developer pastes into their tracker — which starts the Code's clock —
 * and every report is kept here as the buyer's own evidence trail.
 */

import { useEffect, useMemo, useState } from 'react'
import { BrandMark } from '../components/Brand'
import { Icon } from '../components/icons'
import { Sheet, useToast, DictationField } from '../components/ui'
import {
  AFTER_SALES_YEARS,
  COOLING_OFF_DAYS,
  FIXED_MILESTONES,
  MAJOR_CHANGE_CANCEL_DAYS,
  SNAG_PUT_RIGHT_DAYS,
} from '../lib/code'
import { NHOS_CONTACT } from '../lib/letters'
import { addDays, daysFromToday, formatDate, nowISO, todayISO } from '../lib/dates'
import { id } from '../lib/storage'
import {
  decodeShare,
  encodeShare,
  type BuyerReport,
  type BuyerSnapshot,
  type SnapshotIssue,
} from '../lib/share'
import type { IssueType } from '../types'

export const BUYER_STORAGE_KEY = 'nhqb-buyer-state-v1'

interface SentReport {
  id: string
  type: IssueType
  description: string
  sentOn: string // ISO date
}

interface BuyerState {
  version: 1
  snapshot: BuyerSnapshot
  receivedAt: string // ISO datetime the link was opened
  reports: SentReport[]
}

function loadBuyerState(): BuyerState | null {
  try {
    const raw = localStorage.getItem(BUYER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BuyerState
    if (!parsed || parsed.version !== 1 || !parsed.snapshot) return null
    return parsed
  } catch {
    return null
  }
}

function saveBuyerState(state: BuyerState): void {
  try {
    localStorage.setItem(BUYER_STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* private browsing — the session still works in memory */
  }
}

type BuyerStage = 'reserved' | 'exchanged' | 'notice_served' | 'completed'

function buyerStage(s: BuyerSnapshot, today: string): BuyerStage {
  if (s.completionDate && s.completionDate <= today) return 'completed'
  if (s.noticeServedDate) return 'notice_served'
  if (s.exchangeDate) return 'exchanged'
  return 'reserved'
}

export function BuyerApp({ initialCode }: { initialCode?: string }) {
  const [state, setState] = useState<BuyerState | null>(() => loadBuyerState())
  const [linkError, setLinkError] = useState(false)
  const [reporting, setReporting] = useState<IssueType | null>(null)
  const { show, node: toastNode } = useToast()

  // A fresh link replaces the snapshot (keeping the buyer's own report trail),
  // then drops the payload from the address bar.
  useEffect(() => {
    if (!initialCode) return
    let alive = true
    decodeShare(initialCode).then((decoded) => {
      if (!alive) return
      if (decoded && decoded.k === 'snapshot') {
        setState((prev) => {
          const next: BuyerState = {
            version: 1,
            snapshot: decoded,
            receivedAt: nowISO(),
            reports: prev?.reports || [],
          }
          saveBuyerState(next)
          return next
        })
        history.replaceState(null, '', `${location.pathname}#/buyer`)
      } else {
        setLinkError(true)
      }
    })
    return () => {
      alive = false
    }
  }, [initialCode])

  useEffect(() => {
    if (state) document.title = `My new home — ${state.snapshot.address}`
  }, [state])

  if (!state) {
    return (
      <div className="app buyer-app">
        <div className="content empty" style={{ paddingTop: 96 }}>
          <div className="big">
            <BrandMark size={52} className="brand-mark" />
          </div>
          {linkError ? (
            <p>
              This link didn't open properly.
              <br />
              Ask your developer to send you a fresh one.
            </p>
          ) : (
            <p>
              This is the buyer view of NHQB Plot Tracker.
              <br />
              Open the link your developer sent you to see your new home.
            </p>
          )}
        </div>
      </div>
    )
  }

  const snap = state.snapshot
  const today = todayISO()
  const stage = buyerStage(snap, today)

  const addReport = (report: SentReport) => {
    setState((prev) => {
      if (!prev) return prev
      const next = { ...prev, reports: [report, ...prev.reports] }
      saveBuyerState(next)
      return next
    })
  }

  return (
    <div className="app buyer-app">
      <header className="topbar">
        <div className="brand">
          <BrandMark size={38} className="brand-mark" />
          <div className="brand-text">
            <span className="brand-name">MY NEW HOME</span>
            <span className="brand-sub">{snap.address}</span>
          </div>
        </div>
      </header>

      <div className="content">
        <div className="dash-head" style={{ marginBottom: 6 }}>
          <h2 style={{ fontSize: 24 }}>{snap.address}</h2>
        </div>
        <p className="muted" style={{ margin: '0 0 4px', fontSize: 14 }}>
          {snap.customerNames} · built by {snap.developerName || 'your developer'}
        </p>

        <JourneyStrip snap={snap} stage={stage} />
        <WhatsNext snap={snap} stage={stage} today={today} />

        {/* Report a problem */}
        <div className="section">
          <h3>Something not right?</h3>
          <div className="log-buttons">
            <button className="log-btn snag" onClick={() => setReporting('snag')}>
              <span className="ico"><Icon name="wrench" size={26} /></span>
              Snag
              <small>small faults</small>
            </button>
            <button className="log-btn complaint" onClick={() => setReporting('complaint')}>
              <span className="ico"><Icon name="megaphone" size={26} /></span>
              Complaint
              <small>formal issue</small>
            </button>
            <button className="log-btn emergency" onClick={() => setReporting('emergency')}>
              <span className="ico"><Icon name="alert" size={26} /></span>
              Emergency
              <small>danger — call!</small>
            </button>
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
            Reports go to your developer by email, with a copy kept here as your own record.
            Snags should be put right within {SNAG_PUT_RIGHT_DAYS} days; complaints follow a
            formal timetable with deadlines (see “Your rights” below).
          </p>
        </div>

        {state.reports.length > 0 && (
          <MyReports reports={state.reports} snap={snap} onToast={show} />
        )}

        {snap.issues.length > 0 && <IssuesOnRecord issues={snap.issues} />}

        <DocumentsReceived snap={snap} />
        {snap.changes.length > 0 && <ChoicesAndChanges snap={snap} />}
        <YourRights />

        <p className="muted" style={{ fontSize: 12, marginTop: 24, lineHeight: 1.55 }}>
          Snapshot shared by {snap.developerName || 'your developer'} on {formatDate(snap.sharedOn)} —
          things may have moved on since; ask them for a fresh link any time. Add this page to
          your home screen to keep it like an app. Plain-English guidance, not legal advice.
        </p>
      </div>

      {reporting && (
        <ComposeReport
          type={reporting}
          snap={snap}
          onClose={() => setReporting(null)}
          onSent={(r) => {
            addReport(r)
            setReporting(null)
          }}
          onToast={show}
        />
      )}

      {toastNode}
    </div>
  )
}

// ---------------------------------------------------------------------------

function JourneyStrip({ snap, stage }: { snap: BuyerSnapshot; stage: BuyerStage }) {
  const steps: { key: BuyerStage; label: string; date?: string }[] = [
    { key: 'reserved', label: 'Reserved', date: snap.reservationDate },
    { key: 'exchanged', label: 'Exchanged', date: snap.exchangeDate },
    { key: 'notice_served', label: 'Notice', date: snap.noticeServedDate },
    { key: 'completed', label: 'Completed', date: snap.completionDate },
  ]
  const reached = steps.findIndex((s) => s.key === stage)
  return (
    <div className="journey-strip" style={{ marginTop: 12 }}>
      {steps.map((s, i) => {
        const done = i <= reached && !!s.date
        return (
          <div key={s.key} className={`j-step${done ? ' done' : ''}${i === reached + 1 ? ' next' : ''}`}>
            <span className="j-dot">{done ? <Icon name="check" size={12} strokeWidth={3} /> : null}</span>
            <span className="j-label">{s.label}</span>
            <span className="j-date">{s.date ? formatDate(s.date) : '—'}</span>
          </div>
        )
      })}
    </div>
  )
}

function WhatsNext({ snap, stage }: { snap: BuyerSnapshot; stage: BuyerStage; today?: string }) {
  const items: string[] = []
  if (stage === 'reserved' && snap.reservationDate) {
    const coolingEnd = addDays(snap.reservationDate, COOLING_OFF_DAYS)
    if (daysFromToday(coolingEnd) >= 0) {
      items.push(
        `You are in your cooling-off period until ${formatDate(coolingEnd)} — you can cancel for any reason and get your reservation fee back in full.`
      )
    }
    items.push('Your solicitor will guide you to exchange of contracts. Ask them anything you are unsure about.')
  }
  if (stage === 'exchanged') {
    items.push(
      snap.completionDate
        ? `Your home is being finished — completion is expected around ${formatDate(snap.completionDate)}. Your developer will keep you updated if that moves.`
        : 'Your home is being finished — your developer will confirm the completion timetable.'
    )
  }
  if (stage === 'notice_served') {
    items.push(
      'Notice to complete has been served. You have the right to a pre-completion inspection before completion day — you can attend yourself or appoint a professional inspector (using the NHQB checklist). Ask your developer to arrange it.'
    )
  }
  if (stage === 'completed' && snap.completionDate) {
    const windowEnd = addDays(snap.completionDate, 365 * AFTER_SALES_YEARS)
    items.push(
      `Your developer's after-sales service covers you until ${formatDate(windowEnd)} (${AFTER_SALES_YEARS} years from completion). Report anything that isn't right — the sooner the better.`
    )
  }
  const openMajor = snap.changes.find((c) => c.kind === 'major_change' && !c.outcome)
  if (openMajor && daysFromToday(addDays(openMajor.date, MAJOR_CHANGE_CANCEL_DAYS)) >= 0 && stage !== 'completed') {
    items.push(
      `A major change to your home was notified on ${formatDate(openMajor.date)}. If you find it unacceptable you can cancel within ${MAJOR_CHANGE_CANCEL_DAYS} days of receiving the written details and get all your money back — speak to your legal adviser.`
    )
  }
  if (items.length === 0) return null
  return (
    <div className="section">
      <h3>Where you are</h3>
      <div className="stack">
        {items.map((t, i) => (
          <div key={i} className="card" style={{ fontSize: 14.5, lineHeight: 1.55 }}>
            {t}
          </div>
        ))}
      </div>
    </div>
  )
}

function ComposeReport({
  type,
  snap,
  onClose,
  onSent,
  onToast,
}: {
  type: IssueType
  snap: BuyerSnapshot
  onClose: () => void
  onSent: (r: SentReport) => void
  onToast: (msg: string) => void
}) {
  const [description, setDescription] = useState('')

  const titles: Record<IssueType, string> = {
    snag: 'Report a snag',
    complaint: 'Make a formal complaint',
    emergency: 'Report an emergency',
  }
  const blurbs: Record<IssueType, string> = {
    snag: `Something damaged, unfinished or not fitted properly. Your developer should put snags right within ${SNAG_PUT_RIGHT_DAYS} days.`,
    complaint:
      'A formal complaint starts a fixed timetable: written acknowledgement within 5 days, a plan within 10, a full response within 30, and you can go to the New Homes Ombudsman after 56 days if it is not resolved.',
    emergency:
      'An immediate risk to safety, security or health (gas, serious leak, no heating in winter). PHONE your developer now — do not wait for an email. Use this report as the written record afterwards.',
  }

  const send = async (via: 'email' | 'copy') => {
    if (!description.trim()) return
    const sentOn = todayISO()
    const report: BuyerReport = {
      k: 'report',
      type,
      description: description.trim(),
      sentOn,
      address: snap.address,
      customerNames: snap.customerNames || undefined,
    }
    const code = await encodeShare(report)
    const human =
      `${titles[type]} — ${snap.address}\n` +
      `From: ${snap.customerNames || 'the buyer'}\nDate: ${formatDate(sentOn)}\n\n` +
      `${description.trim()}\n\n` +
      `--- For your tracker: paste everything below into "Paste a report from the buyer's app" ---\n${code}`
    if (via === 'email') {
      const subject = `[Buyer report] ${titles[type]} — ${snap.address}`
      location.href = `mailto:${encodeURIComponent(snap.developerEmail || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(human)}`
      onToast('Opening your email — press send there')
    } else {
      try {
        await navigator.clipboard.writeText(human)
        onToast('Report copied — paste it into WhatsApp or a text')
      } catch {
        onToast('Could not copy — use the email button instead')
      }
    }
    onSent({ id: id('rep_'), type, description: description.trim(), sentOn })
  }

  return (
    <Sheet title={titles[type]} subtitle={blurbs[type]} onClose={onClose}>
      <div className="field">
        <label>What's the problem? Where exactly is it?</label>
        <DictationField
          value={description}
          onChange={setDescription}
          placeholder={
            type === 'snag'
              ? 'e.g. Bathroom door doesn’t close properly — catches the frame at the top'
              : 'Describe what happened and what you would like done'
          }
          rows={4}
        />
      </div>
      <div className="stack" style={{ marginBottom: 10 }}>
        <button className="btn btn-primary btn-block" onClick={() => send('email')} disabled={!description.trim()}>
          <Icon name="mail" size={16} /> Send by email
        </button>
        <button className="btn btn-block" onClick={() => send('copy')} disabled={!description.trim()}>
          <Icon name="copy" size={16} /> Copy to send another way
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12.5 }}>
        A copy stays in this app with today's date — your own record of what you reported and
        when.
      </p>
      <button className="btn btn-ghost btn-block" onClick={onClose}>
        Cancel
      </button>
    </Sheet>
  )
}

function MyReports({
  reports,
  snap,
  onToast,
}: {
  reports: SentReport[]
  snap: BuyerSnapshot
  onToast: (msg: string) => void
}) {
  const resend = async (r: SentReport) => {
    const code = await encodeShare({
      k: 'report',
      type: r.type,
      description: r.description,
      sentOn: r.sentOn,
      address: snap.address,
      customerNames: snap.customerNames || undefined,
    })
    const subject = `[Buyer report — resend] ${r.type} — ${snap.address}`
    const body = `First sent ${formatDate(r.sentOn)}:\n\n${r.description}\n\n--- For your tracker ---\n${code}`
    location.href = `mailto:${encodeURIComponent(snap.developerEmail || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    onToast('Opening your email — press send there')
  }

  return (
    <div className="section">
      <h3>
        Your reports <span className="count-pill">{reports.length}</span>
      </h3>
      <div className="stack">
        {reports.map((r) => (
          <div key={r.id} className="card">
            <div className="issue-head">
              <span className={`badge ${r.type}`}>{r.type}</span>
              <span className="ref">sent {formatDate(r.sentOn)}</span>
            </div>
            <p className="issue-desc" style={{ marginBottom: 8 }}>{r.description}</p>
            <button className="btn btn-sm" onClick={() => resend(r)}>
              <Icon name="mail" size={15} /> Send again
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function IssuesOnRecord({ issues }: { issues: SnapshotIssue[] }) {
  return (
    <div className="section">
      <h3>
        On your developer's record <span className="count-pill">{issues.length}</span>
      </h3>
      <div className="stack">
        {issues.map((i, idx) => (
          <div key={idx} className="card">
            <div className="issue-head">
              <span className={`badge ${i.type}`}>{i.type}</span>
              {i.reference && <span className="ref">{i.reference}</span>}
              <span style={{ flex: 1 }} />
              <span className={`badge ${i.status === 'open' ? 'snag' : 'resolved'}`}>
                {i.status === 'open' ? 'in progress' : 'resolved'}
              </span>
            </div>
            <p className="issue-desc" style={{ marginBottom: 6 }}>{i.description}</p>
            {i.type === 'complaint' && i.status === 'open' && <ComplaintExpectations issue={i} />}
            {i.status !== 'open' && (
              <div className="muted" style={{ fontSize: 12.5 }}>
                Resolved {formatDate(i.resolvedAt)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/** What the buyer is entitled to receive on an open complaint, and by when. */
function ComplaintExpectations({ issue }: { issue: SnapshotIssue }) {
  const done = useMemo(() => new Set(issue.done || []), [issue.done])
  return (
    <div className="milestones">
      {FIXED_MILESTONES.map((m) => {
        const due = addDays(issue.startedAt, m.offsetDays)
        const isDone = done.has(m.key)
        return (
          <div key={m.key} className={`milestone rag-${isDone ? 'green' : daysFromToday(due) < 0 ? 'red' : 'green'}${isDone ? ' done' : ''}`}>
            <div className="m-info">
              <div className="m-label">{m.label}</div>
              <div className="m-due">{isDone ? 'Received' : `You should receive this by ${formatDate(due)}`}</div>
            </div>
            {isDone && (
              <span className="badge rag-green" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <Icon name="check" size={14} strokeWidth={2.4} />
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function DocumentsReceived({ snap }: { snap: BuyerSnapshot }) {
  const received = snap.docs.filter((d) => d.completedDate)
  const toCome = snap.docs.length - received.length
  return (
    <div className="section">
      <h3>
        Documents you've received <span className="count-pill">{received.length}/{snap.docs.length}</span>
      </h3>
      <div className="card">
        {received.length === 0 && (
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Nothing recorded yet — documents appear here as your developer hands them over.
          </p>
        )}
        {received.map((d, i) => (
          <div key={i} className="doc" style={{ padding: '10px 0' }}>
            <span className="check on" style={{ width: 22, height: 22 }}>
              <Icon name="check" size={14} strokeWidth={2.6} />
            </span>
            <div className="doc-body">
              <div className="doc-label" style={{ fontSize: 14.5 }}>{d.label}</div>
              <div className="doc-hint">{formatDate(d.completedDate)}</div>
            </div>
          </div>
        ))}
        {toCome > 0 && (
          <p className="muted" style={{ margin: '8px 0 0', fontSize: 12.5 }}>
            {toCome} more due by completion and handover.
          </p>
        )}
      </div>
    </div>
  )
}

function ChoicesAndChanges({ snap }: { snap: BuyerSnapshot }) {
  const kindLabel: Record<string, string> = {
    choice: 'Choice',
    extra: 'Extra',
    minor_change: 'Change',
    major_change: 'Major change',
    delay: 'Delay',
  }
  return (
    <div className="section">
      <h3>
        Choices &amp; changes <span className="count-pill">{snap.changes.length}</span>
      </h3>
      <div className="stack">
        {snap.changes.map((c, i) => (
          <div key={i} className="card">
            <div className="issue-head">
              <span className={`badge ${c.kind === 'major_change' || c.kind === 'delay' ? 'snag' : 'resolved'}`}>
                {kindLabel[c.kind] || c.kind}
              </span>
              <span className="ref">{formatDate(c.date)}</span>
              {c.kind === 'major_change' && c.outcome && (
                <span className="badge resolved" style={{ marginLeft: 'auto' }}>
                  {c.outcome === 'accepted' ? 'accepted' : 'cancelled'}
                </span>
              )}
            </div>
            <p className="issue-desc" style={{ marginBottom: 0 }}>{c.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function YourRights() {
  return (
    <div className="section">
      <h3>Your rights</h3>
      <div className="card" style={{ fontSize: 14, lineHeight: 1.6 }}>
        <p style={{ marginTop: 0 }}>
          Your developer is registered with the New Homes Quality Board and must follow the New
          Homes Quality Code. In plain English:
        </p>
        <p>
          <strong>Snags</strong> should be put right within {SNAG_PUT_RIGHT_DAYS} days — and if
          that slips, you must be kept updated at least monthly.
        </p>
        <p>
          <strong>Complaints</strong> follow a fixed timetable from the first business day after
          your complaint arrives: written acknowledgement within 5 days, a "path to resolution"
          within 10, a full assessment and response within 30, and an update letter at 56 days
          if it is still open.
        </p>
        <p>
          <strong>The Ombudsman</strong> — if a complaint is not resolved after 56 days you can
          take it, free of charge, to the New Homes Ombudsman Service:
          <br />
          <span className="muted" style={{ fontSize: 13 }}>{NHOS_CONTACT}</span>
        </p>
        <p style={{ marginBottom: 0 }}>
          These protections cover you for {AFTER_SALES_YEARS} years from completion. The full
          Code is free at nhqb.org.uk.
        </p>
      </div>
    </div>
  )
}
