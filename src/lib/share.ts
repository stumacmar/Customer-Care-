/*
 * The serverless share layer.
 *
 * There is no backend, so data crosses between the developer's device and the
 * buyer's device INSIDE the link itself: a versioned JSON envelope, deflated
 * with the browser's native CompressionStream, base64url-encoded, and carried
 * in the URL *fragment* (#/buyer/…). Fragments are never sent in HTTP
 * requests, so the plot's details never touch GitHub Pages or any server —
 * they go straight from one phone to the other via whatever channel the two
 * people already use (email, WhatsApp, SMS).
 *
 * The same encoding carries the buyer's reports back the other way as a small
 * paste-code inside a pre-addressed email.
 */

import type { ChangeKind, DocumentStage, IssueStatus, IssueType, Plot } from '../types'

// ---------------------------------------------------------------------------
// Payload shapes (kept deliberately small — no photos, no file attachments)
// ---------------------------------------------------------------------------

export interface SnapshotDoc {
  label: string
  stage: DocumentStage
  completedDate?: string
}

export interface SnapshotChange {
  kind: ChangeKind
  date: string
  description: string
  outcome?: 'accepted' | 'cancelled'
}

export interface SnapshotIssue {
  reference?: string
  type: IssueType
  status: IssueStatus
  startedAt: string
  resolvedAt?: string
  description: string
  /** Complaint milestone keys already actioned, so the buyer sees progress. */
  done?: string[]
}

/** What the buyer's app receives — the buyer-relevant slice of one plot. */
export interface BuyerSnapshot {
  k: 'snapshot'
  developerName: string
  developerEmail?: string
  address: string
  customerNames: string
  reservationDate?: string
  exchangeDate?: string
  noticeServedDate?: string
  completionDate?: string
  docs: SnapshotDoc[]
  changes: SnapshotChange[]
  issues: SnapshotIssue[]
  /** ISO date the developer generated this link. */
  sharedOn: string
}

/** What travels back when the buyer reports a problem. */
export interface BuyerReport {
  k: 'report'
  type: IssueType
  description: string
  /** ISO date the buyer sent it. */
  sentOn: string
  address: string
  customerNames?: string
}

export type SharePayload = BuyerSnapshot | BuyerReport

export function buildSnapshot(
  plot: Plot,
  developerName: string,
  developerEmail: string | undefined,
  today: string
): BuyerSnapshot {
  return {
    k: 'snapshot',
    developerName,
    developerEmail: developerEmail || undefined,
    address: plot.address,
    customerNames: plot.customerNames,
    reservationDate: plot.reservationDate,
    exchangeDate: plot.exchangeDate,
    noticeServedDate: plot.noticeServedDate,
    completionDate: plot.completionDate,
    // Only buyer-facing items — internal compliance checks (contract terms
    // review, notifying the warranty provider) are not "documents received".
    docs: plot.documents
      .filter((d) => d.key !== 'contract_checked' && d.key !== 'warranty_provider_notified')
      .map((d) => ({
        label: d.label,
        stage: d.stage,
        completedDate: d.completed ? d.completedDate : undefined,
      })),
    changes: plot.changes.map((c) => ({
      kind: c.kind,
      date: c.date,
      description: c.description,
      outcome: c.outcome,
    })),
    issues: plot.issues.map((i) => ({
      reference: i.reference,
      type: i.type,
      status: i.status,
      startedAt: i.startedAt,
      resolvedAt: i.resolvedAt,
      description: i.description.slice(0, 300),
      done: i.milestoneProgress ? Object.keys(i.milestoneProgress) : undefined,
    })),
    sharedOn: today,
  }
}

// ---------------------------------------------------------------------------
// Encoding: 'v1.' + base64url(deflate-raw(JSON)) — native, no dependencies.
// 'v0.' + base64url(JSON) fallback for browsers without CompressionStream.
// ---------------------------------------------------------------------------

function bytesToBase64url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function pipe(bytes: Uint8Array, stream: { readable: ReadableStream; writable: WritableStream }): Promise<Uint8Array> {
  const src = new Blob([bytes as unknown as BlobPart])
  const ab = await new Response(src.stream().pipeThrough(stream as unknown as ReadableWritablePair)).arrayBuffer()
  return new Uint8Array(ab)
}

export async function encodeShare(payload: SharePayload): Promise<string> {
  const json = JSON.stringify(payload)
  const utf8 = new TextEncoder().encode(json)
  if (typeof CompressionStream !== 'undefined') {
    try {
      const deflated = await pipe(utf8, new CompressionStream('deflate-raw'))
      return `v1.${bytesToBase64url(deflated)}`
    } catch {
      /* fall through to v0 */
    }
  }
  return `v0.${bytesToBase64url(utf8)}`
}

export async function decodeShare(code: string): Promise<SharePayload | null> {
  try {
    const trimmed = code.trim()
    const dot = trimmed.indexOf('.')
    if (dot < 0) return null
    const version = trimmed.slice(0, dot)
    const body = trimmed.slice(dot + 1)
    let json: string
    if (version === 'v1') {
      const inflated = await pipe(base64urlToBytes(body), new DecompressionStream('deflate-raw'))
      json = new TextDecoder().decode(inflated)
    } else if (version === 'v0') {
      json = new TextDecoder().decode(base64urlToBytes(body))
    } else {
      return null
    }
    const parsed = JSON.parse(json) as SharePayload
    if (parsed && (parsed.k === 'snapshot' || parsed.k === 'report')) return parsed
    return null
  } catch {
    return null
  }
}

/** The buyer link for a payload — the data rides in the fragment. */
export function buyerLink(code: string): string {
  return `${location.origin}${location.pathname}#/buyer/${code}`
}

/** Extract a share code from pasted text (a bare code or a whole link/email). */
export function extractCode(text: string): string | null {
  const m = text.match(/v[01]\.[A-Za-z0-9_-]{8,}/)
  return m ? m[0] : null
}
