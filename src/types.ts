/*
 * Domain model for the NHQB Code Compliance Tracker.
 *
 * The product organises around the PLOT (the property), not the contact —
 * because that is what the Code's obligations attach to. Everything else
 * (documents, issues/clocks, timeline) hangs off a plot.
 */

export type IssueType = 'snag' | 'complaint' | 'emergency'

export type IssueStatus = 'open' | 'resolved' | 'closed'

/** Keys for the five Code-mandated complaint letters + rolling updates. */
export type MilestoneKey =
  | 'acknowledgement' // Day 5
  | 'path_to_resolution' // Day 10
  | 'assessment_response' // Day 30
  | 'eight_week' // Day 56
  | string // rolling 'update_28_N'

/** Progress against a single complaint milestone. */
export interface MilestoneProgress {
  completedDate: string // ISO date
  letterId?: string
  note?: string
}

/** One of the three trigger types. Each open issue is a live clock. */
export interface Issue {
  id: string
  type: IssueType
  description: string
  /** Optional photo captured at logging time, stored as a data URL. */
  photoDataUrl?: string
  /**
   * ISO date the clock started. For complaints this is the Code's "complaint
   * start date" — the first business day after the complaint was received —
   * which may be later than the day it was logged.
   */
  startedAt: string
  /** ISO date the issue was actually received/logged (complaints only). */
  receivedAt?: string
  status: IssueStatus
  resolvedAt?: string // ISO date the issue was put right / closed
  resolutionNote?: string
  /** Complaint reference shown on letters, e.g. "C-001". */
  reference?: string
  /** For complaints: which milestones have been actioned. */
  milestoneProgress?: Record<string, MilestoneProgress>
  createdAt: string // ISO datetime
}

/** Which stage of the buying journey a checklist document belongs to. */
export type DocumentStage = 'reservation' | 'pre_contract' | 'completion'

/** A single tick-and-upload item on a plot's document checklist. */
export interface DocumentItem {
  key: string
  label: string
  hint?: string
  /** The Code clause this item comes from — shown only when the developer
   *  turns Code references on, and in the audit export. */
  clause?: string
  /** Journey stage the document is due at (drives the grouped checklist). */
  stage: DocumentStage
  completed: boolean
  completedDate?: string // ISO date
  note?: string
  fileName?: string
  fileDataUrl?: string
}

/**
 * Kinds of entry in the plot's spec-and-changes log — the evidence trail for
 * choices, extras, changes and delays between reservation and completion.
 *
 *  - choice        customer choice/confirmation (e.g. front door colour)
 *  - extra         paid extra or upgrade the customer ordered
 *  - minor_change  developer change that is NOT major — Code 2.9: keep the
 *                  customer informed; no right to cancel
 *  - major_change  Code 2.9: significantly/substantially affects size,
 *                  appearance or value — written notice required, customer may
 *                  cancel within 14 days of receiving it, and notice to
 *                  complete cannot be served during those 14 days
 *  - delay         change to the expected completion timetable — Code 2.6/2.8:
 *                  keep the customer informed and updated
 */
export type ChangeKind = 'choice' | 'extra' | 'minor_change' | 'major_change' | 'delay'

/** One entry in the spec-and-changes log. */
export interface ChangeRecord {
  id: string
  kind: ChangeKind
  description: string
  /** ISO date the choice was confirmed / the change or delay was notified. */
  date: string
  photoDataUrl?: string
  /** Major changes only: how the 14-day window ended. */
  outcome?: 'accepted' | 'cancelled'
  outcomeDate?: string // ISO date
  createdAt: string // ISO datetime
}

/**
 * A recorded cancellation of the purchase. Starts the Code's refund clock:
 * reservation fee within 14 days of the cancellation notice (2.4), or the
 * contract deposit within 28 days of the contract being cancelled (2.13).
 */
export interface Cancellation {
  kind: 'reservation' | 'contract'
  /** ISO date the customer's notice of cancellation was received. */
  date: string
  /** ISO date the refund was paid — clears the refund clock. */
  refundedDate?: string
}

export type TimelineEventType =
  | 'plot_created'
  | 'snag_logged'
  | 'complaint_logged'
  | 'emergency_logged'
  | 'issue_resolved'
  | 'document_completed'
  | 'document_uncompleted'
  | 'milestone_completed'
  | 'letter_generated'
  | 'stage_recorded'
  | 'change_logged'
  | 'cancellation_recorded'
  | 'refund_recorded'
  | 'note'

/**
 * An entry in the plot's immutable audit timeline. Every state change appends
 * one of these — this is the record handed to an NHQB auditor or the Ombudsman.
 */
