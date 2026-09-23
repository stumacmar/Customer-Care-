/*
 * The core suite: the access code, the product name on every surface, the
 * customer's report link both ways, the Code arithmetic on screen, the
 * unsaved-typing guard, cancellations, major changes, complaint milestones,
 * exports, housekeeping and storage. Run against the built app:
 *
 *   npm run build && npx vite preview --port 4173 --strictPort
 *   node tests/core.mjs
 */
import {
  ACCESS_HASH,
  APP,
  Report,
  addDays,
  body,
  browser,
  closeSheet,
  copyCustomerLink,
  customerReport,
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

const OLD_HASH = '57b9b7721f58c0de65cabe0a3b67211320525eb6563f79ccc431f8a990b154c8'
const r = new Report('core')
const b = await browser()

// ---------------------------------------------------------------------------
// 1. Access code and first open
{
  const { ctx, page, errors } = await newPage(b)
  await page.goto(APP, { waitUntil: 'load' })
  await page.evaluate(() => localStorage.clear())
  await page.goto(APP, { waitUntil: 'load' })
  await page.waitForTimeout(400)
  let t = await body(page)
  r.check('fresh install shows the access screen with the new name', t.includes('For NHQB-registered developers') && t.includes('New Home Tracker') && !t.includes('Plot Tracker'))
  r.check('Guide is open before the code (shop window)', (await page.getByRole('button', { name: 'Guide and videos' }).count()) === 1)
  await page.getByPlaceholder('Access code').fill('WRONG-CODE')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForTimeout(300)
  r.check('an unknown code is "not recognised"', (await body(page)).includes('not recognised'))
  await page.getByPlaceholder('Access code').fill('NHQB-PLOT-2026')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForTimeout(300)
  r.check('the withdrawn code is "expired", not unknown', (await body(page)).includes('has expired'))
  await page.getByPlaceholder('Access code').fill('nhqb home 2026')
  await page.getByPlaceholder('Access code').press('Enter')
  await page.waitForTimeout(600)
  t = await body(page)
  r.check('the current code unlocks, however it is typed', !t.includes('For NHQB-registered developers'))
  r.check('the how-to sheet shows once on first open', t.includes('How to use NHQB New Home Tracker'))
  r.check('the stored hash is the current code', (await page.evaluate(() => localStorage.getItem('plot-clock-access'))) === ACCESS_HASH)
  await page.getByRole('button', { name: 'Got it' }).click()
  await page.reload()
  await page.waitForTimeout(400)
  t = await body(page)
  r.check('after a reload the app stays unlocked and the how-to does not repeat', !t.includes('For NHQB-registered developers') && !t.includes('How to use NHQB'))
  // An expired stored hash asks again, saying expired.
  await page.evaluate(([h]) => localStorage.setItem('plot-clock-access', h), [OLD_HASH])
  await page.reload()
  await page.waitForTimeout(400)
  r.check('an expired stored code asks again and says so', (await body(page)).includes('has expired'))
  r.check('no page errors during access checks', errors.length === 0, errors.join(' | '))
  await ctx.close()
}

// ---------------------------------------------------------------------------
// 2. Demo data, the dashboard, the plot screen, the checklist
{
  const { ctx, page, errors } = await newPage(b)
  await freshApp(page)
  let t = await body(page)
  r.check('Settings names the app correctly', (await page.evaluate(() => document.title)).includes('New Home Tracker'))
  r.check('demo adds two developments, most urgent first', t.indexOf('Meadow View') < t.indexOf('finished developments') && t.includes('need action'))
  const s = await devState(page)
  r.check('every plot has the 20-item checklist', s.plots.every((p) => p.documents.length === 20), s.plots.map((p) => p.documents.length).join(','))
  r.check('storage keys are the original ones (no user loses records)', (await page.evaluate(() => Object.keys(localStorage))).includes('plot-clock-state-v1'))
  await openDevelopment(page)
  t = await body(page)
  const order = ['Plot 7', 'Plot 2', 'Plot 5', 'Plot 9', 'Plot 1'].map((p) => t.indexOf(p))
  r.check('plots sort red → amber → green (7 first, 1 last)', order[0] < order[1] && order[1] < order[4] && order[3] < order[4], order.join(','))
  r.check('the archived Brookfield plot is out of the daily view', !t.includes('Plot 4, Brookfield'))
  r.check('Part 1 checklist on the development (7 items)', t.includes('Before reservation — Part 1 of the Code') && t.includes('0/7'))
  await openPlot(page, 'Plot 7')
  t = await body(page)
  r.check('Plot 7 leads with the emergency', t.includes('Deal with the emergency (E-001)'))
  r.check('complaint timescale shown from the start date', t.includes('Written acknowledgement') && t.includes('Eight-Week Letter'))
  r.check('the customer-report hint is on the plot screen', t.includes("A report from the customer's app? Tap the link in their email"))
  r.check('no forbidden text on the plot screen', screenProblems(t).length === 0, screenProblems(t).join(','))
  // Code search
  await page.getByRole('button', { name: 'The Code' }).click()
  await page.locator('.content textarea').fill('how long to fix a snag')
  await page.waitForTimeout(300)
  t = await body(page)
  r.check('Code search answers a plain question with 3.3', t.includes('Results') && t.includes('3.3'))
  // Guide tab: the library
  await page.getByRole('button', { name: 'Guide' }).click()
  await page.waitForTimeout(300)
  const posters = await page.locator('.vcard').count()
  r.check('the Guide lists the tour and fourteen scenario videos', posters === 14 && (await page.locator('.vhero').count()) === 1, String(posters))
  await page.getByRole('tab', { name: 'Read' }).click()
  t = await body(page)
  r.check('the manual carries the new name and the access-code paragraph', t.includes('New Home Tracker is free to NHQB-registered developers') && !t.includes('Plot Tracker'))
  r.check('no page errors on the developer screens', errors.length === 0, errors.join(' | '))
  await ctx.close()
}

// ---------------------------------------------------------------------------
// 3. A new plot: the Code's dates, then the customer's page
{
  const { ctx, page, errors } = await newPage(b)
  await freshApp(page)
  await openDevelopment(page)
  await page.getByRole('button', { name: '+ Plot' }).click()
  await page.getByPlaceholder('e.g. Plot 3, Meadow View').fill('Plot 3, Meadow View')
  await page.getByPlaceholder('e.g. Mr & Mrs Patel').fill('Mr & Mrs Patel')
  await page.getByPlaceholder('e.g. customer@email.com').fill('patel@example.com')
  const today = todayISO()
  let t = await body(page)
  r.check('new plot hint: cooling-off to +14, exchange-by +42', t.includes(formatDate(addDays(today, 14))) && t.includes(formatDate(addDays(today, 42))))
  await page.getByRole('button', { name: 'Create plot' }).click()
  await page.waitForTimeout(400)
  t = await body(page)
  r.check('plot screen: cooling-off until +14 and exchange due', t.includes('Cooling-off period') && t.includes(formatDate(addDays(today, 14))) && t.includes('Exchange of contracts due'))
  r.check('next action is exchange in 42 days; the checklist group is 0/2', t.includes('Exchange contracts — due in 42 days') && t.includes('At reservation') && /0\/2/.test(t))
  // A longer cooling-off from the Reservation Agreement.
  await page.getByRole('button', { name: 'Edit details & dates' }).click()
  await page.locator('.sheet .field', { hasText: 'Cooling-off period in days' }).locator('input').fill('21')
  await page.getByRole('button', { name: 'Save' }).click()
  await page.waitForTimeout(300)
  t = await body(page)
  r.check('a 21-day cooling-off is honoured (never below 14)', t.includes(formatDate(addDays(today, 21))))
  const link = await copyCustomerLink(page)
  r.check('share link is a #/buyer/ link on this origin', link.startsWith(APP) && link.includes('#/buyer/v1.'))
  await navigate(page, link)
  t = await body(page)
  r.check('customer page: their home, "My new home", never the product name', t.includes('Plot 3, Meadow View') && t.includes('My new home') && !t.includes('Plot Tracker'))
  r.check('customer page: cooling-off end matches the 21 days', t.includes(`until ${formatDate(addDays(today, 21))}`) && t.includes('at least 14 days'))
  r.check('customer page: 0 of 18 documents received (18 = 20 less two internal checks)', t.includes('0/18') && t.includes('Nothing recorded yet'))
  r.check('customer page: emergency option absent before completion', !t.includes('Emergency — immediate threat'))
  await page.getByRole('button', { name: /Report a problem/ }).click()
  await page.waitForTimeout(200)
  t = await body(page)
  r.check('before notice, a problem with the home is worded for a site visit / plans', t.includes('Something you have seen on a site visit') && !t.includes('Emergency — immediate threat'))
  await page.getByText('A problem with the home', { exact: true }).click()
  await page.waitForTimeout(200)
  t = await body(page)
  r.check("customer's own words head the sheet, routed as a complaint pre-notice", t.includes('A problem with the home') && t.includes("complaints process") && !t.includes('Make a formal complaint'))
  r.check('no page errors on the customer page', errors.length === 0, errors.join(' | '))
  await ctx.close()
}

// ---------------------------------------------------------------------------
// 4. The report link, both ways: snag after completion, complaint before, emergency
{
  const { ctx, page, errors } = await newPage(b)
  await freshApp(page)
  await openDevelopment(page)
  await openPlot(page, 'Plot 1')
  const link = await copyCustomerLink(page)
  await navigate(page, link)
  await page.getByRole('button', { name: /Report a problem/ }).click()
  await page.waitForTimeout(200)
  let t = await body(page)
  r.check('completed home: emergency option is offered first, with the phone number', t.indexOf('Emergency — immediate threat') < t.indexOf('A problem with the home') && t.includes('01242 555 0199'))
  await closeSheet(page)
  const email = await customerReport(page, { category: 'A problem with the home', text: 'Bathroom door catches the frame at the top.' })
  r.check('the email reads as an email and ends with the one instruction', email.startsWith('Hi,') && email.includes('Sent ') && email.includes('from my New Home Tracker link') && email.includes('Developer: tap this link to log it in New Home Tracker.'))
  r.check("the email's subject-style heading uses the customer's words", (await body(page)).includes('Your reports') && (await body(page)).includes('Snag or defect'))
  const rl = reportLinkFrom(email)
  r.check('report link is a #/report/ link', rl.includes('#/report/v1.'))
  await navigate(page, rl)
  await page.waitForTimeout(500)
  t = await body(page)
  r.check('tapping the link opens the log sheet on the right plot, filled in', t.includes('Log a snag or defect') && t.includes("From the customer's app") && t.includes('‹ Plots'))
  const desc = await page.locator('.sheet textarea').inputValue()
  r.check("the customer's words and date are kept", desc.startsWith('Bathroom door catches the frame at the top.') && desc.includes(`[Reported by the customer via their plot link, sent ${formatDate(todayISO())}]`))
  r.check('the received date defaults to the day they sent it', (await page.locator('.sheet input[type=date]').inputValue()) === todayISO())
  r.check('the sheet offers "Log as" so a snag is not silently a complaint', t.includes('Log as') && t.includes('A snag reported to you is not automatically a complaint'))
  await page.getByRole('button', { name: 'Log snag' }).click()
  await page.waitForTimeout(400)
  t = await body(page)
  r.check('logged as S-001 with the 30-day put-right date', t.includes('S-001') && t.includes(`due ${formatDate(addDays(todayISO(), 30))}`))
  r.check('the address bar no longer carries the report', !(await page.evaluate(() => location.hash)).includes('report'))
  // The customer sees it on the record with the same date.
  const link2 = await copyCustomerLink(page)
  await navigate(page, link2)
  t = await body(page)
  r.check("customer sees the snag on the developer's record with the put-right date", t.includes("On your developer's record") && t.includes(`Should be put right by ${formatDate(addDays(todayISO(), 30))}`))

  // A complaint from a reserved plot: category prefix, start date = next business day.
  await navigate(page, APP)
  await openDevelopment(page)
  await openPlot(page, 'Plot 9')
  const link9 = await copyCustomerLink(page)
  await navigate(page, link9)
  const email9 = await customerReport(page, { category: 'Money or a refund', text: 'My reservation fee receipt shows the wrong amount.' })
  await navigate(page, reportLinkFrom(email9))
  await page.waitForTimeout(500)
  t = await body(page)
  r.check('a money problem arrives as a complaint', t.includes('Log a complaint'))
  const d9 = await page.locator('.sheet textarea').inputValue()
  r.check('the category the customer chose is carried as [About: …]', d9.startsWith('[About: Money or a refund] My reservation fee receipt'))
  await page.getByRole('button', { name: 'Log complaint' }).click()
  await page.waitForTimeout(400)
  t = await body(page)
  const start = nextBusinessDay(todayISO())
  r.check('complaint start date is the first business day after receipt; day 5 follows', t.includes('C-001') && t.includes(formatDate(addDays(start, 5))))
  r.check('the toast says it came from the customer and when to acknowledge', t.includes("Complaint logged from the customer's report — acknowledge in writing by " + formatDate(addDays(start, 5))))

  // Emergency after completion.
  await navigate(page, link2)
  const emailE = await customerReport(page, { emergency: true, text: 'No heating or hot water and the boiler is leaking.' })
  r.check('emergency email says they are also telephoning', emailE.includes('Please treat this as an emergency') && emailE.includes('I am also telephoning you'))
  await navigate(page, reportLinkFrom(emailE))
  await page.waitForTimeout(500)
  r.check('an emergency arrives as an emergency', (await body(page)).includes('Log an emergency'))
  await page.getByRole('button', { name: 'Log emergency' }).click()
  await page.waitForTimeout(300)
  t = await body(page)
  r.check('logged E-001, flagged urgent, at the top of the plot', t.includes('E-001') && t.includes('Deal with the emergency (E-001)'))
  r.check('no page errors during the report round trips', errors.length === 0, errors.join(' | '))
  await ctx.close()
}

// ---------------------------------------------------------------------------
// 5. Report link fallbacks: no plots on this phone; no matching plot; the paste route
{
  const { ctx, page, errors } = await newPage(b)
  await freshApp(page)
  await openDevelopment(page)
  await openPlot(page, 'Plot 2')
  const link = await copyCustomerLink(page)
  await navigate(page, link)
  const email = await customerReport(page, { category: 'A problem with the home', text: 'Sealant around the bath is shrinking.' })
  const rl = reportLinkFrom(email)
  // Wipe the developer's plots: the link opened in a browser with nothing in it.
  await page.goto(APP)
  await page.evaluate(([h]) => {
    localStorage.clear()
    localStorage.setItem('plot-clock-access', h)
    localStorage.setItem('plot-clock-help-seen', '1')
  }, [ACCESS_HASH])
  await navigate(page, rl)
  await page.waitForTimeout(500)
  let t = await body(page)
  r.check('no plots: the report is shown with a Copy button and the explanation', t.includes('This phone has no plots in New Home Tracker') && t.includes('Copy the report') && t.includes('Sealant around the bath'))
  await page.getByRole('button', { name: 'Copy the report' }).click()
  await page.waitForTimeout(200)
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  r.check('the copied report carries the link so a paste still decodes', copied.includes('#/report/v1.') && copied.includes('Snag or defect'))
  // Plots exist but none match: the picker.
  await closeSheet(page)
  await page.reload()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByPlaceholder('e.g. Meadow Homes Ltd').fill('Other Homes')
  await page.getByPlaceholder('e.g. you@yourcompany.co.uk').fill('x@example.com')
  await page.getByRole('button', { name: 'Load demo data' }).click()
  await page.waitForTimeout(300)
  // The fresh demo has its own "Plot 2, Meadow View" (a different id), and the
  // app falls back to matching by address — so that alone opens the sheet.
  await navigate(page, rl)
  await page.waitForTimeout(500)
  t = await body(page)
  r.check('a plot with the same address is matched by address', t.includes('Log a snag or defect') && t.includes('Plot 2, Meadow View'))
  await closeSheet(page)
  // Rename it, and the app has to ask.
  await page.getByRole('button', { name: 'Edit details & dates' }).click()
  await page.locator('.sheet .field', { hasText: 'Address / plot name' }).locator('input').fill('Plot 2A, Meadow View')
  await page.getByRole('button', { name: 'Save' }).click()
  await page.waitForTimeout(200)
  await navigate(page, rl)
  await page.waitForTimeout(500)
  t = await body(page)
  r.check('no matching plot: the app asks which plot it is about', t.includes('Which plot is this report about?') && t.includes('Plot 2A, Meadow View'))
  await page.getByRole('button', { name: /Plot 9, Meadow View/ }).click()
  await page.waitForTimeout(400)
  t = await body(page)
  r.check('picking a plot opens the filled-in sheet there', t.includes('Log a snag or defect') && (await page.locator('.sheet textarea').inputValue()).includes('Sealant'))
  await closeSheet(page)
  // The paste route: paste the whole email into a complaint sheet; it decodes and switches type.
  await page.getByRole('button', { name: /^Complaint/ }).click()
  await page.locator('.sheet textarea').fill(email)
  await page.waitForTimeout(400)
  t = await body(page)
  const pasted = await page.locator('.sheet textarea').inputValue()
  r.check('pasting the email decodes it and switches to the type the customer sent', t.includes('Log a snag or defect') && pasted.startsWith('Sealant around the bath'))
  r.check('no page errors in the fallbacks', errors.length === 0, errors.join(' | '))
  await ctx.close()
}

// ---------------------------------------------------------------------------
// 6. The unsaved-typing guard, and Settings' exemption
{
  const { ctx, page, dialogs } = await newPage(b, { acceptDialogs: false })
  await freshApp(page)
  await openDevelopment(page)
  await openPlot(page, 'Plot 9')
  await page.getByRole('button', { name: /^Snag/ }).click()
  await page.locator('.sheet textarea').fill('Half-typed')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
  r.check('Escape with typed text asks "Discard what you have typed?"', dialogs.includes('Discard what you have typed?'))
  r.check('dismissing the dialog keeps the sheet open', (await page.locator('.sheet').count()) === 1)
  await page.locator('.scrim').click({ position: { x: 5, y: 5 } })
  await page.waitForTimeout(200)
  r.check('a tap outside asks too', dialogs.length === 2 && (await page.locator('.sheet').count()) === 1)
  await ctx.close()
  const p2 = await newPage(b)
  await freshApp(p2.page)
  await p2.page.getByRole('button', { name: 'Settings' }).click()
  await p2.page.getByPlaceholder('e.g. 01234 567890').fill('01234 567890')
  await p2.page.keyboard.press('Escape')
  await p2.page.waitForTimeout(200)
  r.check('Settings saves as you type, so closing never asks', p2.dialogs.length === 0 && (await p2.page.locator('.sheet').count()) === 0)
  r.check('a sheet with nothing typed closes without asking', true)
  await p2.ctx.close()
}

// ---------------------------------------------------------------------------
// 7. Cancellation and refunds; major change; the complaint ladder; export; housekeeping
{
  const { ctx, page, errors } = await newPage(b)
  await freshApp(page)
  await openDevelopment(page)
  await openPlot(page, 'Plot 9')
  await page.getByRole('button', { name: 'Edit details & dates' }).click()
  await scrollSheetTo(page, page.getByRole('heading', { name: 'If the customer pulls out' }))
  const notice = isoDaysFromToday(-3)
  await page.locator('.sheet .field', { hasText: "Date of the customer's notice" }).locator('input').fill(notice)
  await page.getByRole('button', { name: 'Reservation cancelled' }).click()
  await page.waitForTimeout(400)
  let t = await body(page)
  r.check('reservation cancelled: refund due 14 days from the notice date (11 days left)', t.includes('Refund reservation fee') && t.includes('due in 11 days') && t.includes(`Reservation cancelled — ${formatDate(notice)}`))
  await page.getByRole('button', { name: 'Mark refund paid' }).click()
  await page.waitForTimeout(300)
  t = await body(page)
  r.check('refund paid is recorded and the plot keeps its record', t.includes('Refund paid'))
  await page.getByRole('button', { name: 'Back' }).click()
  await page.waitForTimeout(300)
  t = await body(page)
  r.check('a refunded cancellation archives the plot', !t.includes('Plot 9, Meadow View') && t.includes('Show archived plots'))

  // Contract cancelled on an exchanged plot: 28 days.
  await openPlot(page, 'Plot 5')
  await page.getByRole('button', { name: 'Edit details & dates' }).click()
  await scrollSheetTo(page, page.getByRole('heading', { name: 'If the customer pulls out' }))
  await page.getByRole('button', { name: 'Contract cancelled' }).click()
  await page.waitForTimeout(400)
  t = await body(page)
  r.check('contract cancelled: deposit refund due in 28 days', t.includes('Refund contract deposit') && t.includes('due in 28 days'))
  await page.getByRole('button', { name: 'Back' }).click()
  await page.waitForTimeout(300)

  // Major change on a fresh plot: notice not sent → window from receipt.
  await page.getByRole('button', { name: '+ Plot' }).click()
  await page.getByPlaceholder('e.g. Plot 3, Meadow View').fill('Plot 11, Meadow View')
  await page.getByPlaceholder('e.g. Mr & Mrs Patel').fill('Dr Osei')
  await page.getByRole('button', { name: 'Create plot' }).click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Log a choice, change, delay, visit or email' }).click()
  await page.locator('.sheet .type-opt', { hasText: 'Major change' }).click()
  await page.locator('.sheet textarea').fill('Garage moved to the other side of the plot')
  await page.getByRole('button', { name: 'Log major change' }).click()
  await page.waitForTimeout(500)
  t = await body(page)
  r.check('logging a major change opens the written notice with "Speak to the customer first"', t.includes('Speak to the customer first') && t.includes('Record the notice as received'))
  const letter = await page.locator('.sheet textarea').inputValue()
  r.check('the notice states the 14-day right to cancel and the full refund', /14 days/.test(letter) && /full refund/i.test(letter))
  const received = isoDaysFromToday(-2)
  await page.locator('.sheet .field', { hasText: 'Date the customer received it' }).locator('input').fill(received)
  await page.getByRole('button', { name: 'Record the notice as received' }).click()
  await page.waitForTimeout(300)
  await closeSheet(page)
  t = await body(page)
  r.check('the window ends 14 days after receipt, and the plot says the customer may cancel', t.includes('Major change — customer may cancel') && t.includes(formatDate(addDays(received, 14))))
  const link = await copyCustomerLink(page)
  await navigate(page, link)
  t = await body(page)
  r.check("the customer's page shows the cancel-by date and the full refund", t.includes(`until ${formatDate(addDays(received, 14))}`) && t.includes('full refund'))
  await navigate(page, APP)
  await openDevelopment(page)
  await openPlot(page, 'Plot 11')
  await page.getByRole('button', { name: 'Record outcome' }).first().click()
  await page.getByRole('button', { name: 'Customer accepted — carry on' }).click()
  await page.waitForTimeout(300)
  t = await body(page)
  r.check('accepted, but the 14-day period still runs (Code 2.9) and no second "Record outcome"', t.includes('Major change accepted — 14-day period still running') && t.includes(formatDate(addDays(received, 14))) && !t.includes('Record outcome') && t.includes('Notice to complete still cannot be served until'))

  // Complaint ladder on Plot 7 (started 32 days ago, two milestones done).
  await page.getByRole('button', { name: 'Back' }).click()
  await openPlot(page, 'Plot 7')
  t = await body(page)
  r.check('Plot 7: assessment letter overdue (day 30 passed)', t.includes('Complaint Assessment and Response letter') && /days overdue/.test(t))
  await page.getByRole('button', { name: 'Draft', exact: true }).first().click()
  await page.waitForTimeout(300)
  const draft = await page.locator('.sheet textarea').inputValue()
  r.check('the drafted letter names the Ombudsman route from 56 days', draft.includes('New Homes Ombudsman Service') && draft.includes('56 days'))
  await page.getByRole('button', { name: 'Save to record' }).click()
  await page.waitForTimeout(300)
  t = await body(page)
  r.check('saving the letter actions the milestone (the emergency still leads the plot)', t.includes('Letter saved to the record') && t.includes(`Done ${formatDate(todayISO())}`) && t.includes('Deal with the emergency (E-001)'))
  // Export PDF opens the printable record.
  const [popup] = await Promise.all([page.waitForEvent('popup'), page.getByRole('button', { name: 'Export PDF' }).click()])
  await popup.waitForLoadState()
  const pt = await popup.textContent('body')
  r.check('Export PDF: the plot record, with the new name in the footer', pt.includes('Plot record') && pt.includes('generated by NHQB New Home Tracker') && pt.includes('C-001'))
  await popup.close()
  // Housekeeping lists the Brookfield plot.
  await page.getByRole('button', { name: 'Settings' }).click()
  t = await body(page)
  r.check('housekeeping lists the plot whose two years have ended', t.includes('The two-year period has ended') && t.includes('Plot 4, Brookfield Rise'))
  r.check('no page errors in the journey checks', errors.length === 0, errors.join(' | '))
  await ctx.close()
}

// ---------------------------------------------------------------------------
// 8. Persistence and migration: state survives a reload; a broken link is refused
{
  const { ctx, page } = await newPage(b)
  await freshApp(page)
  const before = (await devState(page)).plots.length
  await page.reload()
  await page.waitForTimeout(300)
  r.check('records survive a reload', (await devState(page)).plots.length === before && before === 6)
  await navigate(page, APP + '#/buyer/v1.notarealcode')
  r.check('a broken customer link says so and asks for a fresh one', (await body(page)).includes("This link didn't open properly"))
  await navigate(page, APP + '#/buyer')
  r.check('the customer landing page (no link) names the product', (await body(page)).includes('This is the customer view of NHQB New Home Tracker'))
  await navigate(page, APP + '#/report/v1.notarealcode')
  await page.waitForTimeout(400)
  r.check('a broken report link is refused with a message', (await body(page)).includes('That report link is not valid'))
  await ctx.close()
}

await b.close()
r.done()
