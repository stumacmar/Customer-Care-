/*
 * Small shared UI pieces: the bottom sheet, a toast, a photo capture control,
 * and a text field with a dictation hint. Kept together because they are tiny
 * and used everywhere.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Icon } from './icons'

/**
 * The bottom sheet. Closes on the ✕, on Escape, or on a tap outside it. If
 * something has been typed and not yet saved, all three ask first — a sheet
 * that autosaves as you type (Settings) passes `autosave` to skip the check.
 */
export function Sheet({
  title,
  subtitle,
  onClose,
  autosave,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  autosave?: boolean
  children: ReactNode
}) {
  const typed = useRef(false)

  const close = useCallback(() => {
    if (!autosave && typed.current && !confirm('Discard what you have typed?')) return
    onClose()
  }, [autosave, onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [close])

  // Only typing counts — ticking a box or choosing a photo is not "unsaved text".
  const onInput = (e: FormEvent) => {
    const t = e.target as HTMLElement
    if (t.tagName === 'TEXTAREA') typed.current = true
    else if (t.tagName === 'INPUT') {
      const kind = (t as HTMLInputElement).type
      if (!['checkbox', 'radio', 'file', 'button', 'submit', 'range'].includes(kind)) typed.current = true
    }
  }

  return (
    <div className="scrim" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} onInput={onInput} role="dialog" aria-modal="true">
        <div className="sheet-grab" />
        <button className="sheet-close" aria-label="Close" onClick={close}>
          ✕
        </button>
        <h2>{title}</h2>
        {subtitle && <p className="sub">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

let toastTimer: ReturnType<typeof setTimeout> | undefined
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  const show = (m: string) => {
    setMsg(m)
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => setMsg(null), 3500)
  }
  const node = msg ? <div className="toast">{msg}</div> : null
  return { show, node }
}

/** Capture / choose a photo, returned as a data URL (fine for an MVP demo). */
export function PhotoField({
  value,
  onChange,
}: {
  value?: string
  onChange: (dataUrl: string | undefined) => void
}) {
  const [busy, setBusy] = useState(false)

  const onFile = (file?: File) => {
    if (!file) return
    setBusy(true)
    const reader = new FileReader()
    reader.onload = () => {
      onChange(typeof reader.result === 'string' ? reader.result : undefined)
      setBusy(false)
    }
    reader.onerror = () => setBusy(false)
    reader.readAsDataURL(file)
  }

  return (
    <div className="photo-drop">
      {value ? (
        <>
          <img src={value} alt="Logged photo" />
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-sm btn-ghost" onClick={() => onChange(undefined)}>
              Remove photo
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ color: 'var(--text-faint)' }}>
            <Icon name="camera" size={28} strokeWidth={1.7} />
          </div>
          <div>{busy ? 'Loading…' : 'Tap to take or choose a photo'}</div>
          <input
            className="hidden-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => onFile(e.target.files?.[0])}
            aria-label="Take a photo"
          />
        </>
      )}
    </div>
  )
}

/**
 * A plain textarea with a one-line hint pointing at the phone keyboard's own
 * dictation button.
 *
 * We deliberately do NOT use the Web Speech API here: its support is patchy and
 * inconsistent across phones (unreliable on iOS Safari, absent in Firefox) and
 * it could hang the page. Every phone keyboard already has a built-in mic key
 * that dictates into any text field — that is the genuinely device-agnostic
 * way to talk instead of type, so we just point the user at it.
 */
export function DictationField({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ margin: 0 }}>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
      />
      {focused && !value && (
        <div className="dictate-hint" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="mic" size={14} />
          Prefer to talk? Tap the microphone on your keyboard to dictate.
        </div>
      )}
    </div>
  )
}