export interface TimelineEvent {
  id: string
  timestamp: string // ISO datetime — when it was recorded
  type: TimelineEventType
  summary: string
  detail?: string
  issueId?: string
}

/**
 * A saved generated letter (kept so it appears in the audit record).
 * `issueId` holds the related record's id — an Issue for complaint letters, or
 * a ChangeRecord for major-change / delay letters.
 */
export interface SavedLetter {
  id: string
  issueId: string
  milestoneKey: MilestoneKey
  title: string
  body: string
  createdAt: string // ISO datetime
}

/**
 * A development (site) groups the plots built on it. A small developer finishes
 * a development and moves on to the next, so a development can be marked
 * "finished" and tucked away without losing its records.
 */
export interface Development {
  id: string
  name: string
  location?: string
  status: 'active' | 'finished'
  createdAt: string // ISO datetime
}

/**
 * The journey stages a plot moves through, derived from its dates:
 * reserved → exchanged → notice served → completed (→ retired after the
 * two-year after-sales window closes), or cancelled at any point.
 */
export type PlotStage = 'setup' | 'reserved' | 'exchanged' | 'notice_served' | 'completed' | 'cancelled'

export interface Plot {
  id: string
  /** The development this plot belongs to. */
  developmentId: string
  address: string
  customerNames: string
  /** Optional — only needed to email letters. GDPR: store no more than this. */
  customerEmail?: string
  /** Date the Reservation Agreement was signed — starts the 14-day cooling-off (2.3). */
  reservationDate?: string // ISO date
  /**
   * The exchange-by date agreed in the Reservation Agreement — Code 2.2m:
   * reasonable, and not less than six weeks after reservation unless the
   * customer asks for earlier.
   */
  exchangeDeadline?: string // ISO date
  /** Date contracts were actually exchanged (missives concluded in Scotland). */
  exchangeDate?: string // ISO date
  /** Date the notice to complete was served — opens the PCI window (2.8). */
  noticeServedDate?: string // ISO date
  /** Expected completion date until it passes; then the actual completion date. */
  completionDate?: string // ISO date
  /** Set if the purchase was cancelled — starts the refund clock (2.4 / 2.13). */
  cancellation?: Cancellation
  documents: DocumentItem[]
  /** Spec-and-changes log: choices, extras, changes, delays (2.6 / 2.9). */
  changes: ChangeRecord[]
  issues: Issue[]
  letters: SavedLetter[]
  timeline: TimelineEvent[]
  createdAt: string // ISO datetime
}

export interface AppState {
  version: number
  developerName: string
  /** Where buyer reports are emailed — included in shared buyer links. */
  developerEmail?: string
  /** UI preferences. Compliance is built in; showing the clause numbers is opt-in. */
  showCodeRefs?: boolean
  /** ISO datetime of the last backup download — drives the weekly backup nag. */
  lastBackupAt?: string
  developments: Development[]
  plots: Plot[]
}

/** Colour bands for the traffic-light dashboard. */
export type Rag = 'green' | 'amber' | 'red'

/** A computed, human-readable clock derived from an open issue. */
export interface Clock {
  issueId: string
  type: IssueType
  label: string
  /** ISO date the next action is due (undefined for emergencies). */
  dueDate?: string
  /** Days until due — negative means overdue. Undefined for emergencies. */
  daysRemaining?: number
  rag: Rag
  urgent?: boolean
}

export type JourneyClockKind =
  | 'cooling_off' // 2.3 — customer may cancel for a full refund
  | 'exchange' // 2.2m — exchange of contracts due
  | 'major_change' // 2.9 — customer's 14-day cancellation window
  | 'refund' // 2.4 / 2.13 — refund due after cancellation
  | 'notice_period' // 2.8 — completion notice period shorter than 14 days
  | 'pci' // 2.8 — offer the pre-completion inspection before completion

/**
 * A pre-completion clock derived from the plot's journey dates and changes —
 * the Code's reservation-to-completion obligations, shown alongside issue
 * clocks. `info` clocks are rights/holds to be aware of, not developer
 * deadlines, so they never turn the plot red.
 */
export interface JourneyClock {
  kind: JourneyClockKind
  /** Clause reference shown to the developer, e.g. "2.3". */
  clause: string
  label: string
  detail?: string
  dueDate?: string
  daysRemaining?: number
  rag: Rag
  /** True for awareness items (cooling-off, major-change hold). */
  info?: boolean
  /** The ChangeRecord this clock came from (major changes). */
  changeId?: string
}
