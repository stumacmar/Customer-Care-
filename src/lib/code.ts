/*
 * The NHQB "Code" rules, in one place.
 *
 * This module encodes the things the Code cares about for this product:
 *   1. The stage-grouped document checklist every plot must be able to
 *      evidence, from reservation to handover (Code 2.2 / 2.6 / 2.7 / 2.11 /
 *      2.12 / 3.1)
 *   2. The pre-completion journey clocks — cooling-off, exchange deadline,
 *      major-change window, refunds, notice period, PCI (2.2–2.4, 2.8, 2.9,
 *      2.13)
 *   3. The clocks the three trigger types start (Code 3.3 / 3.4)
 *   4. The deadline arithmetic that turns a start date into due dates
 *
 * Keeping it isolated means the user never has to know a clause number or do
 * date maths — the app does it for them. Every constant carries the clause it
 * was taken from in the Code of Practice, Version 2 (March 2026).
 */

import { addDays, daysFromToday, diffDays, todayISO } from './dates'
import type {
  ChangeRecord,
  Clock,
  DocumentItem,
  Issue,
  JourneyClock,
  MilestoneKey,
  Plot,
  PlotStage,
  Rag,
} from '../types'

/** Snag put-right window — Code 3.3. */
export const SNAG_PUT_RIGHT_DAYS = 30

/** Cooling-off period after signing the Reservation Agreement — Code 2.3. */
export const COOLING_OFF_DAYS = 14

/**
 * Minimum gap between reservation and the exchange-by date in the Reservation
 * Agreement — Code 2.2m: "not less than six weeks after the reservation date
 * (28 days plus 14 days cooling-off period) unless the customer asks for an
 * earlier date".
 */
export const EXCHANGE_MIN_DAYS = 42

/** Refund of the reservation fee after a post-cooling-off cancellation — Code 2.4. */
export const RESERVATION_REFUND_DAYS = 14

/** Refund of the contract deposit after the contract is cancelled — Code 2.13. */
export const CONTRACT_REFUND_DAYS = 28

/** Customer's window to cancel after written notice of a major change — Code 2.9. */
export const MAJOR_CHANGE_CANCEL_DAYS = 14

/** Expected minimum completion notice period — Code 2.8 ("usually expected"). */
export const NOTICE_PERIOD_MIN_DAYS = 14

/** After-sales service length from completion — Code 3.1. */
export const AFTER_SALES_YEARS = 2

/** "Due soon" (amber) threshold in days. */
export const DUE_SOON_DAYS = 5

/**
 * The auto-generated document checklist, grouped by journey stage.
 * Reservation: 2.2–2.3 · Pre-contract & exchange: 2.6–2.7 · Completion &
 * handover: 2.8, 2.11, 2.12, 3.1.
 */
