# NHQB — Plot Tracker

**Tracks each plot's progress, keeps your customers updated, and keeps you Code compliant — with almost no typing.**

A mobile-first tool for micro-developers (1–5 homes a year) who are registered NHQB developers with no customer-care team and no CRM. It is deliberately **not** a defect-management CRM. It covers the whole journey the New Homes Quality Code attaches to a plot — **from the day the Reservation Agreement is signed to the end of the two-year after-sales window** — and nothing else:

1. **Starts and tracks the Code-mandated clocks** — the 14-day cooling-off (2.3), the exchange-by date (2.2), major-change cancellation windows (2.9), refund deadlines after a cancellation (2.4/2.13), the completion notice period and pre-completion inspection (2.8), and the snag/complaint/emergency clocks after completion (3.3/3.4).
2. **Keeps the auditable, stage-grouped document checklist** every plot must be able to evidence — reservation (2.2), pre-contract & exchange (2.6/2.7), completion & handover (2.11/2.12/3.1).
3. **Keeps the evidence trail** — a Spec & changes log for every buyer choice, paid extra, developer change and delay, with photos, plus the immutable timeline.
4. **Produces the documents** — the five complaint letters, the major-change notice, the delay update, and the full compliance record you'd hand to an NHQB auditor or the New Homes Ombudsman.

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

### The journey: reservation → completion → two years of after-sales

A plot is added the day it is **reserved**. Its stage is derived from dates, never managed by hand: Reserved → Exchanged → Notice served → Completed (→ archived when the two-year Ombudsman window closes), or Cancelled at any point. Each stage carries its own Code clocks:

| Stage | Clocks the app runs | Code |
| --- | --- | --- |
| Reserved | 14-day cooling-off; exchange-by date (defaults to the Code minimum of six weeks) | 2.3 / 2.2m |
| Any pre-completion | Major change → the customer's 14-day cancellation window, during which notice to complete must not be served | 2.9 |
| Cancelled | Refund of the reservation fee within 14 days, or the contract deposit within 28 days | 2.4 / 2.13 |
| Notice served | Warns if the notice period is under 14 calendar days; reminds you to offer the pre-completion inspection | 2.8 |
| Completed | The three log buttons below, for two years | 3.1–3.4 |

### Spec & changes — the evidence trail

Every buyer choice ("front door confirmed: Anthracite grey"), paid extra, developer change and delay is logged in seconds with an optional photo. Logging a **major change** starts the 14-day window automatically and drafts the written notice the Code requires; logging a **delay** offers a timetable-update letter.

### The three things that start a clock

Three impossible-to-miss buttons. Logging any of them takes under 20 seconds — pick type → photo → one-line voice-to-text or typed description → done. The app calculates every downstream deadline itself; the user never needs to know a clause number or do date arithmetic.

| Button | What it starts | Code |
| --- | --- | --- |
| 🔧 **Snag** | 30-day put-right clock | 3.3 |
| 📣 **Complaint** | Formal complaints procedure: acknowledgement (day 5), Path to Resolution (day 10), Assessment & Response (day 30), Eight-Week letter (day 56), then 28-day updates until closed | 3.4 |
| 🚨 **Emergency** | No fixed clock, but flagged **urgent** and visually distinct so it never queues behind routine snags | — |

### Document checklist (auto-generated per plot, grouped by stage)

Created automatically the moment a plot is added, so nothing is forgotten. Tick-and-upload, never free text:

**At reservation (2.2–2.3)** — Reservation Agreement signed and copy given · Affordability Schedule provided

**Pre-contract & exchange (2.6–2.7)** — Pre-contract information to the customer's legal adviser · expected completion date + plan · named contacts in writing · contract of sale terms confirmed (incl. two-year builders' liability and deposit protection)

**Completion & handover (2.8, 2.11–2.12, 3.1)** — Pre-completion inspection offered · Schedule of Incomplete Work (Home) · Schedule of Incomplete Work (Development) · home demonstration · warranty documentation · complaints procedure copy · health & safety file · building regulation completion certificate · after-sales service written statement

The traffic-light only counts documents due by the plot's current stage — a freshly reserved plot isn't "13 documents outstanding" on day one.

### Auto-generated letters

The Code specifies exact required content for five complaint letters. Each generator pre-fills the customer name, address, complaint reference and the correct legal deadline dates, and lays out the Code's required content as editable fields — you review, tweak the `[bracketed]` prompts, then **copy** or **print/PDF**. Never a black-box auto-send. Saving a letter records it on the timeline and ticks off the matching milestone.

