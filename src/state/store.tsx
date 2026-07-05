/*
 * Central store: a reducer over AppState, persisted to localStorage.
 *
 * The key discipline here is the immutable timeline — every mutating action
 * appends a TimelineEvent to the affected plot. Screens never write to the
 * timeline directly; they dispatch an action and the reducer records it. That
 * is what makes the audit export trustworthy.
 */

import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import type {
  AppState,
  DocumentItem,
  Issue,
  IssueType,
  MilestoneKey,
  Plot,
  TimelineEvent,
  TimelineEventType,
} from '../types'
import { buildDocumentChecklist } from '../lib/code'
import { formatDate, nextBusinessDay, nowISO, todayISO } from '../lib/dates'
import { emptyState, id, loadState, saveState } from '../lib/storage'

type Action =
  | { type: 'SET_DEVELOPER_NAME'; name: string }
  | {
      type: 'ADD_PLOT'
      plotId: string
      address: string
      customerNames: string
      customerEmail?: string
      reservationDate?: string
      completionDate?: string
    }
  | {
      type: 'UPDATE_PLOT_DETAILS'
      plotId: string
      patch: Partial<
        Pick<Plot, 'address' | 'customerNames' | 'customerEmail' | 'reservationDate' | 'completionDate'>
      >
    }
  | { type: 'DELETE_PLOT'; plotId: string }
  | {
      type: 'LOG_ISSUE'
      plotId: string
      issueType: IssueType
      description: string
      photoDataUrl?: string
    }
  | { type: 'RESOLVE_ISSUE'; plotId: string; issueId: string; note: string }
  | { type: 'REOPEN_ISSUE'; plotId: string; issueId: string }
  | {
      type: 'COMPLETE_MILESTONE'
      plotId: string
      issueId: string
      milestoneKey: MilestoneKey
      milestoneLabel: string
      letterId?: string
    }
  | {
      type: 'TOGGLE_DOCUMENT'
      plotId: string
      docKey: string
      completed: boolean
    }
  | {
      type: 'UPDATE_DOCUMENT'
      plotId: string
      docKey: string
      patch: Partial<Pick<DocumentItem, 'note' | 'fileName' | 'fileDataUrl'>>
    }
  | {
      type: 'SAVE_LETTER'
      plotId: string
      issueId: string
      milestoneKey: MilestoneKey
      title: string
      body: string
    }
  | { type: 'ADD_NOTE'; plotId: string; note: string; issueId?: string }
  | { type: 'REPLACE_STATE'; state: AppState }

function event(
  type: TimelineEventType,
  summary: string,
  detail?: string,
  issueId?: string
): TimelineEvent {
  return { id: id('ev_'), timestamp: nowISO(), type, summary, detail, issueId }
}

/** Apply a change to a single plot and append one or more timeline events. */
function updatePlot(
  state: AppState,
  plotId: string,
  fn: (plot: Plot) => { plot: Plot; events: TimelineEvent[] }
): AppState {
  return {
    ...state,
    plots: state.plots.map((p) => {
      if (p.id !== plotId) return p
      const { plot, events } = fn(p)
      return { ...plot, timeline: [...events, ...plot.timeline] }
    }),
  }
}

function nextReference(plot: Plot, issueType: IssueType): string {
  const prefix = issueType === 'complaint' ? 'C' : issueType === 'emergency' ? 'E' : 'S'
  const count = plot.issues.filter((i) => i.type === issueType).length + 1
  return `${prefix}-${String(count).padStart(3, '0')}`
}

const ISSUE_META: Record<
  IssueType,
  { logType: TimelineEventType; noun: string }
