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
import type { ReactNode } from 'react'
import { BrandLogo, BrandMark } from '../components/Brand'
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
import { CODE_SOURCE_URL, PCI_CHECKLIST_APARTMENT_URL, PCI_CHECKLIST_HOUSE_URL } from '../lib/codeContent'
import { addDays, addYears, daysFromToday, formatDate, nowISO, todayISO } from '../lib/dates'
import { id } from '../lib/storage'
import {
  decodeShare,
  encodeShare,
  isValidPayload,
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
    if (!parsed || parsed.version !== 1 || !isValidPayload(parsed.snapshot)) return null
    if (!Array.isArray(parsed.reports)) parsed.reports = []
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
  const [reporting, setReporting] = useState(false)
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
              This is the customer view of NHQB Plot Tracker.
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
          <BrandLogo height={44} />
          <span className="brand-divider" />
          <span className="brand-product">My new home</span>
        </div>
      </header>

      <div className="content">
        <div className="dash-head" style={{ marginBottom: 6 }}>
          <h2 style={{ fontSize: 24 }}>{snap.address}</h2>
        </div>
        <p className="muted" style={{ margin: '0 0 4px', fontSize: 14 }}>
          {snap.customerNames} · built by {snap.developerName || 'your developer'}
        </p>

        {snap.secondOwner ? (
          <SecondOwnerCover snap={snap} />
        ) : (
          <>
            <JourneyStrip snap={snap} stage={stage} />
            <WhatsNext snap={snap} stage={stage} today={today} />
          </>
        )}

        {/* Report a problem — one guided route so every issue reaches the
            correct Code process. */}
        <div className="section">
          <h3>What if something is wrong?</h3>
          <button className="btn btn-primary btn-block" onClick={() => setReporting(true)}>
            <Icon name="megaphone" size={17} /> Report a problem
          </button>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
            Your report goes to your developer by email, and a copy is kept here as your own
            record. The Code's response timescales apply from when your developer receives it.
            Outside an emergency, your developer will respond during normal working hours. Keep
            all paperwork and emails about your home.
          </p>
        </div>

        {state.reports.length > 0 && (
          <MyReports reports={state.reports} snap={snap} onToast={show} />
        )}

        {snap.issues.length > 0 && <IssuesOnRecord issues={snap.issues} />}

        {!snap.secondOwner && <DocumentsReceived snap={snap} />}
        {!snap.secondOwner && snap.changes.length > 0 && <ChoicesAndChanges snap={snap} />}
        <YourRights />

        <p className="muted" style={{ fontSize: 12, marginTop: 24, lineHeight: 1.55 }}>
          Snapshot shared by {snap.developerName || 'your developer'} on {formatDate(snap.sharedOn)} —
          things may have moved on since; ask them for a fresh link any time. Add this page to
          your home screen to keep it like an app. A guide to your home under the New Homes
          Quality Code — not legal advice.
        </p>
      </div>

      {reporting && (
        <GuidedReport
          stage={stage}
          snap={snap}
          onClose={() => setReporting(false)}
          onSent={(r) => {
            addReport(r)
            setReporting(false)
          }}
          onToast={show}
        />
      )}

      {toastNode}
    </div>
  )
}

// ---------------------------------------------------------------------------

/**
 * What a second owner sees instead of the purchase journey. The Code's
 * after-sales cover follows the home for two years from the original
 * completion, but the sale history belonged to the first owner.
 */
