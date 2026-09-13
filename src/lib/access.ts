/*
 * The access code. Plot Tracker is free to NHQB-registered developers, so
 * the developer's side asks once for the code NHQB publishes in its
 * developer portal. The code never leaves the phone: it is normalised
 * (upper-case, letters and digits only), hashed with SHA-256, compared with
 * the hashes below, and the hash is remembered in localStorage.
 *
 * Rotating the code each year is one line: add the new code's hash with the
 * last day it is valid. Keep the old lines so the app can tell a developer
 * "that code has expired" rather than "not recognised".
 *
 * To hash a new code:  echo -n NHQBPLOT2027 | sha256sum
 */

export const ACCESS_KEY = 'plot-clock-access'

export type AccessStatus = 'ok' | 'expired' | 'unknown'

export const ACCESS_CODES: { hash: string; validUntil: string; label: string }[] = [
  // NHQB-PLOT-2026 — the launch code, valid through January 2027 to cover the change of year.
  { hash: '57b9b7721f58c0de65cabe0a3b67211320525eb6563f79ccc431f8a990b154c8', validUntil: '2027-01-31', label: '2026' },
  // NHQB-PILOT-2025 — the pilot code, now expired; kept so the message is "expired", not "unknown".
  { hash: '693ba46845d430252e2bfa6922b113f9dfbf14b58982f1c8062a862f07e94728', validUntil: '2025-12-31', label: '2025 pilot' },
]

/** Upper-case letters and digits only, so "nhqb plot 2026" and "NHQB-PLOT-2026" are the same code. */
export function normaliseCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/** SHA-256 of a normalised code, as lower-case hex. Empty if the browser cannot hash (never matches). */
export async function hashCode(normalised: string): Promise<string> {
  try {
    const bytes = new TextEncoder().encode(normalised)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    return ''
  }
}

export function statusForHash(hash: string | null, today: string): AccessStatus {
  if (!hash) return 'unknown'
  const entry = ACCESS_CODES.find((c) => c.hash === hash)
  if (!entry) return 'unknown'
  return today <= entry.validUntil ? 'ok' : 'expired'
}

export function storedAccess(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY)
  } catch {
    return null
  }
}

export function rememberAccess(hash: string): void {
  try {
    localStorage.setItem(ACCESS_KEY, hash)
  } catch {
    /* private browsing — the code is asked for again next time */
  }
}
