/*
 * Share a plot with its buyer. Generates the private buyer link — the plot's
 * details travel inside the link fragment itself (never through a server) —
 * ready to send by email, WhatsApp or text. Sharing is recorded on the
 * timeline so the audit trail shows the buyer was kept informed.
 */

import { useEffect, useState } from 'react'
import { Sheet } from './ui'
import { useStore } from '../state/store'
import { buildSnapshot, buyerLink, encodeShare } from '../lib/share'
import { todayISO } from '../lib/dates'
import { Icon } from './icons'
import type { Plot } from '../types'

export function BuyerShareSheet({
  plot,
  onClose,
  onToast,
}: {
  plot: Plot
  onClose: () => void
  onToast: (msg: string) => void
}) {
  const { state, dispatch } = useStore()
  const [link, setLink] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    encodeShare(buildSnapshot(plot, state.developerName, state.developerEmail, todayISO())).then(
      (code) => {
        if (alive) setLink(buyerLink(code))
      }
    )
    return () => {
      alive = false
    }
  }, [plot, state.developerName, state.developerEmail])

  const record = () => {
    dispatch({
      type: 'ADD_NOTE',
      plotId: plot.id,
      note: 'Buyer link shared — plot progress, documents and issues as of today',
    })
  }

  const copy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      record()
      onToast('Link copied — send it to the buyer')
      onClose()
    } catch {
      onToast('Could not copy — long-press the link to copy it')
    }
  }

  const email = () => {
    if (!link) return
    record()
    const subject = `Your new home at ${plot.address} — progress link`
    const body =
      `Hello ${plot.customerNames || ''},\n\n` +
      `Here is your private link for ${plot.address}. It shows where your purchase is up to, ` +
      `the documents you have received, your choices, and how to report anything to us:\n\n${link}\n\n` +
      `Open it on your phone and choose "Add to Home Screen" to keep it like an app. ` +
      `We will send you a fresh link whenever there is an update.\n\n` +
      `${state.developerName || ''}`
    location.href = `mailto:${encodeURIComponent(plot.customerEmail || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    onToast('Share recorded — opening your email app')
    onClose()
  }

  const preview = () => {
    if (!link) return
    window.open(link, '_blank')
  }

  return (
    <Sheet
      title="Share with the buyer"
      subtitle="A private link showing their home's progress — nothing is uploaded anywhere."
      onClose={onClose}
    >
      <div className="card" style={{ marginBottom: 12 }}>
        <p className="muted" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>
          The link contains a snapshot for <strong>{plot.customerNames || 'the buyer'}</strong>:
          journey dates, documents received, choices and changes, issue status, and how to report
          a problem (which arrives back here ready to log with the right clock).
          Photos are not included. The data lives inside the link itself — send it only to the
          buyer. Share a fresh link after changes.
        </p>
      </div>

      {!state.developerEmail && (
        <div className="card" style={{ marginBottom: 12 }}>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Tip: add your email in Settings first — buyer reports will then arrive pre-addressed
            to you.
          </p>
        </div>
      )}

      <div className="stack" style={{ marginBottom: 12 }}>
        <button className="btn btn-primary btn-block" onClick={copy} disabled={!link}>
          <Icon name="copy" size={16} /> Copy link {link ? '' : '(preparing…)'}
        </button>
        <button className="btn btn-block" onClick={email} disabled={!link}>
          <Icon name="mail" size={16} /> Email it to {plot.customerNames || 'the buyer'}
        </button>
        <button className="btn btn-ghost btn-block" onClick={preview} disabled={!link}>
          Preview what they will see
        </button>
      </div>

      <button className="btn btn-block btn-ghost" onClick={onClose}>
        Done
      </button>
    </Sheet>
  )
}
