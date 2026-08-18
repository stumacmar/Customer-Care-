/*
 * Demo dataset — realistic plots so the app can be shown populated without any
 * typing. Dates are computed relative to today so the clocks are always live
 * (a snag mid-countdown, a complaint part-way through its procedure, an open
 * emergency).
 */

import { buildDocumentChecklist } from './code'
import { addDays, nowISO, todayISO } from './dates'
import { id } from './storage'
import type { AppState, ChangeRecord, Development, Issue, Plot, TimelineEvent } from '../types'

function ev(type: TimelineEvent['type'], summary: string, detail?: string, issueId?: string): TimelineEvent {
  return { id: id('ev_'), timestamp: nowISO(), type, summary, detail, issueId }
}

function plot(
  developmentId: string,
  partial: Partial<Plot> & Pick<Plot, 'address' | 'customerNames'>
): Plot {
  return {
    id: id('plot_'),
    developmentId,
    reservationDate: undefined,
    completionDate: undefined,
    documents: buildDocumentChecklist(),
    changes: [],
    issues: [],
    letters: [],
    timeline: [ev('plot_created', `Plot created: ${partial.address}`)],
    createdAt: nowISO(),
    ...partial,
  }
}

function change(partial: Partial<ChangeRecord> & Pick<ChangeRecord, 'kind' | 'description' | 'date'>): ChangeRecord {
  return { id: id('chg_'), createdAt: nowISO(), ...partial }
}

