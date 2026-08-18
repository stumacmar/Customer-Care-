/*
 * Traffic-light computation for the dashboard.
 *
 *   🟢 Green  — no open clocks AND every document complete
 *   🟠 Amber  — something due within 5 days (and nothing overdue)
 *   🔴 Red    — something overdue, or an open emergency
 *
 * The whole point of the dashboard is that the builder scans colour, not text.
 */

import {
  clocksForPlot,
  computeComplaintMilestones,
  journeyClocksForPlot,
  majorChangeCancelBy,
  nextSnagUpdate,
  plotStage,
  SNAG_PUT_RIGHT_DAYS,
  STAGE_LABELS,
} from './code'
import { addDays, daysFromToday, describeCountdown, formatDate } from './dates'
import type { Development, Plot, PlotStage, Rag } from '../types'

/** The Ombudsman window: two years from completion (Code 3.1 / 3.2). */
export const RETENTION_DAYS = 365 * 2

/**
 * A plot auto-retires once its completion date is more than two years ago —
 * the point the customer's New Homes Ombudsman window has closed. Retired plots
 * drop out of the active list (but are never auto-deleted; the record is kept
 * until the developer chooses to export and remove it). A cancelled plot
 * retires once its refund has been paid — nothing is left to track.
 */
export function isPlotRetired(plot: Plot, today?: string): boolean {
  void today
  if (plot.cancellation) return !!plot.cancellation.refundedDate
  if (!plot.completionDate) return false
  return daysFromToday(plot.completionDate) < -RETENTION_DAYS
}

/** Roll a development's plots up into one status for the developments list. */
export interface DevelopmentStatus {
  rag: Rag
  activePlots: number
  retiredPlots: number
  needAction: number
  dueSoon: number
  headline: string
}

export function developmentStatus(dev: Development, plots: Plot[]): DevelopmentStatus {
  const mine = plots.filter((p) => p.developmentId === dev.id)
  const active = mine.filter((p) => !isPlotRetired(p))
  const retired = mine.length - active.length

  const statuses = active.map(plotStatus)
  const needAction = statuses.filter((s) => s.rag === 'red').length
  const dueSoon = statuses.filter((s) => s.rag === 'amber').length

  let rag: Rag = 'green'
  if (dev.status === 'finished') rag = 'green'
  else if (needAction > 0) rag = 'red'
  else if (dueSoon > 0) rag = 'amber'

  const parts: string[] = []
  parts.push(`${active.length} plot${active.length === 1 ? '' : 's'}`)
  if (needAction > 0) parts.push(`${needAction} need action`)
  else if (dueSoon > 0) parts.push(`${dueSoon} due soon`)
  else if (dev.status === 'active' && active.length > 0) parts.push('all on track')
  if (retired > 0) parts.push(`${retired} retired`)
  if (dev.status === 'finished') parts.unshift('Finished')

  return { rag, activePlots: active.length, retiredPlots: retired, needAction, dueSoon, headline: parts.join(' · ') }
}

/**
 * The single most important thing to do on a plot right now — one verb-first
 * line, so the developer never has to read a list of clocks to know what's
 * next. Priority: emergency → anything overdue → due soon → upcoming →
 * paperwork → nothing due.
 */
export interface NextAction {
  label: string
  dueDate?: string
  daysRemaining?: number
  rag: Rag
  urgent?: boolean
}

export interface PlotStatus {
  rag: Rag
  stage: PlotStage
  stageLabel: string
  openClocks: number
  overdue: number
  dueSoon: number
  hasEmergency: boolean
  docsComplete: number
  docsTotal: number
  /** The one thing to do next. */
  next: NextAction
  /** One-line reason shown under the colour (the next action, phrased). */
  headline: string
}

const PRIORITY_RANK: Record<Rag, number> = { red: 1, amber: 2, green: 3 }

interface Candidate extends NextAction {
  priority: number
}

