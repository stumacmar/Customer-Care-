/*
 * Persistence. For the Phase 1 MVP the whole dataset lives in the browser
 * (localStorage) so the app needs no backend and works offline on site. The
 * shape is small — a handful of live plots per developer — so a single JSON
 * blob is plenty. Swapping this module for a real API later touches nothing
 * else.
 */

import type { AppState, Development, Plot } from '../types'

const STORAGE_KEY = 'plot-clock-state-v1'

export const CURRENT_VERSION = 2

export function emptyState(): AppState {
  return { version: CURRENT_VERSION, developerName: '', developments: [], plots: [] }
}

/**
 * Bring any older saved state up to the current shape without losing data.
 * v1 had a flat list of plots with no developments — migrate those into one
 * default development so existing users keep every plot, issue and letter.
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

  return {
    version: CURRENT_VERSION,
    developerName: parsed.developerName || '',
    developments,
    plots,
  }
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
