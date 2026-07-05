/*
 * The NHQB "Code" rules, in one place.
 *
 * This module encodes exactly three things the Code cares about for this
 * product:
 *   1. The document checklist every plot must be able to evidence (Code 2.11 / 3.1)
 *   2. The clocks the three trigger types start (Code 3.3 / 3.4)
 *   3. The deadline arithmetic that turns a start date into due dates
 *
 * Keeping it isolated means the user never has to know a clause number or do
 * date maths — the app does it for them.
 */

import { addDays, daysFromToday, diffDays, todayISO } from './dates'
import type { Clock, DocumentItem, Issue, MilestoneKey, Rag } from '../types'

/** Snag put-right window — Code 3.3. */
export const SNAG_PUT_RIGHT_DAYS = 30

/** "Due soon" (amber) threshold in days. */
export const DUE_SOON_DAYS = 5

/** The auto-generated document checklist (Code 2.11 / 3.1). */
export const DOCUMENT_TEMPLATE: ReadonlyArray<Omit<DocumentItem, 'completed'>> = [
  {
    key: 'schedule_incomplete_work',
    label: 'Schedule of Incomplete Work (Home) issued',
    hint: 'List of anything not finished at legal completion, given to the customer.',
  },
  {
    key: 'pre_completion_inspection',
    label: 'Pre-completion inspection offered / carried out',
    hint: 'Customer was offered the chance to inspect before completion.',
  },
  {
    key: 'home_demonstration',
    label: 'Home demonstration completed',
    hint: 'Showed the customer how the home and its systems work.',
  },
  {
    key: 'warranty_docs',
    label: 'Warranty documentation provided',
    hint: 'Cover note, policy and exclusions handed over.',
  },
  {
    key: 'complaints_procedure',
    label: 'Complaints procedure copy given to customer',
    hint: 'Written copy of how to complain and the timescales.',
  },
  {
    key: 'health_safety_file',
    label: 'Health & safety file provided',
  },
  {
    key: 'building_reg_certificate',
    label: 'Building regulation completion certificate',
    hint: 'Or confirmation the local authority has inspected (Scotland) — or a note explaining why it is not yet available.',
  },
  {
    key: 'after_sales_statement',
    label: 'After-sales service written statement given',
    hint: 'Code 3.1: procedures, timescales, contacts, emergency process, and what counts as normal maintenance.',
  },
]

export function buildDocumentChecklist(): DocumentItem[] {
  return DOCUMENT_TEMPLATE.map((d) => ({ ...d, completed: false }))
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