function candidateFromDeadline(
  label: string,
  dueDate: string,
  opts: { floorRag?: Rag; priorityBias?: number } = {}
): Candidate {
  const daysRemaining = daysFromToday(dueDate)
  let rag: Rag = daysRemaining < 0 ? 'red' : daysRemaining <= 5 ? 'amber' : 'green'
  // floorRag guarantees AT LEAST this urgency (green → amber); it never
  // softens an overdue red.
  if (opts.floorRag && PRIORITY_RANK[rag] > PRIORITY_RANK[opts.floorRag]) rag = opts.floorRag
  return {
    label,
    dueDate,
    daysRemaining,
    rag,
    priority: PRIORITY_RANK[rag] + (opts.priorityBias || 0),
  }
}

/** Compute the plot's single next action. */
export function nextAction(plot: Plot): NextAction {
  const stage = plotStage(plot)
  const candidates: Candidate[] = []

  for (const issue of plot.issues) {
    if (issue.status !== 'open') continue
    const ref = issue.reference || ''
    if (issue.type === 'emergency') {
      candidates.push({ label: `Deal with the emergency (${ref})`, rag: 'red', urgent: true, priority: 0 })
    } else if (issue.type === 'complaint') {
      const next = computeComplaintMilestones(issue)
        .filter((m) => !m.completed)
        .sort((a, b) => a.offsetDays - b.offsetDays)[0]
      if (next) {
        const verb = next.rolling ? `Send a 28-day update (${ref})` : `Send the ${next.label} (${ref})`
        candidates.push(candidateFromDeadline(verb, next.dueDate))
      }
    } else {
      const update = nextSnagUpdate(issue)
      if (update) {
        candidates.push(
          candidateFromDeadline(`Send this month's update on the delayed snag (${ref})`, update.dueDate, { floorRag: 'amber' })
        )
      } else {
        candidates.push(candidateFromDeadline(`Put the snag right (${ref})`, addDays(issue.startedAt, SNAG_PUT_RIGHT_DAYS)))
      }
    }
  }

  // Journey obligations
  if (plot.cancellation && !plot.cancellation.refundedDate) {
    const isContract = plot.cancellation.kind === 'contract'
    const due = addDays(plot.cancellation.date, isContract ? 28 : 14)
    candidates.push(
      candidateFromDeadline(isContract ? 'Refund the contract deposit' : 'Refund the reservation fee', due, { floorRag: 'amber' })
    )
  }
  for (const c of plot.changes) {
    if (c.kind !== 'major_change' || c.outcome) continue
    const cancelBy = majorChangeCancelBy(c)
    if (daysFromToday(cancelBy) >= 0) {
      candidates.push({
        label: `Waiting on the customer — they may cancel until ${formatDate(cancelBy)}`,
        dueDate: cancelBy,
        daysRemaining: daysFromToday(cancelBy),
        rag: 'amber',
        priority: 4.5,
      })
    } else {
      candidates.push({ label: 'Record the outcome of the major change', rag: 'amber', priority: 2 })
    }
  }
  if (stage === 'reserved' && plot.exchangeDeadline && !plot.cancellation) {
    const days = daysFromToday(plot.exchangeDeadline)
    if (days < 0) {
      candidates.push({ label: 'Exchanged? Record the date — or agree a new one', rag: 'amber', priority: 2.5 })
    } else {
      candidates.push({ ...candidateFromDeadline('Exchange contracts', plot.exchangeDeadline), priority: 3.5 })
    }
  }
  if (stage === 'notice_served' && plot.completionDate) {
    const pciDone = plot.documents.some((d) => d.key === 'pre_completion_inspection' && d.completed)
    if (!pciDone) {
      candidates.push(candidateFromDeadline('Offer the pre-completion inspection', plot.completionDate))
    }
  }

  // Paperwork for the current stage
  const dueStages: Record<PlotStage, string[]> = {
    setup: [],
    reserved: ['reservation'],
    exchanged: ['reservation', 'pre_contract'],
    notice_served: ['reservation', 'pre_contract', 'completion'],
    completed: ['reservation', 'pre_contract', 'completion'],
    cancelled: [],
  }
  const outstanding = plot.documents.filter((d) => dueStages[stage].includes(d.stage) && !d.completed)
  if (outstanding.length > 0) {
    candidates.push({
      label: `Tick off ${outstanding.length} document${outstanding.length === 1 ? '' : 's'}`,
      rag: 'green',
      priority: 5,
    })
  }

  candidates.sort((a, b) => a.priority - b.priority || (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999))
  const top = candidates[0]
  if (top) {
    const { priority: _p, ...action } = top
    return action
  }

  // Nothing to do.
  if (stage === 'reserved' && plot.reservationDate) {
    const coolingEnd = addDays(plot.reservationDate, 14)
    if (daysFromToday(coolingEnd) >= 0) {
      return { label: `Nothing due — cooling-off until ${formatDate(coolingEnd)}`, rag: 'green' }
    }
  }
  return { label: 'All on track — nothing due', rag: 'green' }
}