- Acknowledgement (day 5)
- Path to Resolution (day 10)
- Assessment & Response (day 30) — settled items, timescales, dispute-resolution route, Ombudsman referral
- Eight-Week letter (day 56)
- Closure
- **Major change notice (2.9)** — the written notice with the customer's 14-day right to cancel
- **Completion timetable update (2.6/2.8)** — the keep-the-customer-informed delay letter

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
- **Phase 3 (done)** — the full journey back to reservation: journey stages and clocks (cooling-off, exchange, major changes, refunds, notice period, PCI), the Spec & changes evidence log, stage-grouped documents, the major-change and delay letters.
- **Phase 4 (done)** — built for the builder with no assistant: a single verb-first **next action** per plot; Code clause numbers hidden by default ("why?" opens the clause; a Settings toggle and the letters/exports keep them for audits); monthly-update reminders on snags delayed past 30 days (3.3); combining a new complaint into an existing one so the timetable runs from the first (3.4); the warranty-provider notification (2.5); calendar reminders for journey deadlines; and JSON backup/restore with a weekly nag — the data lives only on the device, so the backup file is the disaster plan and the way to move between phone and desktop.
- **Phase 5 (done, serverless)** — the buyer-side app, with no backend. "Share with customer" on a plot generates a private link whose **fragment carries the snapshot** (fragments are never sent to the server, so the data goes device-to-device). The buyer's view — installable at the same address — shows their journey, their rights under the Code (cooling-off, PCI, complaint timetable, NHOS), documents received, choices and changes, and issue status with the response deadlines they're entitled to. "Report a problem" produces a pre-addressed email carrying a paste-code; the developer pastes it into "Paste a report from the buyer's app" and it logs with the correct Code timescale. The buyer keeps their own local evidence trail of every report sent.
- **Phase 5.1 (done)** — acting on a review by an experienced Code-body complaints handler. The buyer's three raw log buttons became **one guided "Report a problem" flow**: the buyer says what the issue is about and the app routes it to the correct Code process, so they never need the Code's vocabulary. Pre-completion issues route as formal complaints (snags only arise after completion), and the emergency option is gated to post-completion with the glossary definition and an office-hours caveat. Buyer copy moved to a regulatory register (the 14-day cooling-off named with its count, "solicitor or conveyancer", Path to Resolution explained, complaint days counted from the defined complaint start date, a link to the official Code). Developer side gained a **site-visit log** (attended / no access / turned away, with photo) for attendance disputes, **second-owner mode** (an ownership transfer on a completed plot gives the next buyer link an after-sales-only view), and a **correspondence log** — emails to and from the customer pasted in verbatim with their own date, feeding the timeline and both exports, plus an Android share target so an email can be shared straight from the mail app. "Clock" language became deadlines and timescales throughout. A ten-step annotated **picture guide** ships as `/guide.pdf`, and a **scenario video library** — fifteen short narrated videos, one per Code moment from first setup to Ombudsman escalation, each showing what the developer does and what the buyer sees — lives inside the Guide's manual sections. The library is *generated*, not filmed: one command re-records, re-narrates and re-syncs all fifteen against the current app, so it cannot quietly fall out of date.
- **Phase 5.2 (done)** — language aligned to NHQB's own published material (the homebuyer pages, the Quick Guide to the Code, the Homeowner Guide to Snagging, Your Guide to Buying a New Build Home, A Guide to Settling Into Your New Home). The developer side now says **customer** throughout, as the Code does; the customer's page uses NHQB's question-form headings ("How am I protected?", "Am I covered as the new owner?"), says **legal completion** wherever the two-year cover is described, distinguishes **snags from defects** the way the Snagging guide does, and lists NHQB's emergency examples with the out-of-hours note. Product flourishes were trimmed from the manual and every video script, and the last "clock" and "plain-English" self-descriptions went. A logic review against Code V2 fixed the rule engine: an **expected completion date is now a separate field** from legal completion (a passed expectation no longer silently starts the two-year after-sales period or flips the customer's report routing); issues and cancellations are logged with the **date the customer reported them**, so a complaint pasted in on Tuesday from a Friday email keeps Friday's complaint start date; a delayed snag's first monthly update falls due when the 30 days lapse (3.3) rather than 30 days later; major-change windows stop once a plot completes or cancels; a recorded cancellation is never overwritten; a refunded cancellation with an open complaint stays active; two-year windows end on the anniversary rather than 730 days later; malformed share links and reports are rejected instead of crashing; and the app now warns when notice to complete falls inside a major-change window, when an exchange-by date is earlier than the Code minimum, and when journey dates run out of order. The plot screen lost a block of dates that duplicated the journey strip. Tour, fifteen scenario videos and the picture guide regenerated.
- **Phase 5.3 (done)** — acting on a second review, this time from NHQB. A **major change no longer starts the customer's 14-day window when it is logged**: the draft notice opens with a "call the customer first" prompt, and the window runs from the date the written notice is recorded as sent (emailing, copying or printing it), which is what Code 2.9 says — 14 days from receiving written details. Complaints now carry the **whole exchange, not just the milestone letters**: a note can be added to any open issue (phone calls, agreed visits), and an email can be filed against a specific complaint or snag, with the reference shown on the correspondence and in the export. Sharing a plot is **blocked until an email address is set**, with the advice to use a shared mailbox, because that address is where customer reports arrive. A development can carry a **trading name** that goes on letters, exports and the customer's app in place of the company name, so a group runs subsidiaries and joint ventures from one app. A **"Build update"** entry records progress communications that are not changes. The exchange-by date can carry an **agreed-extension note**. Development cards show the nearest due date. Copy: "no server" became "nothing is uploaded anywhere", "Green = on track, time in hand", NHQB's PCI checklists linked from the customer's page and the Guide, an NHQB resources card in Settings, and the tour's end card reads "Free · Always accessible · Continued Code compliance". Withheld pending NHQB wording: NHOS fees, training and developer-portal links, a support contact, and a legal statement.
- **Phase 6 (the server decision)** — the recurring theme in what remains. A small relay (receive a per-plot BCC'd email or a buyer report, hold it until the developer's app collects it, then delete) would close automatic email capture, live buyer-report delivery, and document delivery to buyers in one build — around £5/month of hosting, but it makes NHQB a data custodian, so it is a governance decision rather than a feature. Beyond that: live sync instead of link snapshots, push notifications, multi-developer accounts, nominated-representative access, photos in buyer reports, and Code-body notifications.

## Compliance note

Deadline calculations and letter content follow the NHQB Code's documented requirements, but this is a tracking aid, not legal advice. Generated letters are drafts for the developer to review and complete before sending.