export const DOCUMENT_TEMPLATE: ReadonlyArray<Omit<DocumentItem, 'completed'>> = [
  // ---- At reservation (Code 2.2 / 2.3) ----
  {
    key: 'reservation_agreement',
    label: 'Reservation Agreement signed, copy given to customer',
    hint: 'Code 2.2: signed by both parties; includes the reservation fee, the 14-day cooling-off period, cancellation and refund terms, warranty provider details, and the exchange-by date (at least 6 weeks after reservation).',
    stage: 'reservation',
  },
  {
    key: 'affordability_schedule',
    label: 'Affordability Schedule provided',
    hint: 'Code 2.2: likely costs over the 5 years after sale — ground rent, management/event fees, service charges (incl. rises and sinking funds), maintenance of built-in equipment, and upkeep of the property.',
    stage: 'reservation',
  },
  // ---- Pre-contract & exchange (Code 2.6 / 2.7) ----
  {
    key: 'pre_contract_pack',
    label: 'Pre-contract information sent to customer’s legal adviser',
    hint: 'Code 2.6: warranty cover summary + provider contact, tenure, planning consent reference, list of included contents, confirmation the spec is as advertised (incl. structural frame), build standards, any exceptional restrictions, services that transfer later, management services, and the indicative costs schedule.',
    stage: 'pre_contract',
  },
  {
    key: 'expected_completion_info',
    label: 'Expected completion date + plan/brochure given',
    hint: 'Code 2.6: if the home is not yet complete — the expected completion date and a plan showing size, spec, layout, plot position and facing direction, steep slopes, boundary finishes, outbuildings.',
    stage: 'pre_contract',
  },
  {
    key: 'contact_named',
    label: 'Named contacts for questions given in writing',
    hint: 'Code 2.6: who to contact (names and numbers) with questions before ownership transfers, and how questions will be answered.',
    stage: 'pre_contract',
  },
  {
    key: 'contract_checked',
    label: 'Contract of sale terms confirmed Code-compliant',
    hint: 'Code 2.7: defines the completion notice period, when the customer can cancel, what happens on delay, how deposits are protected, and the two-year builders’ liability period. Spoken statements the customer relies on recorded in writing before exchange.',
    stage: 'pre_contract',
  },
  // ---- Completion & handover (Code 2.8 / 2.11 / 2.12 / 3.1) ----
  {
    key: 'pre_completion_inspection',
    label: 'Pre-completion inspection offered / carried out',
    hint: 'Code 2.8 / 2.11d: offered after notice to complete and before the completion date, using the NHQB Pre-Completion Inspection Checklist.',
    stage: 'completion',
  },
  {
    key: 'schedule_incomplete_work',
    label: 'Schedule of Incomplete Work (Home) issued',
    hint: 'Code 2.11b: after your final quality-assurance inspection — anything not finished at legal completion, with a statement of timescales for putting it right and the access you will need.',
    stage: 'completion',
  },
  {
    key: 'schedule_incomplete_dev',
    label: 'Schedule of Incomplete Work (Development) issued',
    hint: 'Code 2.12: best available information on future phases and estimated timescales, where known.',
    stage: 'completion',
  },
  {
    key: 'home_demonstration',
    label: 'Home demonstration completed',
    hint: 'Code 2.11e: showed the customer how the home, its systems and appliances work (can be combined with the pre-completion inspection).',
    stage: 'completion',
  },
  {
    key: 'warranty_docs',
    label: 'Warranty documentation provided',
    hint: 'Code 2.11f–g: full details of guarantees/warranties, plus the cover note or policy with exceptions, exclusions, limits and excesses.',
    stage: 'completion',
  },
  {
    key: 'complaints_procedure',
    label: 'Complaints procedure copy given to customer',
    hint: 'Code 2.11h: written copy of how to complain and the timescales.',
    stage: 'completion',
  },
  {
    key: 'health_safety_file',
    label: 'Health & safety file provided',
    hint: 'Code 2.11i: for apartments, given to the managing agent or management company.',
    stage: 'completion',
  },
  {
    key: 'building_reg_certificate',
    label: 'Building regulation completion certificate',
    hint: 'Code 2.11k: or confirmation the local authority has inspected (Scotland) — or a note explaining when it will be available.',
    stage: 'completion',
  },
  {
    key: 'after_sales_statement',
    label: 'After-sales service written statement given',
    hint: 'Code 3.1: procedures, timescales, contacts, the emergency process, and what counts as normal maintenance.',
    stage: 'completion',
  },
]

export function buildDocumentChecklist(): DocumentItem[] {
  return DOCUMENT_TEMPLATE.map((d) => ({ ...d, completed: false }))
}