export function plotStatus(plot: Plot): PlotStatus {
  const stage = plotStage(plot)
  const clocks = clocksForPlot(plot.issues)
  const journey = journeyClocksForPlot(plot)
  // Info clocks (cooling-off, an open major-change hold) are awareness items,
  // not developer deadlines — they never push the plot amber/red.
  const journeyDue = journey.filter((j) => !j.info)

  const overdue =
    clocks.filter((c) => c.rag === 'red' && !c.urgent).length +
    journeyDue.filter((j) => j.rag === 'red').length
  const dueSoon =
    clocks.filter((c) => c.rag === 'amber').length +
    journeyDue.filter((j) => j.rag === 'amber').length
  const hasEmergency = clocks.some((c) => c.urgent)

  // Before completion only the stages reached so far can have outstanding
  // documents; count against the documents due by the current stage so a
  // freshly reserved plot is not "13 documents outstanding" on day one.
  const dueStages: Record<PlotStage, string[]> = {
    setup: [],
    reserved: ['reservation'],
    exchanged: ['reservation', 'pre_contract'],
    notice_served: ['reservation', 'pre_contract', 'completion'],
    completed: ['reservation', 'pre_contract', 'completion'],
    cancelled: [],
  }
  const dueDocs = plot.documents.filter((d) => dueStages[stage].includes(d.stage))
  const docsTotal = dueDocs.length
  const docsComplete = dueDocs.filter((d) => d.completed).length

  const openCount = clocks.length + journeyDue.length

  let rag: Rag
  if (hasEmergency || overdue > 0) {
    rag = 'red'
  } else if (dueSoon > 0) {
    rag = 'amber'
  } else if (clocks.length === 0) {
    // Journey clocks that are still green (e.g. exchange due in 5+ weeks)
    // shouldn't colour the plot amber — outstanding docs are flagged in the
    // headline instead.
    rag = 'green'
  } else {
    // Open issue clocks, nothing pressing — amber-lite so an open issue is
    // never mistaken for "all done" (unchanged from the pre-journey logic).
    rag = 'amber'
  }

  const next = nextAction(plot)
  const headline = describeAction(next)

  return {
    rag,
    stage,
    stageLabel: STAGE_LABELS[stage],
    openClocks: openCount,
    overdue,
    dueSoon,
    hasEmergency,
    docsComplete,
    docsTotal,
    next,
    headline,
  }
}

/** Phrase a next action as one line, with its countdown where it has one. */
export function describeAction(a: NextAction): string {
  if (a.dueDate !== undefined && a.daysRemaining !== undefined && !a.label.includes(formatDate(a.dueDate))) {
    return `${a.label} — ${describeCountdown(a.daysRemaining)}`
  }
  return a.label
}

export function ragLabel(rag: Rag): string {
  return rag === 'red' ? 'Action overdue' : rag === 'amber' ? 'Due soon' : 'On track'
}
