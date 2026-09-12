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
  AFTER_SALES_YEARS,
  clocksForPlot,
  computeComplaintMilestones,
  coolingOffEnd,
  dueStagesFor,
  journeyClocksForPlot,
  majorChangeCancelBy,
  majorChangeWindowsCovering,
  nextSnagUpdate,
  plotStage,
  ragForDeadline,
  refundDueDate,
  snagPutRightDate,
  STAGE_LABELS,
  targetCompletion,
} from './code'
import { addYears, daysFromToday, describeCountdown, formatDate, todayISO } from './dates'
import type { Development, Plot, PlotStage, Rag } from '../types'

/**
 * A plot auto-retires once its completion date is more than two years ago —
 * the point the customer's New Homes Ombudsman window has closed. Retired plots
 * drop out of the active list (but are never auto-deleted; the record is kept
 * until the developer chooses to export and remove it). A cancelled plot
 * retires once its refund has been paid — nothing is left to track.
 */
export function isPlotRetired(plot: Plot, today = todayISO()): boolean {
  const openIssues = plot.issues.some((i) => i.status === 'open')
  // A cancelled plot retires once refunded — unless a complaint is still
  // running (the customer keeps the right to complain after cancellation).
  if (plot.cancellation) return !!plot.cancellation.refundedDate && !openIssues
  if (!plot.completionDate) return false
  return addYears(plot.completionDate, AFTER_SALES_YEARS) < today && !openIssues
}

/**
 * When the personal data can go: two years from the later of reservation and
 * legal completion (the period in which a complaint can be referred to the
 * Ombudsman — Code 3.5), with nothing still open.
 */
export function isPlotDeletable(plot: Plot, today = todayISO()): boolean {
  if (plot.issues.some((i) => i.status === 'open')) return false
  const anchors = [plot.reservationDate, plot.completionDate].filter((d): d is string => !!d)
  if (anchors.length === 0) return false
  const latest = anchors.sort()[anchors.length - 1]
  return addYears(latest, AFTER_SALES_YEARS) < today
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

  // A finished development still goes red if a plot on it needs action —
  // marking it finished tucks it away, it does not switch the Code off.
  let rag: Rag = 'green'
  if (needAction > 0) rag = 'red'
  else if (dueSoon > 0) rag = 'amber'

  // The nearest dated action across the site, so green and amber carry a
  // time frame rather than just a colour.
  const soonest = statuses
    .map((s) => s.next.daysRemaining)
    .filter((d): d is number => d !== undefined)
    .sort((a, b) => a - b)[0]
  const parts: string[] = []
  parts.push(`${active.length} plot${active.length === 1 ? '' : 's'}`)
  if (needAction > 0) parts.push(`${needAction} need action`)
  else if (dueSoon > 0) parts.push(`${dueSoon} due soon${soonest !== undefined ? ` · next ${describeCountdown(soonest)}` : ''}`)
  else if (dev.status === 'active' && active.length > 0) parts.push(soonest !== undefined ? `on track · next ${describeCountdown(soonest)}` : 'all on track')
  if (retired > 0) parts.push(`${retired} archived`)
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
  let rag: Rag = ragForDeadline(daysRemaining)
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
      // Within 30 days: put it right. Past 30 days (3.3): explain the delay,
      // then update at least monthly — the next unsent update is the action.
      const putRight = snagPutRightDate(issue)
      const update = nextSnagUpdate(issue)
      if (daysFromToday(putRight) >= 0 || !update) {
        candidates.push(candidateFromDeadline(`Put the snag right (${ref})`, putRight))
      } else {
        const verb = update.n === 1 ? `Snag overdue — put it right, or update the customer with the reason (${ref})` : `Send this month's update on the delayed snag (${ref})`
        candidates.push(candidateFromDeadline(verb, update.dueDate, { floorRag: 'amber' }))
      }
    }
  }

  // Journey obligations
  if (plot.cancellation && !plot.cancellation.refundedDate) {
    const isContract = plot.cancellation.kind === 'contract'
    candidates.push(
      candidateFromDeadline(isContract ? 'Refund the contract deposit' : 'Refund the reservation fee', refundDueDate(plot.cancellation), { floorRag: 'amber' })
    )
  }
  const journeyLive = stage !== 'completed' && stage !== 'cancelled'
  for (const c of plot.changes) {
    if (!journeyLive || c.kind !== 'major_change' || c.outcome) continue
    const cancelBy = majorChangeCancelBy(c)
    if (!cancelBy) {
      candidates.push({ label: 'Call the customer, then send the written notice of the major change', rag: 'amber', priority: 2 })
      continue
    }
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
  const completionTarget = targetCompletion(plot)
  if (stage === 'notice_served' && completionTarget) {
    const pciDone = plot.documents.some((d) => d.key === 'pre_completion_inspection' && d.completed)
    if (!pciDone) {
      candidates.push(candidateFromDeadline('Offer the pre-completion inspection', completionTarget))
    }
  }
  if (journeyLive && plot.noticeServedDate && majorChangeWindowsCovering(plot, plot.noticeServedDate).length > 0) {
    candidates.push({ label: 'Notice to complete was served inside a major-change window — check the dates', rag: 'amber', priority: 2 })
  }
  if (journeyLive && plot.expectedCompletionDate && !plot.completionDate && daysFromToday(plot.expectedCompletionDate) < 0) {
    candidates.push({ label: 'Expected completion date passed — record legal completion, or log the delay and update the date', rag: 'amber', priority: 2.5 })
  }

  // Paperwork for the current stage
  const outstanding = plot.documents.filter((d) => dueStagesFor(plot).includes(d.stage) && !d.completed)
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
    const coolingEnd = coolingOffEnd(plot.reservationDate)
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
  const dueDocs = plot.documents.filter((d) => dueStagesFor(plot).includes(d.stage))
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