export const STAGE_LABELS: Record<PlotStage, string> = {
  setup: 'Not reserved yet',
  reserved: 'Reserved',
  exchanged: 'Exchanged',
  notice_served: 'Notice served',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

/** Derive the plot's journey stage from its dates. */
export function plotStage(plot: Plot, today = todayISO()): PlotStage {
  if (plot.cancellation) return 'cancelled'
  if (plot.completionDate && plot.completionDate <= today) return 'completed'
  if (plot.noticeServedDate) return 'notice_served'
  if (plot.exchangeDate) return 'exchanged'
  if (plot.reservationDate) return 'reserved'
  return 'setup'
}

// ---------------------------------------------------------------------------
// Journey clocks — the Code's reservation-to-completion obligations
// ---------------------------------------------------------------------------

function ragForDeadline(daysRemaining: number): Rag {
  if (daysRemaining < 0) return 'red'
  if (daysRemaining <= DUE_SOON_DAYS) return 'amber'
  return 'green'
}

/** The cancel-by date for a major change's 14-day window — Code 2.9. */
export function majorChangeCancelBy(change: ChangeRecord): string {
  return addDays(change.date, MAJOR_CHANGE_CANCEL_DAYS)
}

/**
 * All live pre-completion clocks for a plot, derived from its journey dates
 * and changes log. Most urgent first.
 */
export function journeyClocksForPlot(plot: Plot, today = todayISO()): JourneyClock[] {
  const out: JourneyClock[] = []
  const stage = plotStage(plot, today)

  // Refund clock after a cancellation — 2.4 (reservation fee, 14 days) or
  // 2.13 (contract deposit, 28 days). The one clock that survives cancellation.
  if (plot.cancellation && !plot.cancellation.refundedDate) {
    const isContract = plot.cancellation.kind === 'contract'
    const days = isContract ? CONTRACT_REFUND_DAYS : RESERVATION_REFUND_DAYS
    const dueDate = addDays(plot.cancellation.date, days)
    const daysRemaining = daysFromToday(dueDate)
    out.push({
      kind: 'refund',
      clause: isContract ? '2.13' : '2.4',
      label: isContract ? 'Refund contract deposit' : 'Refund reservation fee',
      detail: isContract
        ? `Within ${CONTRACT_REFUND_DAYS} days of the contract being cancelled.`
        : `Within ${RESERVATION_REFUND_DAYS} days of the customer's notice, less any deductions set out in the Reservation Agreement.`,
      dueDate,
      daysRemaining,
      rag: ragForDeadline(daysRemaining),
    })
  }
  if (stage === 'cancelled' || stage === 'setup') return out

  // Cooling-off — 2.3. Awareness, not a developer deadline: the customer can
  // cancel for a full refund until this date.
  if (plot.reservationDate && stage === 'reserved') {
    const end = addDays(plot.reservationDate, COOLING_OFF_DAYS)
    const daysRemaining = daysFromToday(end)
    if (daysRemaining >= 0) {
      out.push({
        kind: 'cooling_off',
        clause: '2.3',
        label: 'Cooling-off period',
        detail: 'The customer can cancel for any reason and must receive a full refund of the reservation fee. Exchange within this period only with their express consent.',
        dueDate: end,
        daysRemaining,
        rag: 'green',
        info: true,
      })
    }
  }

  // Exchange-by date — 2.2m.
  if (stage === 'reserved' && plot.exchangeDeadline) {
    const daysRemaining = daysFromToday(plot.exchangeDeadline)
    out.push({
      kind: 'exchange',
      clause: '2.2',
      label: 'Exchange of contracts due',
      detail: 'The exchange-by date agreed in the Reservation Agreement. If it passes, agree a new date with the customer in writing.',
      dueDate: plot.exchangeDeadline,
      daysRemaining,
      rag: ragForDeadline(daysRemaining),
    })
  }

  // Major-change windows — 2.9. A hold on serving notice, and the customer's
  // right to cancel; amber while open so it is never missed.
  for (const change of plot.changes) {
    if (change.kind !== 'major_change' || change.outcome) continue
    const cancelBy = majorChangeCancelBy(change)
    const daysRemaining = daysFromToday(cancelBy)
    out.push({
      kind: 'major_change',
      clause: '2.9',
      label: daysRemaining >= 0 ? 'Major change — customer may cancel' : 'Major change — record the outcome',
      detail:
        daysRemaining >= 0
          ? 'Customer may cancel for a full refund until this date. Notice to complete cannot be served during this window. Recommend they take legal advice.'
          : 'The 14-day window has passed — record whether the customer accepted the change or cancelled.',
      dueDate: cancelBy,
      daysRemaining,
      rag: 'amber',
      info: daysRemaining >= 0,
      changeId: change.id,
    })
  }

  if (stage === 'completed') return out

  // Notice period check + PCI reminder — 2.8.
  if (plot.noticeServedDate && plot.completionDate) {
    const period = diffDays(plot.noticeServedDate, plot.completionDate)
    if (period < NOTICE_PERIOD_MIN_DAYS) {
      out.push({
        kind: 'notice_period',
        clause: '2.8',
        label: `Completion notice period is ${period} day${period === 1 ? '' : 's'}`,
        detail: `The Code expects at least ${NOTICE_PERIOD_MIN_DAYS} calendar days between notice and completion (unless agreed otherwise), so there is time for the pre-completion inspection.`,
        rag: 'amber',
      })
    }
  }
  if (stage === 'notice_served' && plot.completionDate) {
    const pciDone = plot.documents.some((d) => d.key === 'pre_completion_inspection' && d.completed)
    if (!pciDone) {
      const daysRemaining = daysFromToday(plot.completionDate)
      out.push({
        kind: 'pci',
        clause: '2.8',
        label: 'Offer the pre-completion inspection',
        detail: 'The customer (or their suitably qualified inspector, using the NHQB checklist) must get the chance to inspect after notice is served and before completion. Issues that breach warranty standards: fix ideally before completion, or within 30 days.',
        dueDate: plot.completionDate,
        daysRemaining,
        rag: ragForDeadline(daysRemaining),
      })
    }
  }

  const rank: Record<Rag, number> = { red: 0, amber: 1, green: 2 }
  return out.sort((a, b) => {
    if (!!a.info !== !!b.info) return a.info ? 1 : -1
    if (rank[a.rag] !== rank[b.rag]) return rank[a.rag] - rank[b.rag]
    return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999)
  })
}

