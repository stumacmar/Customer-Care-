/*
 * The Code tab — a searchable copy of the New Homes Quality Code (V2).
 *
 * The developer types a plain question ("how long to fix a snag", "complaint
 * deadlines", "what to hand over at completion") and the relevant clause pops
 * up, with the exact reference so they can cite it. Content is transcribed
 * from the official Code; this screen is a fast index, not legal advice.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  CODE_SECTIONS,
  CODE_SOURCE_URL,
  CODE_VERSION,
  QUICK_ANSWERS,
  type CodeSection,
} from '../lib/codeContent'
import { searchCode } from '../lib/codeSearch'
import { DictationField } from './ui'
import { Icon } from './icons'

/** Quick answers shown before "More questions" is tapped. */
const QUICK_SHOWN = 4

export function CodeSearch({
  openRef,
  onRefConsumed,
}: {
  /** A clause ref (e.g. "2.9") to open directly — the "why?" deep link. */
  openRef?: string | null
  onRefConsumed?: () => void
} = {}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<CodeSection | null>(null)
  const [moreQuestions, setMoreQuestions] = useState(false)

  // The browse list grouped by the Code's own parts, in document order —
  // collapsed by default so the tab fits on a screen instead of scrolling
  // through all thirty-odd sections.
  const parts = useMemo(() => {
    const order: string[] = []
    const byPart = new Map<string, CodeSection[]>()
    for (const s of CODE_SECTIONS) {
      if (!byPart.has(s.part)) {
        byPart.set(s.part, [])
        order.push(s.part)
      }
      byPart.get(s.part)!.push(s)
    }
    return order.map((part) => ({ part, sections: byPart.get(part)! }))
  }, [])

  useEffect(() => {
    if (!openRef) return
    const section = CODE_SECTIONS.find((s) => s.ref === openRef)
    if (section) setOpen(section)
    onRefConsumed?.()
  }, [openRef, onRefConsumed])

  const hits = useMemo(() => searchCode(query), [query])
  const searching = query.trim().length > 0

  if (open) {
    return <SectionDetail section={open} onBack={() => setOpen(null)} />
  }

  return (
    <div className="content">
      <div className="dash-head">
        <h2>The Code</h2>
        <span className="muted" style={{ fontSize: 12 }}>{CODE_VERSION}</span>
      </div>

      <div className="field" style={{ marginBottom: 12 }}>
        <DictationField
          value={query}
          onChange={setQuery}
          placeholder="Ask the Code… e.g. how long to fix a snag"
          rows={2}
        />
      </div>

      {!searching && (
        <>
          <div className="section" style={{ marginTop: 4 }}>
            <h3>Common questions</h3>
            <div className="stack">
              {QUICK_ANSWERS.slice(0, moreQuestions ? undefined : QUICK_SHOWN).map((qa) => (
                <button
                  key={qa.q}
                  className="card"
                  style={{ textAlign: 'left', width: '100%' }}
                  onClick={() => setQuery(qa.q)}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{qa.q}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{qa.a}</div>
                  <div className="ref" style={{ marginTop: 6, color: 'var(--link)' }}>
                    Code {qa.ref} →
                  </div>
                </button>
              ))}
              {!moreQuestions && QUICK_ANSWERS.length > QUICK_SHOWN && (
                <button
                  className="btn btn-sm btn-ghost btn-block"
                  onClick={() => setMoreQuestions(true)}
                >
                  More questions ({QUICK_ANSWERS.length - QUICK_SHOWN})
                </button>
              )}
            </div>
          </div>

          <div className="section">
            <h3>Browse the Code</h3>
            <div className="stack">
              {parts.map(({ part, sections }) => (
                <details key={part} className="guide-item">
                  <summary>
                    <span>
                      {part}
                      <span className="muted" style={{ fontWeight: 400 }}> · {sections.length}</span>
                    </span>
                    <Icon name="arrow-right" size={16} className="guide-chev" />
                  </summary>
                  <div className="guide-body">
                    <div className="stack">
                      {sections.map((s) => (
                        <button
                          key={s.ref}
                          className="card row-between"
                          style={{ textAlign: 'left', width: '100%' }}
                          onClick={() => setOpen(s)}
                        >
                          <span style={{ fontWeight: 700, minWidth: 0 }}>{s.title}</span>
                          <span className="ref" style={{ flex: '0 0 auto' }}>{refLabel(s.ref)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </>
      )}

      {searching && (
        <div className="section" style={{ marginTop: 4 }}>
          <h3>
            {hits.length > 0 ? 'Results' : 'No match'}{' '}
            {hits.length > 0 && <span className="count-pill">{hits.length}</span>}
          </h3>
          {hits.length === 0 ? (
            <div className="card muted">
              Nothing matched “{query}”. Try simpler words — e.g. “snag”, “complaint”, “deposit”,
              “completion”, “emergency”, or a clause number like “3.4”.
            </div>
          ) : (
            <div className="stack">
              {hits.map(({ section, bestPoint }) => (
                <button
                  key={section.ref}
                  className="card"
                  style={{ textAlign: 'left', width: '100%' }}
                  onClick={() => setOpen(section)}
                >
                  <div className="row-between">
                    <span style={{ fontWeight: 700, minWidth: 0 }}>{section.title}</span>
                    <span className="ref" style={{ flex: '0 0 auto' }}>{refLabel(section.ref)}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 12, margin: '2px 0 6px' }}>{section.part}</div>
                  <div style={{ fontSize: 13 }}>{bestPoint || section.summary}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="muted" style={{ fontSize: 12, marginTop: 20 }}>
        Transcribed from the New Homes Quality Code {CODE_VERSION}. A navigation aid, not legal
        advice — always confirm against the{' '}
        <a href={CODE_SOURCE_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--link)' }}>
          official Code
        </a>
        .
      </p>
    </div>
  )
}

function SectionDetail({ section, onBack }: { section: CodeSection; onBack: () => void }) {
  return (
    <div className="content">
      <button className="backbtn" onClick={onBack} style={{ marginBottom: 8 }}>
        ‹ The Code
      </button>
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>{section.title}</h2>
        <span className="badge complaint" style={{ flex: '0 0 auto', marginTop: 4 }}>
          {refLabel(section.ref)}
        </span>
      </div>
      <div className="muted" style={{ margin: '6px 0 4px', fontSize: 13 }}>{section.part}</div>
      <p style={{ marginTop: 8 }}>{section.summary}</p>

      <div className="section" style={{ marginTop: 12 }}>
        <h3>What the Code says</h3>
        <div className="card">
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 10 }}>
            {section.points.map((p, i) => (
              <li key={i} style={{ lineHeight: 1.5 }}>{p}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
        Reference: New Homes Quality Code {CODE_VERSION}, clause {refLabel(section.ref)}. Plain-English
        summary — read the{' '}
        <a href={CODE_SOURCE_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--link)' }}>
          official Code
        </a>{' '}
        for the full wording.
      </p>
    </div>
  )
}

/** Turn internal refs into a friendly label ("3.4", "Principles", "Glossary"). */
function refLabel(ref: string): string {
  if (ref === 'P') return 'Principles'
  if (ref.startsWith('G-')) return 'Glossary'
  return ref
}
