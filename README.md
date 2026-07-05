# Plot Clock — NHQB Code Compliance Tracker

**Every property has a clock. This app tells you what's due, when, and gives you the paperwork to prove you did it — with almost no typing.**

A mobile-first tool for micro-developers (1–5 homes a year) who are registered NHQB developers with no customer-care team and no CRM. It is deliberately **not** a defect-management CRM. It does exactly three things the New Homes Quality Board (NHQB) Code actually requires of a small developer, and nothing else:

1. **Starts and tracks the Code-mandated clocks** the moment an issue is logged.
2. **Keeps the auditable document checklist** every plot must be able to evidence.
3. **Produces the documents** — the five complaint letters and the full compliance record — you'd hand to an NHQB auditor or the New Homes Ombudsman.

Anything that smelled like enterprise CRM creep (sales pipelines, lead scoring, BI dashboards, permission trees, contractor modules) was intentionally left out.

---

## The core idea: organise around the plot, not the contact

Traditional CRMs organise around people. The Code's obligations attach to the **property**, so every plot gets one screen. Everything lives there: the document checklist, the live clocks, the immutable timeline, the letters, and the export.

### The traffic-light dashboard

One home screen, one row per plot. Colour does the work so it's readable standing on site in two seconds:

- 🟢 **Green** — no open clocks, all documents complete
- 🟠 **Amber** — something due within 5 days
- 🔴 **Red** — something overdue, or an open emergency

Rows sort worst-first, so anything on fire is at the top.

### The three things that start a clock

Three impossible-to-miss buttons. Logging any of them takes under 20 seconds — pick type → photo → one-line voice-to-text or typed description → done. The app calculates every downstream deadline itself; the user never needs to know a clause number or do date arithmetic.

| Button | What it starts | Code |
| --- | --- | --- |
| 🔧 **Snag** | 30-day put-right clock | 3.3 |
| 📣 **Complaint** | Formal complaints procedure: acknowledgement (day 5), Path to Resolution (day 10), Assessment & Response (day 30), Eight-Week letter (day 56), then 28-day updates until closed | 3.4 |
| 🚨 **Emergency** | No fixed clock, but flagged **urgent** and visually distinct so it never queues behind routine snags | — |

### Document checklist (auto-generated per plot)

Created automatically the moment a plot is added, so nothing is forgotten (Code 2.11 / 3.1). Tick-and-upload, never free text:

- Schedule of Incomplete Work (Home) issued
- Pre-completion inspection offered / carried out
- Home demonstration completed
- Warranty documentation provided
- Complaints procedure copy given to customer
- Health & safety file provided
- Building regulation completion certificate (or a note explaining why not yet available)
- After-sales service written statement given

### Auto-generated letters

The Code specifies exact required content for five complaint letters. Each generator pre-fills the customer name, address, complaint reference and the correct legal deadline dates, and lays out the Code's required content as editable fields — you review, tweak the `[bracketed]` prompts, then **copy** or **print/PDF**. Never a black-box auto-send. Saving a letter records it on the timeline and ticks off the matching milestone.

- Acknowledgement (day 5)
- Path to Resolution (day 10)
- Assessment & Response (day 30) — settled items, timescales, dispute-resolution route, Ombudsman referral
- Eight-Week letter (day 56)
- Closure

### Audit export (the safety net)

One button per plot: **Export compliance record**, as a clean printable PDF or a CSV of the timeline. Includes the document checklist status, every issue and clock, every letter, and the full immutable timeline — ready to hand to the NHQB compliance team (who require a response within 30 days), the Ombudsman, or your insurer.

---

## Tech

Deliberately lightweight, matching the audience (a handful of live plots, one small team):

- **React + TypeScript PWA**, installable on a phone home screen, offline-first (hand-written service worker) for use on site with no signal.
- **Browser storage** (localStorage) — the Phase 1 MVP needs no backend or database. The persistence layer (`src/lib/storage.ts`) is isolated so it can be swapped for a real API later without touching anything else.
- **Photo-first, voice-to-text logging** (Web Speech API where supported) to minimise typing.
- **Zero runtime dependencies** beyond React. No SSO, no auth, no build-time PWA plugin.

### Project layout

```
src/
  types.ts              Domain model (Plot, Issue, DocumentItem, TimelineEvent…)
  lib/
    code.ts             The Code rules: document template, complaint milestones, clock maths
    dates.ts            ISO date helpers + countdown phrasing
    status.ts           Traffic-light (RAG) computation
    letters.ts          The five letter generators
    export.ts           CSV + printable compliance record
    speech.ts           Voice-to-text helper
    storage.ts          localStorage persistence
    seed.ts             One-tap demo dataset
  state/store.tsx       Reducer + context; every mutation appends an immutable timeline event
  components/           Dashboard, PlotScreen, the log/letter/settings sheets, checklist, timeline
```

The immutable timeline is enforced in one place: screens never write to it directly — they dispatch an action and the reducer records the event. That is what makes the export trustworthy.

## Running it

```bash
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build
```

Open **Settings → Load demo plots** to see the app populated with a green plot, an amber plot (snag mid-countdown) and a red plot (live complaint + open emergency) — no typing required.

## Roadmap

- **Phase 1 (done)** — dashboard, three log buttons, auto-calculated clocks, document checklist, timeline, browser storage, PWA.
- **Phase 2 (done)** — the five letter generators, audit export (PDF + CSV).
- **Phase 3 (if there's appetite)** — multi-developer accounts with isolated data and simple subscription billing. That's the point it becomes a real product decision rather than a personal tool.

## Compliance note

Deadline calculations and letter content follow the NHQB Code's documented requirements, but this is a tracking aid, not legal advice. Generated letters are drafts for the developer to review and complete before sending.