// ---------------------------------------------------------------------------
// Complaint milestone schedule (Code 3.4)
// ---------------------------------------------------------------------------

export interface MilestoneDef {
  key: MilestoneKey
  offsetDays: number
  label: string
  /** Whether this milestone has a Code-mandated letter the app can draft. */
  hasLetter: boolean
}

/** The four fixed complaint milestones. */
export const FIXED_MILESTONES: MilestoneDef[] = [
  { key: 'acknowledgement', offsetDays: 5, label: 'Written acknowledgement', hasLetter: true },
  { key: 'path_to_resolution', offsetDays: 10, label: 'Path to Resolution letter', hasLetter: true },
  {
    key: 'assessment_response',
    offsetDays: 30,
    label: 'Complaint Assessment & Response letter',
    hasLetter: true,
  },
  { key: 'eight_week', offsetDays: 56, label: 'Eight-Week letter', hasLetter: true },
]

/** Interval for rolling updates after the eight-week letter, until closed. */
export const UPDATE_INTERVAL_DAYS = 28

export interface ComputedMilestone {
  key: MilestoneKey
  label: string
  dueDate: string
  offsetDays: number
  hasLetter: boolean
  completed: boolean
  completedDate?: string
  letterId?: string
  daysRemaining: number
  rag: Rag
  /** True for the rolling 28-day updates generated after week 8. */
  rolling: boolean
}

/**
 * Expand a complaint into its full milestone list for a given "today".
 *
 * The four fixed milestones always appear. If the complaint is still open past
 * day 56, rolling 28-day update milestones are generated up to (and one beyond)
 * today so the next one is always visible.
 */
