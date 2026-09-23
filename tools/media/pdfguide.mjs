/*
 * The picture guide: ten steps, one screen each, every function ringed and
 * explained, laid out as A4 pages and printed to public/guide.pdf. The cover
 * becomes public/guide-cover.jpg. Screenshots are taken from the live app at
 * 2× so they print crisply.
 *
 *   node tools/media/pdfguide.mjs      (app served at $APP_URL, see record.mjs)
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium, CHROMIUM_PATH } from './pw.mjs'
import { ACCESS_HASH, APP, VIEWPORT, freshApp, openDevelopment, openPlot, scrollTo } from './harness.mjs'
import { CACHE, HERE } from './tts.mjs'

const ROOT = resolve(HERE, '..', '..')
const OUT = join(CACHE, 'guide')
mkdirSync(OUT, { recursive: true })

const STEPS = [
  {
    title: 'Your sites at a glance',
    text: 'Every development rolls up to one colour. Red: overdue, or an emergency. Amber: due within five days. Green: on track. The line under the name is the single most urgent thing across all its plots.',
    async show(page) {
      return page.locator('.plot-card').first()
    },
  },
  {
    title: 'The next thing to do, on every plot',
    text: 'Plots sort with the most urgent at the top. Each card leads with one line — what to do next and when. You never calculate a date yourself.',
    async show(page) {
      await openDevelopment(page)
      return page.locator('.plot-card').first()
    },
  },
  {
    title: 'One line tells you what is due',
    text: 'Open any plot and the banner at the top is the answer to "what do I need to do?". Below it: Edit details & dates (record each journey date as it happens) and Share with customer.',
    async show(page) {
      await openPlot(page, 'Plot 5')
      return page.locator('.next-banner')
    },
  },
  {
    title: 'Record the dates — the deadlines follow',
    text: 'Reserved, Exchanged, Notice, Completed. Enter each date the day it happens and the app starts every Code timescale for you: cooling-off, exchange-by, inspection, after-sales.',
    async show(page) {
      await scrollTo(page, page.getByRole('heading', { name: 'Journey' }), 80)
      return page.locator('.journey-strip')
    },
  },
  {
    title: 'Snags, defects, complaints and emergencies',
    text: "The moment a customer reports anything, tap the matching button. The Code timescale starts automatically — 30 days to put right a snag or defect, the 5/10/30/56-day complaints timetable, urgent flagging for emergencies. A report from the customer's app arrives by email: tap the link in it and the sheet opens here, filled in.",
    async show(page) {
      await scrollTo(page, page.locator('.log-buttons'), 120)
      return page.locator('.log-buttons')
    },
  },
  {
    title: 'Choices, changes, delays, site visits and emails',
    text: 'One line, optional photo, ten seconds. Choices and paid extras, changes (for a major one: speak to the customer first, send the drafted notice, and the 14-day window runs from receipt), delays, build updates, trade visits — attended, no access, or turned away — and emails with the customer, all from this one button.',
    async show(page) {
      const b = page.getByRole('button', { name: 'Log a choice, change, delay, visit or email' })
      await scrollTo(page, b, 300)
      return b
    },
  },
  {
    title: 'Emails with the customer',
    text: 'Pick Email under the same button and paste an email to or from the customer — with the date it was actually sent — and it joins the timeline and the export, so the evidence trail is complete. On Android you can share an email straight from your mail app into the right plot.',
    async show(page) {
      await page.getByRole('button', { name: 'Log a choice, change, delay, visit or email' }).click()
      await page.waitForTimeout(300)
      const email = page.locator('.sheet .type-opt', { hasText: 'Email' })
      await email.click()
      await page.waitForTimeout(300)
      return email
    },
    after: async (page) => {
      await page.locator('.sheet-close').click()
      await page.waitForTimeout(200)
    },
  },
  {
    title: 'The document checklist',
    text: 'Grouped by stage — At reservation, Pre-contract & exchange, Completion & handover — and it only ever asks for what is due at the stage you have reached. Tick items off as you hand them over, attaching files as you go.',
    async show(page) {
      const h = page.getByRole('heading', { name: /Document checklist/ })
      await scrollTo(page, h, 60)
      return page.locator('.doc-stage-head').first().locator('..')
    },
  },
  {
    title: 'Give the customer their own app',
    text: "Creates a private link — the plot's details travel inside the link itself, so nothing is uploaded anywhere. The customer sees their journey, their Code rights, documents received, and can report problems through a guided form that reaches you by email.",
    async show(page) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.waitForTimeout(200)
      return page.getByRole('button', { name: 'Share with customer' })
    },
  },
  {
    title: 'Search the Code',
    text: 'Type a question in your own words — "how long to fix a snag", "deposit refund" — and the relevant clause appears with its exact reference. Quick answers and a part-by-part browse sit underneath.',
    async show(page) {
      await page.getByRole('button', { name: 'The Code' }).click()
      await page.waitForTimeout(300)
      await page.locator('.content textarea').fill('how long to fix a snag')
      await page.waitForTimeout(400)
      return page.locator('.content .section').first()
    },
  },
]

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH })
const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, serviceWorkers: 'block' })
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
const page = await ctx.newPage()
page.on('dialog', (d) => d.accept())
await freshApp(page)
// Belt and braces: the access hash must be current or the developer side will not open.
await page.evaluate(([h]) => localStorage.setItem('plot-clock-access', h), [ACCESS_HASH])
// Let the "Demo development added" toast clear before the first screenshot.
await page.waitForTimeout(3800)

const shots = []
for (let i = 0; i < STEPS.length; i++) {
  const step = STEPS[i]
  const target = await step.show(page)
  await page.waitForTimeout(350)
  const box = await target.first().boundingBox()
  const file = join(OUT, `step-${i + 1}.png`)
  await page.screenshot({ path: file })
  shots.push({ ...step, file, box })
  if (step.after) await step.after(page)
}
await ctx.close()

const logo = readFileSync(join(ROOT, 'public', 'nhqb-logo.png')).toString('base64')
const img = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const W = VIEWPORT.width
const H = VIEWPORT.height
const SCALE = 0.62 // px of screenshot → px on the page (A4 at 96 dpi is 794×1123)

const pages = shots
  .map(
    (s, i) => `
<section class="page">
  <header><img src="data:image/png;base64,${logo}" alt=""><span>Step ${i + 1} of ${shots.length}</span></header>
  <h2>${s.title}</h2>
  <div class="row">
    <div class="shot" style="width:${W * SCALE}px;height:${H * SCALE}px">
      <img src="${img(s.file)}" alt="">
      ${s.box ? `<div class="ring" style="left:${(s.box.x - 8) * SCALE}px;top:${(s.box.y - 8) * SCALE}px;width:${(s.box.width + 16) * SCALE}px;height:${(s.box.height + 16) * SCALE}px"></div>` : ''}
    </div>
    <p>${s.text}</p>
  </div>
</section>`
  )
  .join('\n')

const html = `<!doctype html><html><head><meta charset="utf-8"><title>New Home Tracker — Picture Guide</title>
<style>
@page { size: A4; margin: 0 }
* { box-sizing: border-box }
body { margin: 0; font: 13px/1.5 Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #303e51 }
.page { width: 210mm; height: 297mm; page-break-after: always; padding: 0 0 18mm; position: relative; overflow: hidden }
.cover { background: #2c3a4c; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 30mm }
.cover img { width: 150px; margin-bottom: 18px }
.cover h1 { font: 700 30px/1.2 Cardo, Georgia, serif; margin: 0 0 10px }
.cover .rule { width: 34px; height: 3px; background: #e9473f; margin: 14px auto 22px }
.cover p { color: #c6cdd6; font-size: 14px; margin: 0 0 8px; max-width: 420px }
.cover .url { color: #8f9ba8; font-size: 12px; margin-top: 18px }
header { background: #2c3a4c; color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 12px 16mm; font-weight: 600; font-size: 13px }
header img { height: 30px }
h2 { font: 700 22px/1.25 Cardo, Georgia, serif; margin: 22px 16mm 14px }
.row { display: flex; gap: 22px; padding: 0 16mm; align-items: flex-start }
.shot { position: relative; flex: 0 0 auto; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 2px rgba(16,24,40,.08), 0 10px 30px rgba(16,24,40,.12) }
.shot img { width: 100%; height: 100%; display: block }
.ring { position: absolute; border: 3px solid #e9473f; border-radius: 12px; box-shadow: 0 0 0 3px rgba(233,71,63,.18) }
.row p { margin: 6px 0 0; font-size: 13.5px; line-height: 1.6 }
</style></head><body>
<section class="page cover">
  <img src="data:image/png;base64,${logo}" alt="">
  <h1>New Home Tracker — Picture Guide</h1>
  <div class="rule"></div>
  <p>Ten steps, one screen each. Tracks every new home you sell, keeps your customers updated, and helps you keep to the Code.</p>
  <div class="url">plotclock.co.uk · free · works offline</div>
</section>
${pages}
</body></html>`
const htmlPath = join(OUT, 'guide.html')
writeFileSync(htmlPath, html)

const pdfPage = await browser.newPage()
await pdfPage.goto('file://' + htmlPath, { waitUntil: 'load' })
await pdfPage.waitForTimeout(300)
const pdf = join(ROOT, 'public', 'guide.pdf')
await pdfPage.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true })
await browser.close()

// The cover as a poster for the Guide's Print panel.
execFileSync('pdftoppm', ['-jpeg', '-r', '60', '-f', '1', '-l', '1', '-singlefile', pdf, join(OUT, 'cover')])
execFileSync('cp', [join(OUT, 'cover.jpg'), join(ROOT, 'public', 'guide-cover.jpg')])
console.log(`guide.pdf: ${shots.length + 1} pages; guide-cover.jpg written`)
