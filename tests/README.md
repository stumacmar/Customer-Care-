# Tests

Run the built app first, then the suites:

```
npm run build && npx vite preview --port 4173 --strictPort   # in one terminal
node tests/core.mjs              # the fixed suite (~1 minute)
node tests/sim.mjs 1 100 3       # 100 seeded simulations, 3 in parallel (~10 minutes)
```

Playwright is needed (`npm install -g playwright`; Chromium at
`/opt/pw-browsers/chromium` or set `CHROMIUM`). Nothing here is a dependency
of the app itself.

**These tests live in the repository on purpose.** An earlier suite was kept
in a scratch directory outside git and was lost when that directory was
cleared. Nothing that is needed to verify or rebuild this app should live
outside this repo again. See Phase 5.8 in the root README.

- `core.mjs` — the access code and its rotation; the product name on every
  surface and the storage keys left untouched; demo data and the dashboard
  ordering; a new plot's cooling-off and exchange-by dates and what the
  customer's page shows; the customer's report link both ways (snag after
  completion, complaint before, emergency), the fallbacks (no plots on the
  phone, no matching plot, paste) and the "Log as" choice; the
  unsaved-typing guard; cancellations and refund deadlines; a major change's
  window from receipt; the complaint ladder and letters; Export PDF;
  housekeeping; persistence and broken links.
- `sim.mjs` — randomised developer-and-customer journeys through the real
  screens, seeded so a failure can be replayed with its seed. Each checks the
  Code's arithmetic at every hand-off and the invariants (no page errors, no
  `undefined`/`NaN`/`Invalid Date`/old name on screen, storage parses, a
  reload keeps every plot). Failure screenshots go to `tests/.failures/`.
- `lib.mjs` — shared helpers; the app-driving helpers come from
  `tools/media/harness.mjs` so the videos and the tests drive the app the
  same way.
