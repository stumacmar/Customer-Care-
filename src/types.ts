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
  /** ISO date the clock started (usually the day it was logged). */
  startedAt: string
  status: IssueStatus
  resolvedAt?: string // ISO date the issue was put right / closed
  resolutionNote?: string
  /** Complaint reference shown on letters, e.g. "C-001". */
  reference?: string
  /** For complaints: which milestones have been actioned. */
  milestoneProgress?: Record<string, MilestoneProgress>
  createdAt: string // ISO datetime
}

/** A single tick-and-upload item on a plot's document checklist. */
export interface DocumentItem {
  key: string
  label: string
  hint?: string
  completed: boolean
  completedDate?: string // ISO date
  note?: string
  fileName?: string
  fileDataUrl?: string
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

/** A saved generated letter (kept so it appears in the audit record). */
export interface SavedLetter {
  id: string
  issueId: string
  milestoneKey: MilestoneKey
  title: string
  body: string
  createdAt: string // ISO datetime
}

export interface Plot {
  id: string
  address: string
  customerNames: string
  reservationDate?: string // ISO date
  completionDate?: string // ISO date
  documents: DocumentItem[]
  issues: Issue[]
  letters: SavedLetter[]
  timeline: TimelineEvent[]
  createdAt: string // ISO datetime
}

export interface AppState {
  version: number
  developerName: string
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
