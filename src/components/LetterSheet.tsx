/*
 * Letter generator. Pre-fills the Code's required content with the customer's
 * details and the correct legal deadline dates, then hands the user an editable
 * draft — review, tweak the [bracketed] prompts, copy or print. Never a
 * black-box auto-send. Saving the letter also records it on the timeline and
 * actions the matching complaint milestone.
 */

import { useMemo, useState } from 'react'
import { Sheet } from './ui'
import { useStore } from '../state/store'
import { LETTER_MENU, generateLetter } from '../lib/letters'
import type { Issue, Plot } from '../types'

export function LetterSheet({
  plot,
  issue,
  initialKey,
  onClose,
  onDone,
}: {
  plot: Plot
  issue: Issue
  initialKey?: string
  onClose: () => void
  onDone: (msg: string) => void
}) {
  const { state, dispatch } = useStore()
  const [key, setKey] = useState(initialKey || 'acknowledgement')

  const generated = useMemo(
    () => generateLetter(key, state.developerName, plot, issue),
    [key, state.developerName, plot, issue]
  )
  const [body, setBody] = useState(generated.body)

  // Regenerate the editable body when the selected letter changes.
  const [activeKey, setActiveKey] = useState(key)
  if (activeKey !== key) {
    setActiveKey(key)
    setBody(generated.body)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(body)
      onDone('Letter copied to clipboard')
    } catch {
      onDone('Select the text to copy')
    }
  }

  const print = () => {
    const win = window.open('', '_blank', 'width=800,height=1000')
    if (!win) {
      onDone('Allow pop-ups to print')
      return
    }
    win.document.write(
      `<pre style="font:13px/1.6 ui-monospace,Menlo,monospace;white-space:pre-wrap;padding:32px;max-width:720px;margin:auto">${body
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}</pre><script>window.print()</script>`
    )
    win.document.close()
  }

  const save = (toast = 'Letter saved to the record') => {
    dispatch({
      type: 'SAVE_LETTER',
      plotId: plot.id,
      issueId: issue.id,
      milestoneKey: generated.milestoneKey,
      title: generated.title,
      body,
    })
    onDone(toast)
    onClose()
  }

  const email = () => {
    const to = plot.customerEmail || ''
    const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      generated.subject
    )}&body=${encodeURIComponent(body)}`
    // Opens the user's own mail app with the letter pre-filled — they still
    // press send themselves, so nothing goes out unreviewed.
    window.location.href = href
    save('Email opened — letter saved to the record')
  }

  return (
    <Sheet
      title="Draft letter"
      subtitle={`Complaint ${issue.reference || ''} · pre-filled with legal deadlines`}
      onClose={onClose}
    >
      <div className="field">
        <label>Letter type</label>
        <select value={key} onChange={(e) => setKey(e.target.value)}>
          {LETTER_MENU.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Draft (edit anything in [brackets], then send)</label>
        <textarea
          className="letter-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          spellCheck
        />
      </div>

      <div className="wrap-actions" style={{ marginBottom: 12 }}>
        <button className="btn btn-sm btn-primary" onClick={email}>
          ✉ Email to customer
        </button>
        <button className="btn btn-sm" onClick={copy}>
          📋 Copy
        </button>
        <button className="btn btn-sm" onClick={print}>
          🖨 Print / PDF
        </button>
      </div>
      {!plot.customerEmail && (
        <p className="muted" style={{ fontSize: 12, marginTop: -4, marginBottom: 12 }}>
          No customer email saved for this plot — the email will open with a blank "To" box.
          Add it via "Edit details" on the plot screen.
        </p>
      )}

      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
        <button className="btn btn-primary" onClick={() => save()}>
          Save to record
        </button>
      </div>
    </Sheet>
  )
}