export function computeComplaintMilestones(issue: Issue, today = todayISO()): ComputedMilestone[] {
  const progress = issue.milestoneProgress || {}
  const out: ComputedMilestone[] = []

  const build = (
    key: MilestoneKey,
    offsetDays: number,
    label: string,
    hasLetter: boolean,
    rolling: boolean
  ): ComputedMilestone => {
    const dueDate = addDays(issue.startedAt, offsetDays)
    const p = progress[key]
    const completed = !!p
    const daysRemaining = daysFromToday(dueDate)
    return {
      key,
      label,
      dueDate,
      offsetDays,
      hasLetter,
      completed,
      completedDate: p?.completedDate,
      letterId: p?.letterId,
      daysRemaining,
      rag: milestoneRag(completed, daysRemaining, issue),
      rolling,
    }
  }

  for (const m of FIXED_MILESTONES) {
    out.push(build(m.key, m.offsetDays, m.label, m.hasLetter, false))
  }

  // Rolling 28-day updates only matter while the complaint is unresolved.
  if (issue.status === 'open') {
    const daysOpen = diffDays(issue.startedAt, today)
    let n = 1
    let offset = 56 + UPDATE_INTERVAL_DAYS
    // Generate updates that are already due, plus the next upcoming one.
    while (offset <= daysOpen + UPDATE_INTERVAL_DAYS) {
      out.push(build(`update_28_${n}`, offset, `28-day update #${n}`, false, true))
      n += 1
      offset += UPDATE_INTERVAL_DAYS
    }
  } else {
    // Preserve any rolling updates that were actioned before closing.
    Object.keys(progress)
      .filter((k) => k.startsWith('update_28_'))
      .forEach((k) => {
        const n = Number(k.split('_').pop())
        const offset = 56 + n * UPDATE_INTERVAL_DAYS
        out.push(build(k, offset, `28-day update #${n}`, false, true))
      })
  }

  return out
}

function milestoneRag(completed: boolean, daysRemaining: number, issue: Issue): Rag {
  if (completed || issue.status !== 'open') return 'green'
  if (daysRemaining < 0) return 'red'
  if (daysRemaining <= DUE_SOON_DAYS) return 'amber'
  return 'green'
}

// ---------------------------------------------------------------------------
// Clocks (what the dashboard and plot screen read from)
// ---------------------------------------------------------------------------

function ragFromDays(daysRemaining: number): Rag {
  if (daysRemaining < 0) return 'red'
  if (daysRemaining <= DUE_SOON_DAYS) return 'amber'
  return 'green'
}

/**
 * The live clock for a single open issue: for a snag it's the 30-day put-right
 * deadline; for a complaint it's the next outstanding milestone; an emergency
 * is a fixed urgent flag with no Code deadline.
 */
export function clockForIssue(issue: Issue, today = todayISO()): Clock | null {
  if (issue.status !== 'open') return null

  if (issue.type === 'emergency') {
    return {
      issueId: issue.id,
      type: 'emergency',
      label: 'Emergency — urgent action required',
      rag: 'red',
      urgent: true,
    }
  }

  if (issue.type === 'snag') {
    const dueDate = addDays(issue.startedAt, SNAG_PUT_RIGHT_DAYS)
    const daysRemaining = daysFromToday(dueDate)
    return {
      issueId: issue.id,
      type: 'snag',
      label: 'Snag — put right',
      dueDate,
      daysRemaining,
      rag: ragFromDays(daysRemaining),
    }
  }

  // Complaint: surface the earliest outstanding (not-completed) milestone.
  const milestones = computeComplaintMilestones(issue, today)
  const next = milestones
    .filter((m) => !m.completed)
    .sort((a, b) => a.offsetDays - b.offsetDays)[0]
  if (!next) return null
  return {
    issueId: issue.id,
    type: 'complaint',
    label: `Complaint — ${next.label}`,
    dueDate: next.dueDate,
    daysRemaining: next.daysRemaining,
    rag: ragFromDays(next.daysRemaining),
  }
}

/** All live clocks for a plot, most urgent first. */
export function clocksForPlot(issues: Issue[], today = todayISO()): Clock[] {
  const clocks = issues
    .map((i) => clockForIssue(i, today))
    .filter((c): c is Clock => c !== null)
  const rank: Record<Rag, number> = { red: 0, amber: 1, green: 2 }
  return clocks.sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1
    if (rank[a.rag] !== rank[b.rag]) return rank[a.rag] - rank[b.rag]
    return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999)
  })
}
