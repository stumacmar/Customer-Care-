/*
 * Persistence. For the Phase 1 MVP the whole dataset lives in the browser
 * (localStorage) so the app needs no backend and works offline on site. The
 * shape is small — a handful of live plots per developer — so a single JSON
 * blob is plenty. Swapping this module for a real API later touches nothing
 * else.
 */

import type { AppState } from '../types'

const STORAGE_KEY = 'plot-clock-state-v1'

export const CURRENT_VERSION = 1

export function emptyState(): AppState {
  return { version: CURRENT_VERSION, developerName: '', plots: [] }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.plots)) {
      return emptyState()
    }
    return { version: CURRENT_VERSION, developerName: parsed.developerName || '', plots: parsed.plots }
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
