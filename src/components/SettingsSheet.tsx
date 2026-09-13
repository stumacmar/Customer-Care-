/*
 * Settings: developer name, demo data, data protection (GDPR) guidance,
 * 2-year retention housekeeping, and a reset that is deliberately hard to
 * trigger by accident. Still no permission trees, no org config — one small
 * team, one screen.
 */

import { CODE_SOURCE_URL, NHOS_URL, NHQB_DEVELOPERS_EMAIL, NHQB_FEES_URL, NHQB_PORTAL_URL, PCI_CHECKLIST_APARTMENT_URL, PCI_CHECKLIST_HOUSE_URL, QUICK_GUIDE_URL, SNAGGING_GUIDE_URL } from '../lib/codeContent'
import { useRef, useState } from 'react'
import { Sheet } from './ui'
import { useStore } from '../state/store'
import { buildSeedState } from '../lib/seed'
import { letterheadName } from '../lib/letterhead'
import { formatDate, formatDateTime } from '../lib/dates'
import { exportPlotPrintable } from '../lib/export'
import { isPlotDeletable } from '../lib/status'
import { downloadBackup, parseBackup } from '../lib/storage'
import { Icon } from './icons'

export function SettingsSheet({ onClose, onToast }: { onClose: () => void; onToast: (m: string) => void }) {
  const { state, dispatch } = useStore()
  const [name, setName] = useState(state.developerName)
  const [email, setEmail] = useState(state.developerEmail || '')
  const [showGdpr, setShowGdpr] = useState(false)
  const restoreRef = useRef<HTMLInputElement>(null)

  const saveEmail = (v: string) => {
    setEmail(v)
    dispatch({ type: 'SET_DEVELOPER_EMAIL', email: v })
  }

  const backup = () => {
    downloadBackup(state)
    dispatch({ type: 'RECORD_BACKUP' })
    onToast('Backup downloaded — keep it in email, Drive or iCloud')
  }

  const onRestoreFile = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const restored = parseBackup(typeof reader.result === 'string' ? reader.result : '')
      if (!restored) {
        onToast('That file is not a recognisable backup')
        return
      }
      const plots = restored.plots.length
      if (
        !confirm(
          `Restore ${plots} plot${plots === 1 ? '' : 's'} from this backup? ` +
            'Everything currently on this device will be REPLACED by the backup. ' +
            'If in doubt, download a backup of the current data first.'
        )
      )
        return
      dispatch({ type: 'REPLACE_STATE', state: restored })
      onToast('Backup restored')
      onClose()
    }
    reader.readAsText(file)
  }

  const saveName = (v: string) => {
    setName(v)
    dispatch({ type: 'SET_DEVELOPER_NAME', name: v })
  }

  const loadDemo = () => {
    if (state.plots.length && !confirm('Load demo data? This adds a sample development alongside what you have.')) return
    const seed = buildSeedState(state.developerName || 'Meadow Homes Ltd', state.developerEmail)
    dispatch({
      type: 'REPLACE_STATE',
      state: {
        ...seed,
        showCodeRefs: state.showCodeRefs,
        lastBackupAt: state.lastBackupAt,
        developments: [...seed.developments, ...state.developments],
        plots: [...seed.plots, ...state.plots],
      },
    })
    onToast('Demo development added')
    onClose()
  }

  const reset = () => {
    // Deliberately hard to do by accident: explain exactly what happens, then
    // require the word DELETE to be typed.
    const typed = prompt(
      'This permanently wipes EVERY plot, issue, letter and photo stored on this device. ' +
        'It cannot be undone.\n\nExported PDFs/CSVs you saved elsewhere are NOT affected.\n\n' +
        'If you have not exported your plots, cancel and do that first.\n\n' +
        'Type DELETE (in capitals) to confirm:'
    )
    if (typed !== 'DELETE') {
      if (typed !== null) onToast('Not deleted — you must type DELETE exactly')
      return
    }
    dispatch({
      type: 'REPLACE_STATE',
      state: { version: 2, developerName: name, developments: [], plots: [] },
    })
    onToast('All data cleared')
    onClose()
  }

  const deletePlot = (plotId: string, address: string) => {
    if (!confirm(`Delete "${address}" and all its records? Export it first if you have not. This cannot be undone.`)) return
    dispatch({ type: 'DELETE_PLOT', plotId })
    onToast('Plot deleted')
  }

  // Housekeeping: plots whose two-year period has ended (from the later of
  // reservation and legal completion — Code 3.5) with nothing open. They are
  // already archived out of the daily view; here is where the personal data is
  // exported and deleted (data minimisation).
  const oldPlots = state.plots.filter((p) => isPlotDeletable(p))
  const devName = (id: string) => state.developments.find((d) => d.id === id)?.name || ''

  return (
    <Sheet title="Settings" onClose={onClose} autosave>
      <div className="field">
        <label>Developer / company name (appears on letters and exports)</label>
        <input
          value={name}
          onChange={(e) => saveName(e.target.value)}
          placeholder="e.g. Meadow Homes Ltd"
        />
      </div>

      <div className="field">
        <label>Your email — customer reports arrive here (a shared mailbox is best)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => saveEmail(e.target.value)}
          placeholder="e.g. you@yourcompany.co.uk"
        />
      </div>

      <div className="section" style={{ marginTop: 8 }}>
        <h3>Back up &amp; restore</h3>
        <div className="card">
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            Download a backup weekly and keep it in your
            email, Drive or iCloud — it is also how you move your records between phone and
            computer.
            {state.lastBackupAt
              ? ` Last backup: ${formatDateTime(state.lastBackupAt)}.`
              : ' No backup has been taken yet.'}
          </p>
          <div className="wrap-actions">
            <button className="btn btn-sm btn-primary" onClick={backup}>
              <Icon name="file" size={15} /> Download backup
            </button>
            <button className="btn btn-sm" onClick={() => restoreRef.current?.click()}>
              Restore from backup…
            </button>
            <input
              ref={restoreRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={(e) => onRestoreFile(e.target.files?.[0])}
            />
          </div>
        </div>
      </div>

      <div className="section">
        <h3>Code references</h3>
        <div className="card row-between">
          <div style={{ minWidth: 0, paddingRight: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Show clause numbers</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
              The Code is built into every deadline and checklist either way. Turn this on to see
              the clause numbers on screen — useful when demonstrating compliance. They always
              appear in letters and exports.
            </div>
          </div>
          <button
            className={`btn btn-sm ${state.showCodeRefs ? 'btn-primary' : ''}`}
            onClick={() => {
              dispatch({ type: 'SET_CODE_REFS', show: !state.showCodeRefs })
              onToast(state.showCodeRefs ? 'Clause numbers hidden' : 'Clause numbers shown')
            }}
          >
            {state.showCodeRefs ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <div className="section">
        <h3>Data housekeeping</h3>
        <div className="card">
          {oldPlots.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              Nothing needs attention. A plot appears here two years after the later of its
              reservation and legal completion, once nothing is open — the period in which a
              complaint can be referred to the Ombudsman. Export a copy, then delete the
              personal data.
            </p>
          ) : (
            <>
              <p className="muted" style={{ marginTop: 0 }}>
                The two-year period has ended on these plots and nothing is open. Export a
                copy for your files, then delete them — personal data should not be kept longer
                than needed.
              </p>
              <div className="stack">
                {oldPlots.map((p) => (
                  <div key={p.id} className="row-between">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{p.address}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {devName(p.developmentId) ? `${devName(p.developmentId)} · ` : ''}
                        {p.completionDate ? `Legal completion ${formatDate(p.completionDate)}` : p.cancellation ? `Cancelled ${formatDate(p.cancellation.date)}` : `Reserved ${formatDate(p.reservationDate)}`}
                      </div>
                    </div>
                    <div className="wrap-actions">
                      <button
                        className="btn btn-sm"
                        onClick={() => exportPlotPrintable(p, letterheadName(state, p))}
                      >
                        <Icon name="file" size={15} /> Export
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => deletePlot(p.id, p.address)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="section">
        <h3>Data protection (GDPR)</h3>
        <div className="card">
          <button className="linklike" onClick={() => setShowGdpr((s) => !s)}>
            {showGdpr ? 'Hide' : 'Show'} the summary
          </button>
          {showGdpr && (
            <div className="muted" style={{ fontSize: 14, marginTop: 8 }}>
              <p style={{ marginTop: 0 }}>
                <strong>Where the data lives:</strong> everything you enter stays on this device
                only. Nothing is sent to NHQB. Links and reports you send carry the details you
                choose to share. Emailing a letter uses your own email account.
              </p>
              <p>
                <strong>You are the data controller</strong> for your customers' details (names,
                addresses, emails, photos). In practice that means three habits:
              </p>
              <p>
                1. <strong>Store the minimum</strong> — name, address, email. Nothing else is
                needed, so do not add more. Avoid photographing people.
                <br />
                2. <strong>Answer requests</strong> — if a customer asks what you hold, the
                plot's Export gives them everything. If they ask you to erase it (and you no
                longer need it for a live complaint or the two-year period), delete the plot.
                <br />
                3. <strong>Do not keep it forever</strong> — the housekeeping section above
                lists plots once the two-year period has ended and nothing is open. Export
                for your files, then delete.
              </p>
              <p style={{ marginBottom: 0 }}>
                <strong>Losing your phone:</strong> your phone's passcode is the lock on this
                data — keep one set. This note is practical guidance, not legal advice.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <h3>NHQB resources</h3>
        <div className="card" style={{ fontSize: 14, lineHeight: 1.7 }}>
          <a href={CODE_SOURCE_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--link)' }}>The New Homes Quality Code V2 (PDF)</a>
          <br />
          <a href={QUICK_GUIDE_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--link)' }}>A quick guide to the Code (PDF)</a>
          <br />
          <a href={PCI_CHECKLIST_HOUSE_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--link)' }}>Pre-completion inspection checklist — house (PDF)</a>
          <br />
          <a href={PCI_CHECKLIST_APARTMENT_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--link)' }}>Pre-completion inspection checklist — apartment (PDF)</a>
          <br />
          <a href={SNAGGING_GUIDE_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--link)' }}>A Homeowner Guide to Snagging (PDF)</a>
          <br />
          <a href={NHOS_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--link)' }}>New Homes Ombudsman Service — complaints are made through their own portal</a>
          <br />
          <a href={NHQB_PORTAL_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--link)' }}>NHQB developer portal (login)</a>
          <span className="muted"> — Code training for customer-facing staff is completed through the portal (Code 1.6).</span>
          <br />
          <a href={NHQB_FEES_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--link)' }}>Registration fees and New Homes Ombudsman Service (NHOS) complaint charges</a>
          <span className="muted"> — from 1 January 2027 a two-tier NHOS complaint fee applies, paid quarterly in arrears, with the first three complaints each calendar year free (nhqb.org.uk, September 2026).</span>
        </div>
      </div>

      <div className="section">
        <h3>About this app</h3>
        <div className="card muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          <p style={{ marginTop: 0 }}>
            NHQB Plot Tracker is a free tool provided by the New Homes Quality Board to help
            registered developers keep to the New Homes Quality Code. Using it is your choice, and
            it does not replace the Code, your own procedures, or NHQB's audits and attestation.
          </p>
          <p>
            You are the data controller for the customer information you enter. Everything is
            stored on your own device; NHQB does not receive, hold or process it, and accepts no
            responsibility for how the app is used or for any loss or breach of data held on your
            device. Keep backups and follow the data protection guidance above.
          </p>
          <p style={{ marginBottom: 0 }}>
            Problems with the app: <a href={`mailto:${NHQB_DEVELOPERS_EMAIL}`} style={{ color: 'var(--link)' }}>{NHQB_DEVELOPERS_EMAIL}</a>.
            <br />
            <span style={{ fontSize: 12 }}>Wording subject to NHQB legal review.</span>
          </p>
        </div>
      </div>

      <div className="section">
        <h3>Demo</h3>
        <div className="card">
          <p className="muted" style={{ marginTop: 0 }}>
            See the app with a realistic development — a snag due in three days, a live complaint
            mid-procedure, an emergency, plus a finished development with an archived plot.
          </p>
          <button className="btn btn-sm btn-primary" onClick={loadDemo}>
            Load demo data
          </button>
        </div>
      </div>

      <div className="section">
        <h3>Delete everything</h3>
        <div className="card">
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            Wipes every plot, issue, letter and photo on this device. You will be asked to type
            DELETE to confirm. Exports you saved elsewhere are unaffected.
          </p>
          <button className="btn btn-sm btn-danger" onClick={reset}>
            Reset all data
          </button>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
        Data is stored on this device only. Export a plot's record to keep a copy.
      </p>
    </Sheet>
  )
}
