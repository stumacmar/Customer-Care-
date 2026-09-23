/*
 * Randomised end-to-end simulations: a developer and their customer, both
 * driven through the real screens, with the Code's arithmetic checked at
 * every hand-off. Each simulation is seeded, so a failure can be replayed.
 *
 *   node tests/sim.mjs <start> <count> [workers]     e.g. node tests/sim.mjs 1 100 3
 *
 * One simulation:
 *   1. Fresh install, unlocked, developer named; one development.
 *   2. 1–3 plots at random stages (reserved / exchanged / notice / completed),
 *      random cooling-off length, documents ticked at random, random log
 *      entries (choice, extra, delay, major change with or without the
 *      written notice, site visit, email), sometimes a cancellation.
 *   3. Share each plot; open the customer's page; check what they see against
 *      the developer's record (journey dates, documents, choices, rights).
 *   4. The customer reports something through the guided flow (a random
 *      category; emergency only once completed). The email is checked, then
 *      the developer taps the link, and the filled-in sheet, the routing, the
 *      dates and the logged issue are checked. Sometimes the paste route is
 *      used instead, or the link is opened on a phone with no plots.
 *   5. A second share: the customer sees the issue on the record with the
 *      right date. Sometimes the issue is resolved, a note added, or a letter
 *      drafted, and the record checked again.
 *   6. Invariants throughout: no page errors, no "undefined"/"NaN"/"Invalid
 *      Date"/old name on any screen, storage always parses, a reload keeps
 *      the same number of plots.
 */
import {
  APP,
  Report,
  addDays,
  body,
  browser,
  closeSheet,
  copyCustomerLink,
  customerReport,
  daysBetween,
  describeCountdown,
  devState,
  formatDate,
  freshApp,
  isoDaysFromToday,
  navigate,
  newPage,
  nextBusinessDay,
  openDevelopment,
  openPlot,
  reportLinkFrom,
  screenProblems,
  scrollSheetTo,
  todayISO,
} from './lib.mjs'

// mulberry32 — small, seedable, good enough.
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)]
const chance = (r, p) => r() < p
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1))

const NAMES = ['Mr & Mrs Patel', 'Ms Okonkwo', 'Dr Hughes', 'Mr Novak & Mr Reid', 'Mrs Grant', 'Mx Taylor', 'Miss Ahmed', "Mr O'Neill"]
const DEVS = ['Meadow Homes Ltd', 'Brook & Vale Developments', 'Hartwell Homes', 'Orchard Row Builders']
const CATEGORIES = ['A problem with the home', 'Money or a refund', 'Choices, extras or specification', 'Timescales or delay', 'A missed appointment', 'Something else']
const PROBLEMS = [
  'Bathroom door catches the frame at the top and will not close.',
  'The kitchen tap drips constantly; sealant behind the sink is lifting.',
  'Scratches on the hallway laminate near the front door.',
  'The reservation fee receipt shows the wrong amount.',
  'The worktop fitted is not the quartz I paid for.',
  'Nobody came for the plumber appointment on Tuesday morning.',
  'Completion has moved twice and nobody has told me why.',
  "It's the paint — patchy on the landing ceiling & flaking by the window. \"Not great.\"",
]

const DOC_LABELS = {
  reservation: ['Reservation Agreement signed, copy given to customer', 'Affordability Schedule provided'],
  pre_contract: [
    'Pre-contract information sent to customer’s legal adviser',
    'Expected completion date + plan/brochure given',
    'Named contacts for questions given in writing',
    'Warranty provider given the customer’s details',
    'Timetable-update process and site-visit safety explained',
    'Deposit and fee protection arrangement in place',
    'Contract of sale terms confirmed compliant',
  ],
  completion: [
    'Pre-completion inspection offered / carried out',
    'New home warranty in place — evidence held',
    'Schedule of Incomplete Work (Home) issued',
    'Schedule of Incomplete Work (Development) issued',
    'Home demonstration appointment provided',
    'Warranty documentation provided',
    'Complaints procedure copy given to customer',
    'Health & safety file provided',
    'Building regulation completion certificate',
    'After-sales service written statement given',
    'Health and safety information for ongoing works given',
  ],
}
/** Internal checks the customer never sees as "documents received". */
const INTERNAL = new Set(['Warranty provider given the customer’s details', 'Contract of sale terms confirmed compliant'])

