/*
 * Draft the written notices the Code requires before completion: the major
 * change notice (2.9) and the completion timetable update (2.6/2.8). Same
 * pattern as the complaint letters — an editable draft the developer checks
 * and sends themselves; saving records it on the plot's timeline.
 */

import { useMemo, useState } from 'react'
import { Sheet } from './ui'
import { useStore } from '../state/store'
import { delayUpdateLetter, majorChangeLetter } from '../lib/letters'
import { letterheadName } from '../lib/letterhead'
import { formatDate, todayISO } from '../lib/dates'
import { majorChangeCancelBy } from '../lib/code'
import { Icon } from './icons'
import type { ChangeRecord, Plot } from '../types'

export function ChangeLetterSheet({
  plot,
  change,
  onClose,
  onToast,
}: {
  plot: Plot
  change: ChangeRecord
  onClose: () => void
  onToast: (msg: string) => void
}) {
  const { state, dispatch } = useStore()
  const from = letterheadName(state, plot)
  const draft = useMemo(
    () =>
      change.kind === 'delay'
        ? delayUpdateLetter(from, plot, change)
        : majorChangeLetter(from, plot, change),
    [from, plot, change]
  )
  const [body, setBody] = useState(draft.body)
  const [sentOn, setSentOn] = useState(todayISO())
  const isMajor = change.kind === 'major_change'
  const cancelBy = majorChangeCancelBy(change)

  const record = () => {
    dispatch({
      type: 'SAVE_LETTER',
      plotId: plot.id,
      issueId: change.id,
      milestoneKey: change.kind === 'delay' ? 'delay_update' : 'major_change_notice',
      title: draft.title,
      body,
    })
    // Sending the major-change notice is what starts the customer's 14-day
    // window (Code 2.9) — record the date it went.
    if (isMajor && !change.noticeSentOn) {
      dispatch({ type: 'RECORD_NOTICE_SENT', plotId: plot.id, changeId: change.id, date: sentOn || todayISO() })
    }
  }

  const email = () => {
    record()
    const to = plot.customerEmail || ''
    location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(body)}`
    onToast('Letter recorded — opening your email app')
  }

  const copy = async () => {
    record()
    try {
      await navigator.clipboard.writeText(body)
      onToast('Letter recorded and copied')
    } catch {
      onToast('Letter recorded — copy failed, select the text instead')
    }
  }

  const print = () => {
    record()
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${draft.title}</title></head><body><pre style="font:13px/1.55 ui-monospace,Menlo,monospace;white-space:pre-wrap;margin:32px;">${body.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre><script>window.print()</script></body></html>`
    )
    win.document.close()
  }

  return (
    <Sheet title={draft.title} subtitle="Check it, fill anything in [brackets], then send." onClose={onClose}>
      {isMajor && !change.noticeSentOn && (
        <div className="card" style={{ marginBottom: 12, borderLeft: '4px solid var(--accent)' }}>
          <strong>Call the customer first.</strong>{' '}
          <span className="muted">
            Have the conversation, then send this notice. A letter should never be the first the
            customer hears of a major change.
          </span>
        </div>
      )}
      {isMajor && change.noticeSentOn && (
        <p className="muted" style={{ fontSize: 12.5, marginTop: 0 }}>
          Written notice sent {formatDate(change.noticeSentOn)} — the customer may cancel until{' '}
          {cancelBy ? formatDate(cancelBy) : '—'}.
        </p>
      )}
      <div className="field">
        <label>Draft (edit anything in [brackets], then send)</label>
        <textarea className="letter-body" value={body} onChange={(e) => setBody(e.target.value)} spellCheck />
      </div>

      {isMajor && !change.noticeSentOn && (
        <div className="field">
          <label>Date sent (if posting, the date it goes in the post)</label>
          <input type="date" value={sentOn} max={todayISO()} onChange={(e) => setSentOn(e.target.value)} />
        </div>
      )}
      <div className="wrap-actions" style={{ marginBottom: 12 }}>
        <button className="btn btn-sm btn-primary" onClick={email}>
          <Icon name="mail" size={16} /> Email to customer
        </button>
        <button className="btn btn-sm" onClick={copy}>
          <Icon name="copy" size={16} /> Copy
        </button>
        <button className="btn btn-sm" onClick={print}>
          <Icon name="printer" size={16} /> Print / PDF
        </button>
      </div>
      {!plot.customerEmail && (
        <p className="muted" style={{ fontSize: 12, marginTop: -4, marginBottom: 12 }}>
          No customer email saved for this plot — the email will open with a blank "To" box.
          Add it via "Edit details" on the plot screen.
        </p>
      )}
      {isMajor && (
        <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
          Code 2.9: the customer's 14-day cancellation window runs from the day they{' '}
          <strong>receive</strong> written details. Emailing, copying or printing this records
          it as sent and starts the window. Do not serve notice to complete until the window
          has closed.
        </p>
      )}
      <button className="btn btn-block" onClick={onClose}>
        Done
      </button>
    </Sheet>
  )
}
