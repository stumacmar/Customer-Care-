/*
 * Traffic-light computation for the dashboard.
 *
 *   🟢 Green  — no open clocks AND every document complete
 *   🟠 Amber  — something due within 5 days (and nothing overdue)
 *   🔴 Red    — something overdue, or an open emergency
 *
 * The whole point of the dashboard is that the builder scans colour, not text.
 */

import { clocksForPlot } from './code'
import type { Plot, Rag } from '../types'

export interface PlotStatus {
  rag: Rag
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
  const clocks = clocksForPlot(plot.issues)
  const overdue = clocks.filter((c) => c.rag === 'red' && !c.urgent).length
  const dueSoon = clocks.filter((c) => c.rag === 'amber').length
  const hasEmergency = clocks.some((c) => c.urgent)

  const docsTotal = plot.documents.length
  const docsComplete = plot.documents.filter((d) => d.completed).length
  const docsAllDone = docsComplete === docsTotal

  let rag: Rag
  if (hasEmergency || overdue > 0) {
    rag = 'red'
  } else if (dueSoon > 0) {
    rag = 'amber'
  } else if (clocks.length === 0 && docsAllDone) {
    rag = 'green'
  } else {
    // No urgent clocks, but documents outstanding — not fully green, not
    // pressing. Show amber-lite as green-with-caveat; we keep it green for the
    // colour scan but the headline flags the outstanding docs.
    rag = clocks.length === 0 ? 'green' : 'amber'
  }

  const headline = buildHeadline({
    hasEmergency,
    overdue,
    dueSoon,
    openClocks: clocks.length,
    docsComplete,
    docsTotal,
  })

  return {
    rag,
    openClocks: clocks.length,
    overdue,
    dueSoon,
    hasEmergency,
    docsComplete,
    docsTotal,
    headline,
  }
}

function buildHeadline(s: {
  hasEmergency: boolean
  overdue: number
  dueSoon: number
  openClocks: number
  docsComplete: number
  docsTotal: number
}): string {
  const parts: string[] = []
  if (s.hasEmergency) parts.push('⚠ Emergency open')
  if (s.overdue > 0) parts.push(`${s.overdue} overdue`)
  if (s.dueSoon > 0) parts.push(`${s.dueSoon} due soon`)
  if (s.openClocks === 0) parts.push('No open clocks')
  const docs = s.docsTotal - s.docsComplete
  if (docs > 0) parts.push(`${docs} document${docs === 1 ? '' : 's'} outstanding`)
  else parts.push('Documents complete')
  return parts.join(' · ')
}

export function ragLabel(rag: Rag): string {
  return rag === 'red' ? 'Action overdue' : rag === 'amber' ? 'Due soon' : 'On track'
}