async function fillDate(page, label, iso) {
  const f = page.locator('.sheet .field', { hasText: label }).first()
  await f.locator('input[type=date]').fill(iso)
}

async function checkScreen(rep, page, where) {
  const t = await body(page)
  const bad = screenProblems(t)
  rep.check(`${where}: no forbidden text`, bad.length === 0, bad.join(','))
  return t
}

async function simulate(seed, b) {
  const r = rng(seed)
  const rep = new Report(`sim ${seed}`)
  const { ctx, page, errors } = await newPage(b)
  const today = todayISO()
  try {
    const developer = pick(r, DEVS)
    await freshApp(page, { demo: false, developerName: developer, email: 'care@example.com', phone: chance(r, 0.7) ? '01234 567890' : '' })
    await page.getByRole('button', { name: '+ Add a development' }).click()
    await page.getByPlaceholder('e.g. Meadow View').fill(`Site ${seed}`)
    await page.getByRole('button', { name: 'Create development' }).click()
    await page.waitForTimeout(200)

    const plots = []
    const n = int(r, 1, 3)
    for (let i = 0; i < n; i++) {
      const p = {
        address: `Plot ${int(r, 1, 40)}${chance(r, 0.3) ? 'A' : ''}, Site ${seed}`,
        customer: pick(r, NAMES),
        reservation: isoDaysFromToday(-int(r, 0, 120)),
        stage: pick(r, ['reserved', 'reserved', 'exchanged', 'notice_served', 'completed']),
        coolingOff: chance(r, 0.25) ? int(r, 15, 28) : 14,
        docs: [],
        changes: [],
      }
      if (p.stage !== 'reserved') p.exchange = addDays(p.reservation, int(r, 14, 50))
      if (p.exchange && p.exchange > today) p.exchange = today
      if (p.stage === 'notice_served' || p.stage === 'completed') p.notice = addDays(p.exchange, int(r, 1, 30))
      if (p.notice && p.notice > today) p.notice = today
      if (p.stage === 'completed') p.completion = addDays(p.notice, int(r, 0, 20))
      if (p.completion && p.completion > today) p.completion = today
      if (p.stage === 'notice_served') p.expected = addDays(p.notice, int(r, 10, 40))
      plots.push(p)

      await page.getByRole('button', { name: '+ Plot' }).click()
      await page.getByPlaceholder('e.g. Plot 3, Meadow View').fill(p.address)
      await page.getByPlaceholder('e.g. Mr & Mrs Patel').fill(p.customer)
      await page.locator('.sheet input[type=date]').fill(p.reservation)
      await page.getByRole('button', { name: 'Create plot' }).click()
      await page.waitForTimeout(250)
      if (p.stage !== 'reserved' || p.coolingOff !== 14) {
        await page.getByRole('button', { name: 'Edit details & dates' }).click()
        if (p.coolingOff !== 14) await page.locator('.sheet .field', { hasText: 'Cooling-off period in days' }).locator('input').fill(String(p.coolingOff))
        if (p.exchange) await fillDate(page, 'Exchange of contracts', p.exchange)
        if (p.notice) await fillDate(page, 'Notice to complete served', p.notice)
        if (p.expected) await fillDate(page, 'Expected completion', p.expected)
        if (p.completion) await fillDate(page, 'Legal completion', p.completion)
        await page.getByRole('button', { name: 'Save' }).click()
        await page.waitForTimeout(250)
      }
      // Documents, at random, within the stages reached.
      const stages = ['reservation']
      if (p.stage !== 'reserved') stages.push('pre_contract')
      if (p.stage === 'notice_served' || p.stage === 'completed') stages.push('completion')
      for (const s of stages) for (const label of DOC_LABELS[s]) if (chance(r, 0.5)) p.docs.push(label)
      for (const label of p.docs) {
        await page.getByRole('button', { name: `Mark "${label}" done` }).click()
        await page.waitForTimeout(60)
      }
      // Log entries.
      const kinds = ['Choice', 'Extra', 'Change', 'Delay', 'Build update', 'Site visit']
      const m = int(r, 0, 3)
      for (let k = 0; k < m; k++) {
        const kind = pick(r, kinds)
        const text = `${kind} ${k} for ${p.customer} — ${pick(r, ['confirmed', 'ordered', 'moved', 'attended', 'no access'])}`
        await page.getByRole('button', { name: 'Log a choice, change, delay, visit or email' }).click()
        await page.locator('.sheet .type-opt', { hasText: kind }).first().click()
        await page.locator('.sheet textarea').fill(text)
        await page.getByRole('button', { name: `Log ${kind.toLowerCase()}` }).click()
        await page.waitForTimeout(200)
        p.changes.push({ kind, text })
        if (kind === 'Delay') {
          if (await page.locator('.sheet').count()) await closeSheet(page)
        }
      }
      if (p.stage !== 'completed' && chance(r, 0.35)) {
        await page.getByRole('button', { name: 'Log a choice, change, delay, visit or email' }).click()
        await page.locator('.sheet .type-opt', { hasText: 'Major change' }).click()
        await page.locator('.sheet textarea').fill('Window moved to the side elevation')
        await page.getByRole('button', { name: 'Log major change' }).click()
        await page.waitForTimeout(400)
        const t = await body(page)
        rep.check('major change opens the written notice', t.includes('Record the notice as received'))
        if (chance(r, 0.6)) {
          p.noticeReceived = isoDaysFromToday(-int(r, 0, 20))
          await page.locator('.sheet .field', { hasText: 'Date the customer received it' }).locator('input').fill(p.noticeReceived)
          await page.getByRole('button', { name: 'Record the notice as received' }).click()
          await page.waitForTimeout(200)
        }
        await closeSheet(page)
        p.changes.push({ kind: 'Major change', text: 'Window moved to the side elevation' })
        const t2 = await body(page)
        if (p.noticeReceived) {
          const cancelBy = addDays(p.noticeReceived, 14)
          const open = cancelBy >= today
          rep.check('major-change window on screen', open ? t2.includes(formatDate(cancelBy)) : t2.includes('record the outcome') || t2.includes('Record the outcome'))
        } else {
          rep.check('major change without notice: the app says so', t2.includes('written notice not yet received') || t2.includes('Send the written notice'))
        }
      }
      if (chance(r, 0.3)) {
        await page.getByRole('button', { name: 'Log a choice, change, delay, visit or email' }).click()
        await page.locator('.sheet .type-opt', { hasText: 'Email' }).click()
        await page.locator('.sheet .type-opt', { hasText: pick(r, ['From the customer', 'To the customer']) }).click()
        await fillDate(page, 'Date the email was sent', isoDaysFromToday(-int(r, 0, 10)))
        await page.locator('.sheet textarea').fill('Hi, just checking on the kitchen visit next week. Thanks.')
        await page.getByRole('button', { name: 'Log email' }).click()
        await page.waitForTimeout(200)
        rep.check('email joins the correspondence', (await body(page)).includes('Correspondence 1') || (await body(page)).includes('Correspondence1'))
      }
      await checkScreen(rep, page, `plot ${i} screen`)
      const t = await body(page)
      // Journey arithmetic on screen.
      if (p.stage === 'reserved') {
        const coolEnd = addDays(p.reservation, Math.max(14, p.coolingOff))
        if (coolEnd >= today) rep.check('cooling-off end shown', t.includes(formatDate(coolEnd)))
        const exBy = addDays(p.reservation, 42)
        rep.check('exchange-by clock: six weeks from reservation', exBy < today ? t.includes('Exchange date passed') : t.includes('Exchange of contracts due') && t.includes(describeCountdown(daysBetween(today, exBy))))
      }
      if (p.stage === 'notice_served') {
        const period = Math.round((new Date(p.expected) - new Date(p.notice)) / 86400000)
        if (period < 14) rep.check('short notice period flagged', t.includes(`Completion notice period is ${period} day`))
        rep.check('PCI prompt unless ticked', p.docs.includes('Pre-completion inspection offered / carried out') ? !t.includes('Offer the pre-completion inspection') : t.includes('Offer the pre-completion inspection'))
      }
      if (p.stage === 'completed') rep.check('completed plot shows no journey deadlines', !t.includes('Exchange of contracts due') && !t.includes('Cooling-off period'))
      await page.getByRole('button', { name: 'Back' }).click()
      await page.waitForTimeout(200)
    }

    // Persistence.
    const stored = await devState(page)
    rep.check('state parses and holds every plot', stored && stored.plots.length === plots.length)
    await page.reload()
    await page.waitForTimeout(300)
    rep.check('reload keeps the plots', (await devState(page)).plots.length === plots.length)
    await page.getByRole('button', { name: 'Settings' }).click()
    rep.check('Settings shows the developer name', (await page.getByPlaceholder('e.g. Meadow Homes Ltd').inputValue()) === developer)
    await closeSheet(page)
    await openDevelopment(page, `Site ${seed}`)

    // The customer's side, for one plot.
    const p = pick(r, plots)
    await openPlot(page, p.address)
    const link = await copyCustomerLink(page)
    await navigate(page, link)
    let t = await checkScreen(rep, page, 'customer page')
    rep.check('customer page: home, customer, developer', t.includes(p.address) && t.includes(p.customer) && t.includes(`built by ${developer}`))
    const visibleDocs = p.docs.filter((d) => !INTERNAL.has(d)).length
    rep.check('customer page: documents received count', t.includes(`${visibleDocs}/18`), `${visibleDocs}/18`)
    rep.check('customer page: journey dates', t.includes(formatDate(p.reservation)) && (!p.exchange || t.includes(formatDate(p.exchange))) && (!p.completion || t.includes(formatDate(p.completion))))
    if (p.stage === 'reserved') {
      const coolEnd = addDays(p.reservation, Math.max(14, p.coolingOff))
      if (coolEnd >= today) rep.check('customer page: cooling-off end', t.includes(`until ${formatDate(coolEnd)}`))
      else rep.check('customer page: cooling-off over, not shown', !t.includes('You are in your cooling-off period'))
    }
    if (p.stage === 'completed') rep.check('customer page: after-sales two years', t.includes('after-sales service runs for at least 2 years'))
    if (p.stage === 'notice_served') rep.check('customer page: right to inspection', t.includes('right to a pre-completion inspection'))
    if (p.changes.length) rep.check('customer page: choices & changes count', t.includes(`Choices & changes ${p.changes.length}`) || t.includes(`Choices & changes${p.changes.length}`))
    if (p.noticeReceived && p.stage !== 'completed' && addDays(p.noticeReceived, 14) >= today) rep.check('customer page: major change cancel-by', t.includes(`until ${formatDate(addDays(p.noticeReceived, 14))}`))

    // Report a problem.
    await page.getByRole('button', { name: /Report a problem/ }).click()
    await page.waitForTimeout(200)
    t = await body(page)
    rep.check('emergency offered only after completion', t.includes('Emergency — immediate threat') === (p.stage === 'completed'))
    await closeSheet(page)
    const emergency = p.stage === 'completed' && chance(r, 0.25)
    const category = pick(r, CATEGORIES)
    const text = pick(r, PROBLEMS)
    const email = await customerReport(page, { category, text, emergency })
    const expectedType = emergency ? 'emergency' : category === 'A problem with the home' && (p.stage === 'notice_served' || p.stage === 'completed') ? 'snag' : 'complaint'
    const heading = emergency ? 'Emergency' : category
    rep.check('email: reads as an email, names the app, ends with the link', email.startsWith('Hi,') && email.includes('New Home Tracker') && /Developer: tap this link to log it in New Home Tracker\.\n\S+#\/report\/v1\./.test(email))
    rep.check('email: the words, and the category when it is not the home', email.includes(text) && (category === 'A problem with the home' || emergency ? !email.includes('[About:') : email.includes(`[About: ${category}]`)))
    t = await body(page)
    rep.check('customer keeps their own copy', t.includes('Your reports') && t.includes(text.slice(0, 30)))
    rep.check('customer record labels the type the Code way', t.includes(expectedType === 'snag' ? 'Snag or defect' : expectedType === 'complaint' ? 'Complaint' : 'Emergency'))
    void heading

    // The developer's side: link, or paste, or a phone with no plots.
    const route = pick(r, ['link', 'link', 'link', 'paste', 'noplots'])
    const rl = reportLinkFrom(email)
    if (route === 'noplots') {
      const saved = await devState(page)
      await page.evaluate(() => localStorage.removeItem('plot-clock-state-v1'))
      await navigate(page, rl)
      await page.waitForTimeout(400)
      t = await body(page)
      rep.check('no plots: report shown with Copy', t.includes('This phone has no plots in New Home Tracker') && t.includes(text))
      await page.evaluate(([s]) => localStorage.setItem('plot-clock-state-v1', JSON.stringify(s)), [saved])
    }
    if (route === 'paste') {
      await navigate(page, APP)
      await openDevelopment(page, `Site ${seed}`)
      await openPlot(page, p.address)
      await page.getByRole('button', { name: /^Snag/ }).click()
      await page.locator('.sheet textarea').fill(email)
      await page.waitForTimeout(400)
    } else {
      await navigate(page, rl)
      await page.waitForTimeout(500)
    }
    t = await body(page)
    const sheetTitle = { snag: 'Log a snag or defect', complaint: 'Log a complaint', emergency: 'Log an emergency' }[expectedType]
    rep.check(`developer sheet routed as ${expectedType} (${route})`, t.includes(sheetTitle), t.match(/Log an? [a-z ]+/)?.[0])
    const desc = await page.locator('.sheet textarea').inputValue()
    rep.check("developer sheet: customer's words and date", desc.includes(text) && desc.includes(`sent ${formatDate(today)}`))
    rep.check('developer sheet: on the right plot', t.includes(p.address))
    await page.getByRole('button', { name: /^Log (snag|complaint|emergency)$/ }).click()
    await page.waitForTimeout(400)
    t = await checkScreen(rep, page, 'plot after logging')
    const ref = { snag: 'S-001', complaint: 'C-001', emergency: 'E-001' }[expectedType]
    rep.check('issue logged with a reference', t.includes(ref))
    if (expectedType === 'snag') rep.check('snag: 30 days from the report', t.includes(`due ${formatDate(addDays(today, 30))}`))
    if (expectedType === 'complaint') {
      const start = nextBusinessDay(today)
      rep.check('complaint: day 5 from the complaint start date', t.includes(formatDate(addDays(start, 5))) && t.includes(formatDate(addDays(start, 56))))
    }
    if (expectedType === 'emergency') rep.check('emergency: urgent, top of the plot', t.includes(`Deal with the emergency (${ref})`))
    const state2 = await devState(page)
    const plot2 = state2.plots.find((x) => x.address === p.address)
    const issue = plot2.issues[0]
    rep.check('stored issue matches', issue && issue.type === expectedType && issue.description.includes(text) && (expectedType !== 'complaint' || issue.startedAt === nextBusinessDay(today)))

    // Follow-up, at random.
    const follow = pick(r, ['none', 'resolve', 'note', 'letter', 'reshare'])
    if (follow === 'resolve') {
      await page.getByRole('button', { name: expectedType === 'complaint' ? 'Close complaint' : 'Mark resolved' }).click()
      await page.locator('.card textarea').first().fill('Put right by the site team.')
      await page.getByRole('button', { name: 'Confirm resolved' }).click()
      await page.waitForTimeout(200)
      rep.check('resolved shows as resolved', (await body(page)).includes('Marked resolved'))
    } else if (follow === 'note') {
      await page.getByRole('button', { name: 'Add a note' }).click()
      await page.locator('.card textarea').first().fill('Phoned the customer 10:15 — plumber Thursday.')
      await page.getByRole('button', { name: 'Add to the record' }).click()
      await page.waitForTimeout(200)
      rep.check('note joins the issue record', (await body(page)).includes('Phoned the customer 10:15'))
    } else if (follow === 'letter' && expectedType === 'complaint') {
      await page.getByRole('button', { name: 'Draft', exact: true }).first().click()
      await page.waitForTimeout(200)
      const letter = await page.locator('.sheet textarea').inputValue()
      rep.check('acknowledgement letter carries the customer and the dates', letter.includes(p.customer) && letter.includes(formatDate(addDays(nextBusinessDay(today), 10))))
      await page.getByRole('button', { name: 'Save to record' }).click()
      await page.waitForTimeout(200)
      rep.check('milestone actioned: acknowledgement done today', (await body(page)).includes(`Done ${formatDate(today)}`))
    }
    // The customer sees the issue on the record.
    const link2 = await copyCustomerLink(page)
    await navigate(page, link2)
    t = await checkScreen(rep, page, 'customer page after logging')
    rep.check("customer: issue on the developer's record", t.includes("On your developer's record") && t.includes(text.slice(0, 40)))
    if (expectedType === 'snag' && follow !== 'resolve') rep.check('customer: put-right date matches', t.includes(`Should be put right by ${formatDate(addDays(today, 30))}`))
    if (expectedType === 'complaint' && follow !== 'resolve') {
      const ackDue = `You should receive this by ${formatDate(addDays(nextBusinessDay(today), 5))}`
      rep.check(follow === 'letter' ? 'customer: acknowledgement shown as received' : 'customer: acknowledgement by day 5', follow === 'letter' ? t.includes('Received') && !t.includes(ackDue) : t.includes(ackDue))
    }
    if (follow === 'resolve') rep.check('customer: shows resolved', t.includes('resolved'))

    // Sometimes the sale falls through.
    if (p.stage !== 'completed' && chance(r, 0.3)) {
      await navigate(page, APP)
      await openDevelopment(page, `Site ${seed}`)
      await openPlot(page, p.address)
      await page.getByRole('button', { name: 'Edit details & dates' }).click()
      await scrollSheetTo(page, page.getByRole('heading', { name: 'If the customer pulls out' }))
      const contract = p.stage !== 'reserved' && chance(r, 0.5)
      await page.getByRole('button', { name: contract ? 'Contract cancelled' : 'Reservation cancelled' }).click()
      await page.waitForTimeout(300)
      t = await body(page)
      rep.check('cancellation starts the refund deadline', t.includes(contract ? 'Refund contract deposit' : 'Refund reservation fee') && t.includes(contract ? 'due in 28 days' : 'due in 14 days') && t.includes(`cancelled — ${formatDate(today)}`))
    }
    rep.check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
  } catch (e) {
    const lines = String(e).split('\n')
    const waiting = lines.find((l) => /waiting for/.test(l)) || ''
    rep.check('simulation ran to the end', false, (lines[0] + ' ' + waiting.trim()).slice(0, 300))
    try {
      await page.screenshot({ path: `tests/.failures/sim-${seed}.png` })
    } catch {
      /* no screenshot */
    }
  }
  await ctx.close()
  return rep
}

const [startArg = '1', countArg = '10', workersArg = '3'] = process.argv.slice(2)
const start = Number(startArg)
const count = Number(countArg)
const workers = Number(workersArg)
const seeds = Array.from({ length: count }, (_, i) => start + i)
const { mkdirSync } = await import('node:fs')
mkdirSync('tests/.failures', { recursive: true })

const results = []
let next = 0
async function worker() {
  const b = await browser()
  while (next < seeds.length) {
    const seed = seeds[next++]
    const t0 = Date.now()
    const rep = await simulate(seed, b)
    results.push({ seed, pass: rep.pass, fails: rep.fails, secs: Math.round((Date.now() - t0) / 1000) })
    console.log(`— sim ${seed}: ${rep.pass} passed, ${rep.fails.length} failed (${Math.round((Date.now() - t0) / 1000)}s)`)
  }
  await b.close()
}
await Promise.all(Array.from({ length: workers }, worker))

const failed = results.filter((x) => x.fails.length)
const checks = results.reduce((a, x) => a + x.pass + x.fails.length, 0)
console.log(`\n${results.length} simulations, ${checks} checks, ${failed.length} simulations with failures`)
for (const f of failed) console.log(`  seed ${f.seed}:\n    ${f.fails.join('\n    ')}`)
process.exitCode = failed.length ? 1 : 0
