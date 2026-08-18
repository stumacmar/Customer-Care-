/*
 * Traffic-light computation for the dashboard.
 *
 *   🟢 Green  — no open clocks AND every document complete
 *   🟠 Amber  — something due within 5 days (and nothing overdue)
 *   🔴 Red    — something overdue, or an open emergency
 *
 * The whole point of the dashboard is that the builder scans colour, not text.
 */

import { clocksForPlot, journeyClocksForPlot, plotStage, STAGE_LABELS } from './code'
import { daysFromToday, formatDate } from './dates'
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
  /** One-line reason shown under the colour. */
  headline: string
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

  const headline = buildHeadline({
    stage,
    hasEmergency,
    overdue,
    dueSoon,
    openClocks: openCount,
    docsComplete,
    docsTotal,
    coolingOffEnd: journey.find((j) => j.kind === 'cooling_off')?.dueDate,
  })

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
    headline,
  }
}

function buildHeadline(s: {
  stage: PlotStage
  hasEmergency: boolean
  overdue: number
  dueSoon: number
  openClocks: number
  docsComplete: number
  docsTotal: number
  coolingOffEnd?: string
}): string {
  const parts: string[] = []
  if (s.hasEmergency) parts.push('Emergency open')
  if (s.overdue > 0) parts.push(`${s.overdue} overdue`)
  if (s.dueSoon > 0) parts.push(`${s.dueSoon} due soon`)
  if (s.stage === 'cancelled') parts.push('Cancelled — refund clock running')
  else if (s.overdue === 0 && s.dueSoon === 0 && s.coolingOffEnd)
    parts.push(`Cooling-off until ${formatDate(s.coolingOffEnd)}`)
  else if (s.openClocks === 0) parts.push('No open clocks')
  const docs = s.docsTotal - s.docsComplete
  if (docs > 0) parts.push(`${docs} document${docs === 1 ? '' : 's'} outstanding`)
  else if (s.docsTotal > 0) parts.push('Documents complete')
  return parts.join(' · ')
}

export function ragLabel(rag: Rag): string {
  return rag === 'red' ? 'Action overdue' : rag === 'amber' ? 'Due soon' : 'On track'
}