export function buildSeedState(developerName: string): AppState {
  const today = todayISO()

  const meadow: Development = {
    id: id('dev_'),
    name: 'Meadow View',
    location: 'Cheltenham',
    status: 'active',
    createdAt: nowISO(),
  }
  const brook: Development = {
    id: id('dev_'),
    name: 'Brookfield Rise (2023)',
    location: 'Gloucester',
    status: 'finished',
    createdAt: nowISO(),
  }
  const dev = meadow.id

  // 0a. Freshly RESERVED plot — cooling-off live, reservation docs half done.
  const reserved = plot(dev, {
    address: 'Plot 9, Meadow View',
    customerNames: 'Miss Grant',
    reservationDate: addDays(today, -5),
    exchangeDeadline: addDays(today, 37), // reservation + 42 (Code 2.2 minimum)
  })
  reserved.documents = reserved.documents.map((d) =>
    d.key === 'reservation_agreement' ? { ...d, completed: true, completedDate: addDays(today, -5) } : d
  )
  reserved.changes = [
    change({
      kind: 'choice',
      description: 'Front door confirmed: Anthracite grey, Suffolk style.',
      date: addDays(today, -2),
    }),
  ]
  reserved.timeline = [
    ev('stage_recorded', `Reservation recorded — ${addDays(today, -5)}`, 'The 14-day cooling-off period runs from this date (Code 2.3).'),
    ...reserved.timeline,
  ]

  // 0b. EXCHANGED plot mid-build — a live major-change window (amber), a
  // delay on record, and an extra. Expected completion ~10 weeks out.
  const exchanged = plot(dev, {
    address: 'Plot 5, Meadow View',
    customerNames: 'Mr Novak & Mr Reid',
    customerEmail: 'novak.reid@example.com',
    reservationDate: addDays(today, -70),
    exchangeDeadline: addDays(today, -28),
    exchangeDate: addDays(today, -30),
    completionDate: addDays(today, 70),
  })
  exchanged.documents = exchanged.documents.map((d) =>
    d.stage !== 'completion' ? { ...d, completed: true, completedDate: addDays(today, -30) } : d
  )
  exchanged.changes = [
    change({
      kind: 'major_change',
      description: 'Kitchen/diner window moved to side elevation following drainage redesign.',
      date: addDays(today, -4), // 10 days left in the 14-day window
    }),
    change({
      kind: 'delay',
      description: 'Completion moved back ~3 weeks — brickwork delays after supplier failure.',
      date: addDays(today, -12),
    }),
    change({
      kind: 'extra',
      description: 'Quartz worktop upgrade ordered — £1,850 paid.',
      date: addDays(today, -25),
    }),
  ]
  exchanged.timeline = [
    ev('change_logged', 'MAJOR change notified in writing: Kitchen/diner window moved…', undefined),
    ev('stage_recorded', `Exchange of contracts recorded — ${addDays(today, -30)}`),
    ...exchanged.timeline,
  ]

  // 1. Green plot — all documents done, no open clocks.
  const green = plot(dev, {
    address: 'Plot 1, Meadow View',
    customerNames: 'Mr & Mrs Okafor',
    reservationDate: addDays(today, -180),
    exchangeDate: addDays(today, -140),
    noticeServedDate: addDays(today, -134),
    completionDate: addDays(today, -120),
  })
  green.documents = green.documents.map((d) => ({ ...d, completed: true, completedDate: addDays(today, -119) }))

  // 2. Amber plot — snag due in 3 days, a couple of docs outstanding.
  const amber = plot(dev, {
    address: 'Plot 2, Meadow View',
    customerNames: 'Ms Farrell',
    reservationDate: addDays(today, -150),
    completionDate: addDays(today, -60),
  })
  amber.documents = amber.documents.map((d, i) => (i < 6 ? { ...d, completed: true, completedDate: addDays(today, -59) } : d))
  const snag: Issue = {
    id: id('iss_'),
    type: 'snag',
    reference: 'S-001',
    description: 'Kitchen tap dripping; sealant around bath shrinking.',
    startedAt: addDays(today, -27), // 3 days left on the 30-day clock
    status: 'open',
    createdAt: nowISO(),
  }
  amber.issues = [snag]
  amber.timeline = [ev('snag_logged', 'Snag logged (S-001)', snag.description, snag.id), ...amber.timeline]

  // 3. Red plot — a live complaint past two milestones, plus an open emergency.
  const red = plot(dev, {
    address: 'Plot 7, Meadow View',
    customerNames: 'Mr Ali & Ms Chen',
    customerEmail: 'ali.chen@example.com',
    reservationDate: addDays(today, -110),
    completionDate: addDays(today, -35),
  })
  red.documents = red.documents.map((d, i) => (i < 4 ? { ...d, completed: true, completedDate: addDays(today, -34) } : d))

  const complaintId = id('iss_')
  const complaint: Issue = {
    id: complaintId,
    type: 'complaint',
    reference: 'C-001',
    description: 'Persistent damp patch in main bedroom; not resolved after two visits.',
    startedAt: addDays(today, -32), // past day 30 → assessment overdue
    status: 'open',
    milestoneProgress: {
      acknowledgement: { completedDate: addDays(today, -30) },
      path_to_resolution: { completedDate: addDays(today, -25) },
    },
    createdAt: nowISO(),
  }
  const emergency: Issue = {
    id: id('iss_'),
    type: 'emergency',
    reference: 'E-001',
    description: 'No hot water and boiler leaking — vulnerable occupant.',
    startedAt: addDays(today, -1),
    status: 'open',
    createdAt: nowISO(),
  }
  red.issues = [emergency, complaint]
  red.timeline = [
    ev('emergency_logged', 'Emergency issue logged (E-001)', emergency.description, emergency.id),
    ev('milestone_completed', 'Milestone actioned: Path to Resolution letter', undefined, complaintId),
    ev('milestone_completed', 'Milestone actioned: Written acknowledgement', undefined, complaintId),
    ev('complaint_logged', 'Complaint logged (C-001)', complaint.description, complaintId),
    ...red.timeline,
  ]

  // 4. A RETIRED plot on the finished Brookfield development — completed ~2.5
  // years ago, so its two-year Ombudsman window has closed and it auto-retires.
  const retired = plot(brook.id, {
    address: 'Plot 4, Brookfield Rise',
    customerNames: 'Mr & Mrs Doyle',
    reservationDate: addDays(today, -1000),
    completionDate: addDays(today, -900), // ~2 years 6 months ago
  })
  retired.documents = retired.documents.map((d) => ({ ...d, completed: true, completedDate: addDays(today, -899) }))

  return {
    version: 3,
    developerName,
    developments: [meadow, brook],
    plots: [red, exchanged, reserved, amber, green, retired],
  }
}
