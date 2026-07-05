/*
 * Dead-simple search over the Code sections. No external search library — the
 * corpus is tiny (a few dozen sections), so a transparent scoring function is
 * both fast enough and easy to reason about (which matters when the answer has
 * to be trustworthy).
 */

import { CODE_SECTIONS, type CodeSection } from './codeContent'

export interface SearchHit {
  section: CodeSection
  score: number
  /** The single most relevant point to preview, if the query matched one. */
  bestPoint?: string
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9£ ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)
}

// A few everyday phrasings mapped to the Code's own vocabulary so plain
// questions land on the right clause.
const SYNONYMS: Record<string, string[]> = {
  fix: ['put', 'right', 'repair', 'settle'],
  repair: ['put', 'right', 'settle'],
  deadline: ['days', 'timescale', 'within'],
  letter: ['acknowledgement', 'response', 'closure'],
  email: ['letter'],
  reminder: ['days', 'timescale'],
  handover: ['completion', 'hand'],
  give: ['provide', 'given'],
  docs: ['documents', 'documentation'],
  document: ['documents', 'documentation'],
  refund: ['repay', 'refund'],
  money: ['deposit', 'fee', 'refund'],
  urgent: ['emergency'],
  ombudsman: ['ombudsman', 'nhos'],
  timeframe: ['timescale', 'days'],
  time: ['timescale', 'days'],
}

export function searchCode(query: string): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  // A clause-number query like "3.4" or "2.11" would be stripped away by
  // tokenizing, so match it against refs directly first.
  const looksLikeRef = /^\d+(\.\d+)?$/.test(q)

  let terms = tokenize(q)
  // Expand with synonyms.
  const expanded = new Set(terms)
  for (const t of terms) (SYNONYMS[t] || []).forEach((s) => expanded.add(s))
  terms = [...expanded]
  if (terms.length === 0 && !looksLikeRef) return []

  const hits: SearchHit[] = []
  for (const section of CODE_SECTIONS) {
    const title = section.title.toLowerCase()
    const summary = section.summary.toLowerCase()
    const kw = section.keywords.join(' ').toLowerCase()
    const ref = section.ref.toLowerCase()
    const pointsLower = section.points.map((p) => p.toLowerCase())
    const pointsBlob = pointsLower.join(' ')

    let score = 0
    let bestPoint: string | undefined
    let bestPointScore = 0

    // Clause reference match (e.g. typing "3.4" or "2.11") wins big.
    if (ref === q) score += 100
    else if (looksLikeRef && ref.startsWith(q + '.')) score += 40

    for (const term of terms) {
      if (title.includes(term)) score += 8
      if (summary.includes(term)) score += 4
      if (kw.includes(term)) score += 6
      if (ref.includes(term)) score += 5
      if (pointsBlob.includes(term)) score += 2

      // Track which single point is most relevant, for the preview line.
      pointsLower.forEach((p, i) => {
        if (p.includes(term)) {
          const localScore = (section.points[i].length < 260 ? 2 : 1)
          if (localScore > bestPointScore) {
            bestPointScore = localScore
            bestPoint = section.points[i]
          }
        }
      })
    }

    if (score > 0) hits.push({ section, score, bestPoint })
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, 12)
}