> = {
  snag: { logType: 'snag_logged', noun: 'Snag' },
  complaint: { logType: 'complaint_logged', noun: 'Complaint' },
  emergency: { logType: 'emergency_logged', noun: 'Emergency issue' },
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_DEVELOPER_NAME':
      return { ...state, developerName: action.name }

    case 'ADD_PLOT': {
      const plot: Plot = {
        id: action.plotId,
        address: action.address.trim(),
        customerNames: action.customerNames.trim(),
        customerEmail: action.customerEmail?.trim() || undefined,
        reservationDate: action.reservationDate,
        completionDate: action.completionDate,
        documents: buildDocumentChecklist(),
        issues: [],
        letters: [],
        timeline: [event('plot_created', `Plot created: ${action.address.trim()}`)],
        createdAt: nowISO(),
      }
      return { ...state, plots: [plot, ...state.plots] }
    }

    case 'UPDATE_PLOT_DETAILS':
      return updatePlot(state, action.plotId, (plot) => {
        const patch = { ...action.patch }
        if (patch.address !== undefined) patch.address = patch.address.trim()
        if (patch.customerNames !== undefined) patch.customerNames = patch.customerNames.trim()
        if (patch.customerEmail !== undefined)
          patch.customerEmail = patch.customerEmail.trim() || undefined
        return {
          plot: { ...plot, ...patch },
          events: [event('note', 'Plot details updated')],
        }
      })

    case 'DELETE_PLOT':
      return { ...state, plots: state.plots.filter((p) => p.id !== action.plotId) }

    case 'LOG_ISSUE':
      return updatePlot(state, action.plotId, (plot) => {
        const meta = ISSUE_META[action.issueType]
        const reference = nextReference(plot, action.issueType)
        const received = todayISO()
        // Per the Code, a complaint's clock runs from the "complaint start
        // date" — the first business day AFTER it is received. Snags run from
        // the day they are reported.
        const isComplaint = action.issueType === 'complaint'
        const startedAt = isComplaint ? nextBusinessDay(received) : received
        const issue: Issue = {
          id: id('iss_'),
          type: action.issueType,
          description: action.description.trim(),
          photoDataUrl: action.photoDataUrl,
          startedAt,
          receivedAt: isComplaint ? received : undefined,
          status: 'open',
          reference,
          milestoneProgress: isComplaint ? {} : undefined,
          createdAt: nowISO(),
        }
        const detail = isComplaint
          ? `${action.description.trim()}\nComplaint start date: ${formatDate(startedAt)} (first business day after receipt)`
          : action.description.trim()
        const ev = event(meta.logType, `${meta.noun} logged (${reference})`, detail, issue.id)
        return { plot: { ...plot, issues: [issue, ...plot.issues] }, events: [ev] }
      })

    case 'RESOLVE_ISSUE':
      return updatePlot(state, action.plotId, (plot) => {
        let ref = ''
        const issues = plot.issues.map((i) => {
          if (i.id !== action.issueId) return i
          ref = i.reference || i.id
          return {
            ...i,
            status: 'resolved' as const,
            resolvedAt: todayISO(),
            resolutionNote: action.note.trim() || undefined,
          }
        })
        const ev = event(
          'issue_resolved',
          `Resolved (${ref})`,
          action.note.trim() || undefined,
          action.issueId
        )
        return { plot: { ...plot, issues }, events: [ev] }
      })

    case 'REOPEN_ISSUE':
      return updatePlot(state, action.plotId, (plot) => {
        let ref = ''
        const issues = plot.issues.map((i) => {
          if (i.id !== action.issueId) return i
          ref = i.reference || i.id
          return { ...i, status: 'open' as const, resolvedAt: undefined }
        })
        const ev = event('note', `Re-opened (${ref})`, undefined, action.issueId)
        return { plot: { ...plot, issues }, events: [ev] }
      })

    case 'COMPLETE_MILESTONE':
      return updatePlot(state, action.plotId, (plot) => {
        const issues = plot.issues.map((i) => {
          if (i.id !== action.issueId) return i
          const progress = { ...(i.milestoneProgress || {}) }
          progress[action.milestoneKey] = {
            completedDate: todayISO(),
            letterId: action.letterId,
          }
          return { ...i, milestoneProgress: progress }
        })
        const ev = event(
          'milestone_completed',
          `Milestone actioned: ${action.milestoneLabel}`,
          undefined,
          action.issueId
        )
        return { plot: { ...plot, issues }, events: [ev] }
      })

    case 'TOGGLE_DOCUMENT':
      return updatePlot(state, action.plotId, (plot) => {
        let label = ''
        const documents = plot.documents.map((d) => {
          if (d.key !== action.docKey) return d
          label = d.label
          return {
            ...d,
            completed: action.completed,
            completedDate: action.completed ? todayISO() : undefined,
          }
        })
        const ev = event(
          action.completed ? 'document_completed' : 'document_uncompleted',
          `${action.completed ? 'Document completed' : 'Document un-ticked'}: ${label}`
        )
        return { plot: { ...plot, documents }, events: [ev] }
      })

    case 'UPDATE_DOCUMENT':
      return updatePlot(state, action.plotId, (plot) => {
        const documents = plot.documents.map((d) =>
          d.key === action.docKey ? { ...d, ...action.patch } : d
        )
        const events: TimelineEvent[] = []
        if (action.patch.fileName) {
          const label = plot.documents.find((d) => d.key === action.docKey)?.label || ''
          events.push(event('note', `File attached to "${label}": ${action.patch.fileName}`))
        }
        return { plot: { ...plot, documents }, events }
      })

    case 'SAVE_LETTER':
      return updatePlot(state, action.plotId, (plot) => {
        const letterId = id('let_')
        const letter = {
          id: letterId,
          issueId: action.issueId,
          milestoneKey: action.milestoneKey,
          title: action.title,
          body: action.body,
          createdAt: nowISO(),
        }
        // Saving a letter also actions the matching milestone.
        const issues = plot.issues.map((i) => {
          if (i.id !== action.issueId) return i
          const progress = { ...(i.milestoneProgress || {}) }
          if (!progress[action.milestoneKey]) {
            progress[action.milestoneKey] = { completedDate: todayISO(), letterId }
          } else {
            progress[action.milestoneKey] = { ...progress[action.milestoneKey], letterId }
          }
          return { ...i, milestoneProgress: progress }
        })
        const ev = event('letter_generated', `Letter generated: ${action.title}`, undefined, action.issueId)
        return { plot: { ...plot, letters: [letter, ...plot.letters], issues }, events: [ev] }
      })

    case 'ADD_NOTE':
      return updatePlot(state, action.plotId, (plot) => ({
        plot,
        events: [event('note', action.note.trim(), undefined, action.issueId)],
      }))

    case 'REPLACE_STATE':
      return action.state

    default:
      return state
  }
}

interface StoreValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function usePlot(plotId: string | null): Plot | undefined {
  const { state } = useStore()
  return state.plots.find((p) => p.id === plotId)
}

export { emptyState }
export type { Action }
