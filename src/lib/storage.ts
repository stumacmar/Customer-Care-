/*
 * Persistence. For the Phase 1 MVP the whole dataset lives in the browser
 * (localStorage) so the app needs no backend and works offline on site. The
 * shape is small — a handful of live plots per developer — so a single JSON
 * blob is plenty. Swapping this module for a real API later touches nothing
 * else.
 */

import { DOCUMENT_TEMPLATE } from './code'
import type { AppState, Development, DocumentItem, Plot } from '../types'

const STORAGE_KEY = 'plot-clock-state-v1'

export const CURRENT_VERSION = 3

export function emptyState(): AppState {
  return { version: CURRENT_VERSION, developerName: '', developments: [], plots: [] }
}

/**
 * Bring any older saved state up to the current shape without losing data.
 * v1 had a flat list of plots with no developments — migrate those into one
 * default development so existing users keep every plot, issue and letter.
 * v2 → v3 extended plots back to the reservation stage: documents gained a
 * journey stage (and new reservation/pre-contract items), and plots gained a
 * spec-and-changes log.
 */
function migrate(parsed: Partial<AppState>): AppState {
  const plots: Plot[] = Array.isArray(parsed.plots) ? (parsed.plots as Plot[]) : []
  let developments: Development[] = Array.isArray(parsed.developments)
    ? (parsed.developments as Development[])
    : []

  const orphaned = plots.filter((p) => !p.developmentId)
  if (orphaned.length > 0 || (plots.length > 0 && developments.length === 0)) {
    const defaultDev: Development = {
      id: 'dev_default',
      name: 'My development',
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    developments = [defaultDev, ...developments.filter((d) => d.id !== 'dev_default')]
    for (const p of plots) if (!p.developmentId) p.developmentId = defaultDev.id
  }

  // v2 → v3: stage-tag existing documents, add the new checklist items in
  // template order (preserving any ticks/files on items the user already had),
  // and default the changes log.
  for (const p of plots) {
    if (!Array.isArray(p.changes)) p.changes = []
    const existing = new Map<string, DocumentItem>((p.documents || []).map((d) => [d.key, d]))
    p.documents = DOCUMENT_TEMPLATE.map((t) => {
      const prior = existing.get(t.key)
      return prior
        ? { ...t, ...prior, stage: t.stage, label: t.label, hint: t.hint }
        : { ...t, completed: false }
    })
  }

  return {
    version: CURRENT_VERSION,
    developerName: parsed.developerName || '',
    developerEmail: parsed.developerEmail || undefined,
    showCodeRefs: parsed.showCodeRefs || false,
    lastBackupAt: parsed.lastBackupAt,
    developments,
    plots,
  }
}

/**
 * Parse a backup file's JSON into a valid AppState (running the normal
 * migration so old backups restore cleanly). Returns null if it isn't a
 * recognisable backup.
 */
export function parseBackup(json: string): AppState | null {
  try {
    const parsed = JSON.parse(json) as Partial<AppState>
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.plots)) return null
    return migrate(parsed)
  } catch {
    return null
  }
}

/** Serialise the state for a backup download. */
export function serializeBackup(state: AppState): string {
  return JSON.stringify(state, null, 1)
}

/**
 * Download the whole dataset as a JSON backup file. Everything lives only in
 * this browser, so this file (kept in email/Drive/iCloud) IS the disaster
 * recovery plan — and the way to move data between phone and desktop.
 */
export function downloadBackup(state: AppState): void {
  const stamp = new Date().toISOString().slice(0, 10)
  const blob = new Blob([serializeBackup(state)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nhqb-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.plots)) {
      return emptyState()
    }
    return migrate(parsed)
  } catch {
    return emptyState()
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    // Most likely quota exceeded — photos are stored as data URLs and can be
    // large. Warn once; the app keeps working in memory for this session.
    console.warn('Could not save to localStorage', e)
  }
}

export function id(prefix = ''): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}${Date.now().toString(36)}${rnd}`
}
