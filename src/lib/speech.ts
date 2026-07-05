/*
 * Voice-to-text helper (Web Speech API).
 *
 * Minimal typing anywhere is a core requirement — this is used standing outside
 * a house, not at a desk. Where the browser supports speech recognition we let
 * the user dictate a one-line description; where it doesn't, callers fall back
 * to the keyboard silently.
 */

type SpeechResultHandler = (transcript: string) => void

interface RecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: any) => void) | null
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function getRecognitionCtor(): (new () => RecognitionLike) | null {
  const w = window as any
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function isSpeechSupported(): boolean {
  return getRecognitionCtor() !== null
}

/**
 * Start a one-shot dictation. Returns a stop() function, or null if speech
 * recognition is unavailable.
 */
export function startDictation(
  onResult: SpeechResultHandler,
  onDone?: () => void,
  onError?: (message: string) => void
): (() => void) | null {
  const Ctor = getRecognitionCtor()
  if (!Ctor) return null

  const rec = new Ctor()
  rec.lang = 'en-GB'
  rec.interimResults = true
  rec.continuous = false

  let finalText = ''
  rec.onresult = (e: any) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const chunk = e.results[i][0].transcript
      if (e.results[i].isFinal) finalText += chunk
      else interim += chunk
    }
    onResult((finalText + interim).trim())
  }
  rec.onerror = (e: any) => {
    onError?.(e?.error || 'speech-error')
  }
  rec.onend = () => {
    onDone?.()
  }

  try {
    rec.start()
  } catch {
    return null
  }
  return () => {
    try {
      rec.stop()
    } catch {
      /* noop */
    }
  }
}
