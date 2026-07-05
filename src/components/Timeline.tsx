/*
 * The immutable, auto-timestamped timeline. Every event the reducer recorded,
 * newest first. This is the spine of the audit export.
 */

import { useState } from 'react'
import { formatDateTime } from '../lib/dates'
import type { Plot } from '../types'

export function Timeline({ plot }: { plot: Plot }) {
  const [expanded, setExpanded] = useState(false)
  const events = expanded ? plot.timeline : plot.timeline.slice(0, 6)

  return (
    <div className="section">
      <h3>
        Timeline <span className="count-pill">{plot.timeline.length}</span>
      </h3>
      <div className="card">
        <div className="timeline">
          {events.map((e) => (
            <div key={e.id} className={`tl-item k-${e.type}`}>
              <div className="tl-when">{formatDateTime(e.timestamp)}</div>
              <div className="tl-summary">{e.summary}</div>
              {e.detail && <div className="tl-detail">{e.detail}</div>}
            </div>
          ))}
        </div>
        {plot.timeline.length > 6 && (
          <button className="btn btn-sm btn-ghost btn-block" onClick={() => setExpanded((x) => !x)}>
            {expanded ? 'Show less' : `Show all ${plot.timeline.length} events`}
          </button>
        )}
      </div>
    </div>
  )
}