function SecondOwnerCover({ snap }: { snap: BuyerSnapshot }) {
  const windowEnd = snap.completionDate ? addYears(snap.completionDate, AFTER_SALES_YEARS) : undefined
  return (
    <div className="section">
      <h3>Am I covered as the new owner?</h3>
      <div className="card" style={{ fontSize: 14.5, lineHeight: 1.55 }}>
        Yes. The New Homes Quality Code's after-sales cover follows the home, not the first
        owner.
        {windowEnd
          ? ` Until ${formatDate(windowEnd)} (two years from the home's legal completion on ${formatDate(snap.completionDate!)}), as the current homeowner you`
          : ' For two years from the home\u2019s legal completion, as the current homeowner you'}{' '}
        can report snags, defects and emergencies to the developer, make a formal complaint
        under the Code's complaints process, and refer an unresolved complaint to the New Homes
        Ombudsman Service.
      </div>
    </div>
  )
}

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
  const items: ReactNode[] = []
  if (stage === 'reserved' && snap.reservationDate) {
    const coolingEnd = addDays(snap.reservationDate, COOLING_OFF_DAYS)
    if (daysFromToday(coolingEnd) >= 0) {
      items.push(
        `You are in your ${COOLING_OFF_DAYS}-day cooling-off period until ${formatDate(coolingEnd)} — you may cancel for any reason and receive your reservation fee back in full.`
      )
    }
    items.push('Your solicitor or conveyancer will guide you to exchange of contracts. Ask them anything you are unsure about.')
  }
  if (stage === 'exchanged') {
    items.push(
      snap.expectedCompletionDate
        ? `Your home is being finished — legal completion is expected around ${formatDate(snap.expectedCompletionDate)}. Your developer will keep you updated in writing if that changes.`
        : 'Your home is being finished — your developer will confirm the completion timetable in writing.'
    )
  }
  if (stage === 'notice_served') {
    items.push(
      <>
        Notice to complete has been served. You have the right to a pre-completion inspection
        before completion day — you can attend yourself or appoint a suitably qualified
        professional. Use the NHQB checklist:{' '}
        <a href={PCI_CHECKLIST_HOUSE_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--link)' }}>house</a>
        {' · '}
        <a href={PCI_CHECKLIST_APARTMENT_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--link)' }}>apartment</a>
        . Ask your developer to arrange it.
      </>
    )
  }
  if (stage === 'completed' && snap.completionDate) {
    const windowEnd = addYears(snap.completionDate, AFTER_SALES_YEARS)
    items.push(
      `Your developer's after-sales service covers you until ${formatDate(windowEnd)} (${AFTER_SALES_YEARS} years from legal completion). Your developer is your first point of contact for anything that is not right — report it as soon as you notice it.`
    )
  }
  const openMajor = snap.changes.find((c) => c.kind === 'major_change' && !c.outcome && c.cancelBy)
  if (openMajor && openMajor.cancelBy && daysFromToday(openMajor.cancelBy) >= 0 && stage !== 'completed') {
    items.push(
      `Your developer has given you written details of a major change to your home. If you find it unacceptable you can cancel within ${MAJOR_CHANGE_CANCEL_DAYS} days of receiving those details — until ${formatDate(openMajor.cancelBy)} — and receive all your money back. Speak to your solicitor or conveyancer.`
    )
  }
  if (items.length === 0) return null
  return (
    <div className="section">
      <h3>Where am I in the process?</h3>
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

/**
 * The guided report flow. Buyers should not need to know the Code's
 * vocabulary to end up in the right process, so step one asks what the
 * issue is about and the app routes it: an emergency (only after
 * completion — Code 3.2: emergency issues are not snags and belong to the
 * after-sales service), a snag (a fault found after completion), or a
 * formal complaint (everything else, including all pre-completion issues —
 * money, specification, timescales, appointments).
 */
interface ReportCategory {
  key: string
  label: string
  hint: string
}

const REPORT_CATEGORIES: ReportCategory[] = [
  { key: 'home', label: 'A problem with the home', hint: 'A snag or defect: damaged, unfinished, faulty, or not as it should be' },
  { key: 'money', label: 'Money or a refund', hint: 'Reservation fee, deposit, payments for extras, or a refund owed' },
  { key: 'spec', label: 'Choices, extras or specification', hint: 'Something differs from what was agreed or ordered' },
  { key: 'timing', label: 'Timescales or delay', hint: 'Exchange, completion or repair dates moving or unclear' },
  { key: 'appointment', label: 'A missed appointment', hint: 'A visit or inspection that did not happen as arranged' },
  { key: 'other', label: 'Something else', hint: 'Anything not covered above' },
]

function GuidedReport({
  stage,
  snap,
  onClose,
  onSent,
  onToast,
}: {
  stage: BuyerStage
  snap: BuyerSnapshot
  onClose: () => void
  onSent: (r: SentReport) => void
  onToast: (msg: string) => void
}) {
  const [category, setCategory] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const completed = stage === 'completed'

  // Route the category to the correct Code process.
  const type: IssueType =
    category === 'emergency' ? 'emergency' : category === 'home' && completed ? 'snag' : 'complaint'

  const titles: Record<IssueType, string> = {
    snag: 'Report a snag or defect',
    complaint: 'Make a formal complaint',
    emergency: 'Report an emergency',
  }
  const blurbs: Record<IssueType, string> = {
    snag: `A snag is a minor or cosmetic issue, such as a scratch or a paint mark. A defect affects how part of the home works, such as plumbing, electrics or heating. Under the Code your developer should put snags and defects right within ${SNAG_PUT_RIGHT_DAYS} days, or explain the reason for any delay and keep you updated at least monthly.`,
    complaint:
      "This will be handled under the Code's complaints process. Its timescales run from the complaint start date — the first business day after your developer receives your report: a written acknowledgement within 5 days, a Path to Resolution letter (setting out how your complaint will be investigated and resolved) within 10 days, and a full Complaint Assessment and Response within 30 days.",
    emergency:
      'An emergency is an immediate threat to safety, security, health or well-being — for example external door locks that will not secure the home, an uncontainable water leak, complete failure of the heating and hot water, or total loss of power. Telephone your developer now, using their out-of-hours number if it is outside office hours; do not wait for an email. Then send this report so there is a written record.',
  }

  const catLabel = REPORT_CATEGORIES.find((c) => c.key === category)?.label

  const send = async (via: 'email' | 'copy') => {
    if (!description.trim()) return
    const sentOn = todayISO()
    const body =
      category && category !== 'emergency' && category !== 'home'
        ? `[About: ${catLabel}] ${description.trim()}`
        : description.trim()
    const report: BuyerReport = {
      k: 'report',
      type,
      description: body,
      sentOn,
      address: snap.address,
      customerNames: snap.customerNames || undefined,
    }
    const code = await encodeShare(report)
    const human =
      `${titles[type]} — ${snap.address}\n` +
      `From: ${snap.customerNames || 'the customer'}\nDate: ${formatDate(sentOn)}\n\n` +
      `${body}\n\n` +
      `--- For your tracker: paste everything below into "Paste a report from the customer's app" ---\n${code}`
    if (via === 'email') {
      const subject = `[Customer report] ${titles[type]} — ${snap.address}`
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
    onSent({ id: id('rep_'), type, description: body, sentOn })
  }

  // Step 1 — what is this about?
  if (!category) {
    return (
      <Sheet
        title="Report a problem"
        subtitle="Choose what your report is about — it will be routed to the correct Code process."
        onClose={onClose}
      >
        <div className="stack" style={{ marginBottom: 12 }}>
          {completed && (
            <button
              className="card"
              style={{ textAlign: 'left', width: '100%', borderLeft: '4px solid var(--red)' }}
              onClick={() => setCategory('emergency')}
            >
              <div style={{ fontWeight: 700, color: 'var(--red)' }}>Emergency — immediate danger</div>
              <div className="muted" style={{ fontSize: 13 }}>
                An immediate threat to safety, security, health or well-being — for example a
                door that will not lock, an uncontainable leak, no heating and hot water, or no
                power. Telephone your developer first.
              </div>
            </button>
          )}
          {REPORT_CATEGORIES.map((c) => (
            <button
              key={c.key}
              className="card"
              style={{ textAlign: 'left', width: '100%' }}
              onClick={() => setCategory(c.key)}
            >
              <div style={{ fontWeight: 700 }}>{c.label}</div>
              <div className="muted" style={{ fontSize: 13 }}>{c.hint}</div>
            </button>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 12.5 }}>
          {completed
            ? 'Anything that is not an emergency will be dealt with during normal working hours.'
            : 'Before completion, anything urgent on site should also be raised with your developer by phone during working hours — the home is their responsibility until completion day.'}
        </p>
      </Sheet>
    )
  }

  // Step 2 — describe it.
  return (
    <Sheet title={catLabel && category !== 'home' ? catLabel : titles[type]} subtitle={blurbs[type]} onClose={onClose}>
      <div className="field">
        <label>What has happened? Where exactly?</label>
        <DictationField
          value={description}
          onChange={setDescription}
          placeholder={
            type === 'snag'
              ? 'e.g. Bathroom door doesn\u2019t close properly — catches the frame at the top'
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
      <button className="btn btn-ghost btn-block" onClick={() => setCategory(null)}>
        ‹ Back
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
    const subject = `[Customer report — resend] ${r.type} — ${snap.address}`
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
        Documents you have received <span className="count-pill">{received.length}/{snap.docs.length}</span>
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
    visit: 'Site visit',
    build_update: 'Build update',
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
      <h3>How am I protected?</h3>
      <div className="card" style={{ fontSize: 14, lineHeight: 1.6 }}>
        <p style={{ marginTop: 0 }}>
          Your developer is registered with the New Homes Quality Board and must follow the New
          Homes Quality Code (the Code). Key protections under the Code:
        </p>
        <p>
          <strong>Snags or defects</strong> found after legal completion should be put right
          within {SNAG_PUT_RIGHT_DAYS} days. If that is not possible, your developer must
          explain the reason for the delay and keep you updated at least monthly.
        </p>
        <p>
          <strong>Complaints</strong> follow a fixed timetable counted from the complaint start
          date (the first business day after your complaint is received): a written
          acknowledgement within 5 days; a Path to Resolution letter — setting out how your
          complaint will be investigated and resolved — within 10 days; a full Complaint
          Assessment and Response within 30 days; and an Eight-Week Letter at 56 days if it is
          still open.
        </p>
        <p>
          <strong>The New Homes Ombudsman Service</strong> — if a complaint is not resolved
          after 56 days you may refer it, free of charge, to the Ombudsman. Complaints to NHOS are
          made through their own online portal, separate from this app:
          <br />
          <span className="muted" style={{ fontSize: 13 }}>{NHOS_CONTACT}</span>
        </p>
        <p style={{ marginBottom: 0 }}>
          These Code protections cover the home for {AFTER_SALES_YEARS} years from legal
          completion.{' '}
          <a href={CODE_SOURCE_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--link)' }}>
            Read the full Code
          </a>
          .
        </p>
      </div>
    </div>
  )
}
