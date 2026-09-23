/*
 * The turnstile. New Home Tracker is free to NHQB-registered developers, so the
 * developer's side asks once for the access code NHQB publishes in its
 * developer portal. The code is checked on the phone against a hash and
 * remembered there; nothing is sent anywhere. Customers' links never pass
 * through here, and the Guide stays open as the shop window.
 */

import { useState } from 'react'
import { hashCode, normaliseCode, statusForHash, type AccessStatus } from '../lib/access'
import { todayISO } from '../lib/dates'
import { NHQB_PORTAL_URL } from '../lib/codeContent'
import { BrandMark } from './Brand'

const MESSAGE: Record<Exclude<AccessStatus, 'ok'>, string> = {
  unknown: 'That code is not recognised. Check the developer portal for the current code.',
  expired: 'That code has expired. The current code is in the developer portal.',
}

export function AccessGate({
  initialStatus,
  onUnlocked,
  onOpenGuide,
}: {
  /** 'expired' when a code that used to work has run out — say so rather than "not recognised". */
  initialStatus?: 'expired'
  onUnlocked: (hash: string) => void
  onOpenGuide: () => void
}) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<Exclude<AccessStatus, 'ok'> | null>(initialStatus || null)
  const [checking, setChecking] = useState(false)

  const submit = async () => {
    const normalised = normaliseCode(code)
    if (!normalised) return
    setChecking(true)
    const hash = await hashCode(normalised)
    const result = statusForHash(hash, todayISO())
    setChecking(false)
    if (result === 'ok') onUnlocked(hash)
    else setStatus(result)
  }

  return (
    <div className="content">
      <div className="section" style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <BrandMark size={40} className="brand-mark" />
          <div>
            <div style={{ fontWeight: 800, letterSpacing: '0.16em', fontSize: 16 }}>NHQB</div>
            <div className="muted" style={{ fontSize: 12 }}>New Home Tracker</div>
          </div>
        </div>
        <h2 style={{ fontSize: 24, margin: '0 0 8px' }}>For NHQB-registered developers</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          New Home Tracker is free to developers registered with the New Homes Quality Board. Enter
          the access code from the NHQB developer portal. It stays on this phone; nothing is sent
          to NHQB.
        </p>
        <div className="card">
          <div className="field">
            <label htmlFor="access-code">Access code</label>
            <input
              id="access-code"
              value={code}
              placeholder="Access code"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                setCode(e.target.value)
                setStatus(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit()
              }}
            />
            {status && (
              <div className="dictate-hint" style={{ color: 'var(--red)' }}>
                {MESSAGE[status]}
              </div>
            )}
          </div>
          <button className="btn btn-primary btn-block" onClick={() => void submit()} disabled={!normaliseCode(code) || checking}>
            Continue
          </button>
          <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
            The code is in the{' '}
            <a href={NHQB_PORTAL_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--link)' }}>
              NHQB developer portal
            </a>
            . Not registered yet? Registration is through the same portal.
          </p>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          Want to see it first? The Guide has a two-minute tour and short videos of every step.
        </p>
        <button className="btn btn-block" onClick={onOpenGuide}>
          Guide and videos
        </button>
      </div>
    </div>
  )
}
