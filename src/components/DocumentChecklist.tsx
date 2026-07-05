/*
 * The document checklist — the single most auditable artifact in the product.
 * Tick-and-upload, never free text. "Prove you gave every customer what the
 * Code requires" is answered here, per plot, in one place.
 */

import { useRef, useState } from 'react'
import { useStore } from '../state/store'
import { formatDate } from '../lib/dates'
import type { DocumentItem, Plot } from '../types'

export function DocumentChecklist({ plot }: { plot: Plot }) {
  const done = plot.documents.filter((d) => d.completed).length
  const total = plot.documents.length
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <div className="section">
      <h3>
        Document checklist <span className="count-pill">{done}/{total}</span>
      </h3>
      <div className="doc-progress" aria-label={`${done} of ${total} documents complete`}>
        <div style={{ width: `${pct}%` }} />
      </div>
      <div className="card">
        {plot.documents.map((doc) => (
          <DocRow key={doc.key} plotId={plot.id} doc={doc} />
        ))}
      </div>
    </div>
  )
}

function DocRow({ plotId, doc }: { plotId: string; doc: DocumentItem }) {
  const { dispatch } = useStore()
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState(doc.note || '')
  const fileRef = useRef<HTMLInputElement>(null)

  const toggle = () =>
    dispatch({ type: 'TOGGLE_DOCUMENT', plotId, docKey: doc.key, completed: !doc.completed })

  const saveNote = () => {
    dispatch({ type: 'UPDATE_DOCUMENT', plotId, docKey: doc.key, patch: { note: note.trim() } })
    setShowNote(false)
  }

  const onFile = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () =>
      dispatch({
        type: 'UPDATE_DOCUMENT',
        plotId,
        docKey: doc.key,
        patch: {
          fileName: file.name,
          fileDataUrl: typeof reader.result === 'string' ? reader.result : undefined,
        },
      })
    reader.readAsDataURL(file)
  }

  return (
    <div className={`doc${doc.completed ? ' done' : ''}`}>
      <button
        className={`check${doc.completed ? ' on' : ''}`}
        onClick={toggle}
        aria-pressed={doc.completed}
        aria-label={doc.completed ? `Mark "${doc.label}" not done` : `Mark "${doc.label}" done`}
      >
        ✓
      </button>
      <div className="doc-body">
        <div className="doc-label">{doc.label}</div>
        {doc.hint && <div className="doc-hint">{doc.hint}</div>}

        <div className="doc-meta">
          {doc.completed && <span>✔ {formatDate(doc.completedDate)}</span>}
          {doc.fileName && <span>📎 {doc.fileName}</span>}
          <button className="linklike" onClick={() => fileRef.current?.click()}>
            {doc.fileName ? 'Replace file' : 'Attach file'}
          </button>
          <button className="linklike" onClick={() => setShowNote((s) => !s)}>
            {doc.note ? 'Edit note' : 'Add note'}
          </button>
          <input
            ref={fileRef}
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>

        {doc.note && !showNote && <div className="doc-hint" style={{ marginTop: 4 }}>“{doc.note}”</div>}

        {showNote && (
          <div style={{ marginTop: 8 }}>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Building reg cert not yet issued — chasing local authority"
            />
            <div className="wrap-actions" style={{ marginTop: 6 }}>
              <button className="btn btn-sm btn-primary" onClick={saveNote}>
                Save note
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowNote(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
