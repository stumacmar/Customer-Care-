/*
 * Shared test helpers. The app-driving helpers live with the media harness
 * (tools/media/harness.mjs) so the videos and the tests drive the app the
 * same way; this adds assertions, a per-test browser, and date arithmetic
 * that mirrors src/lib/dates.ts.
 */
import { chromium, CHROMIUM_PATH } from '../tools/media/pw.mjs'
export {
  ACCESS_HASH,
  APP,
  closeSheet,
  copyCustomerLink,
  customerReport,
  freshApp,
  loadDemo,
  navigate,
  openDevelopment,
  openPlot,
  reportLinkFrom,
  scrollSheetTo,
  scrollTo,
} from '../tools/media/harness.mjs'

export const VIEWPORT = { width: 402, height: 880 }

export async function browser() {
  return chromium.launch({ executablePath: CHROMIUM_PATH })
}

/** A fresh context and page: clipboard allowed, service worker blocked, dialogs accepted, page errors collected. */
export async function newPage(b, { acceptDialogs = true } = {}) {
  const ctx = await b.newContext({ viewport: VIEWPORT, serviceWorkers: 'block', permissions: ['clipboard-read', 'clipboard-write'] })
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => {
    // Network failures are not app errors (the test blocks the web fonts).
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text())
  })
  const dialogs = []
  page.on('dialog', (d) => {
    dialogs.push(d.message())
    if (acceptDialogs) d.accept()
    else d.dismiss()
  })
  return { ctx, page, errors, dialogs }
}

export class Report {
  constructor(name) {
    this.name = name
    this.pass = 0
    this.fails = []
  }
  check(label, cond, detail) {
    if (cond) this.pass += 1
    else this.fails.push(label + (detail ? ` — ${detail}` : ''))
    console.log(`${cond ? 'PASS' : 'FAIL'} ${label}${!cond && detail ? `  (${detail})` : ''}`)
  }
  done() {
    console.log(`\n${this.name}: ${this.pass} passed, ${this.fails.length} failed`)
    if (this.fails.length) {
      console.log('FAILURES:\n  ' + this.fails.join('\n  '))
      process.exitCode = 1
    }
  }
}

export const body = (page) => page.textContent('body')

export function todayISO() {
  return isoDaysFromToday(0)
}

export function isoDaysFromToday(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso, n) {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function nextBusinessDay(iso) {
  let d = addDays(iso, 1)
  while ([0, 6].includes(parseISO(d).getDay())) d = addDays(d, 1)
  return d
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** "5 Jul 2026", as src/lib/dates.ts formats it. */
export function formatDate(iso) {
  const d = parseISO(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** "due in 3 days" / "due today" / "2 days overdue", as src/lib/dates.ts phrases it. */
export function describeCountdown(days) {
  if (days === 0) return 'due today'
  if (days === 1) return 'due tomorrow'
  if (days > 1) return `due in ${days} days`
  if (days === -1) return '1 day overdue'
  return `${Math.abs(days)} days overdue`
}

export function daysBetween(fromIso, toIso) {
  return Math.round((parseISO(toIso) - parseISO(fromIso)) / 86400000)
}

/** The developer's saved state, straight from storage. */
export async function devState(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('plot-clock-state-v1') || 'null'))
}

/** Text that should never reach a screen. */
export const NEVER = [/\bundefined\b/, /\bNaN\b/, /Invalid Date/, /\[object Object\]/, /Plot Tracker/]
export function screenProblems(text) {
  return NEVER.filter((re) => re.test(text)).map((re) => re.source)
}
