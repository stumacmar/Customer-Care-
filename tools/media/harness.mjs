/*
 * The recording harness.
 *
 * A scenario is a function that drives the app in a Playwright page and calls
 * `h.beat()` once per narration line. Each beat paints a marker — an 8×8 grey
 * square inside a 4 px black frame at the bottom-left corner, grey = 60 + 12·k
 * — so the beat's start can be read back from the raw recording afterwards.
 * The black frame matters: on a white sheet the encoder bleeds the background
 * into a bare grey square and the value drifts. Beats are detected from the
 * RAW webm Chromium records (never from the x264 re-encode, whose quantisation
 * shifts greys), at 10 fps, with a tolerance of ±5.
 *
 * Each beat then holds for at least its narration's length (plus a pad), so
 * the narration for beat k can be laid at beat k's detected start without
 * running into beat k+1. If a beat is too short the build throws rather than
 * shipping a video where the voice talks over the wrong screen.
 *
 * Never run other Playwright work (or anything heavy) while a recording is in
 * progress: a stall lengthens a beat's actions past its narration and the
 * overrun check fires.
 */
import { chromium, CHROMIUM_PATH } from './pw.mjs'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { CACHE } from './tts.mjs'

export const APP = process.env.APP_URL || 'http://localhost:4173/'
export const VIEWPORT = { width: 402, height: 880 }
/** The current access code's hash — see src/lib/access.ts. Pre-unlocks the developer side. */
export const ACCESS_HASH = 'bb629dc9bd63aa7b4e7df55452116b81cd974141389c5a31dcaa0faa43949e84'

const PAD_MS = 700
const MIN_BEAT_MS = 2600
const MARKER_ID = '__beat'
const CAPTION_ID = '__cap'
const CARD_ID = '__card'

export function grey(k) {
  return 60 + 12 * k
}

const OVERLAY_CSS = `
#${MARKER_ID}{position:fixed;left:-2px;top:866px;width:8px;height:8px;border:4px solid #000;box-sizing:content-box;z-index:2147483647;pointer-events:none}
#${CAPTION_ID}{position:fixed;left:14px;right:14px;bottom:146px;z-index:2147483000;background:rgba(30,39,52,.94);color:#fff;font:600 15px/1.35 Inter,system-ui,sans-serif;text-align:center;padding:12px 16px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.28);pointer-events:none}
#${CARD_ID}{position:fixed;inset:0;z-index:2147483100;background:#1e2734;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 32px;font-family:Inter,system-ui,sans-serif}
#${CARD_ID} img{width:104px;margin-bottom:18px}
#${CARD_ID} .k{letter-spacing:.2em;font-size:13px;color:#b9c2cf;margin-bottom:22px}
#${CARD_ID} h1{font:700 24px/1.25 Cardo,Georgia,serif;margin:0 0 14px}
#${CARD_ID} .rule{width:32px;height:3px;background:#e9473f;border-radius:2px;margin:0 auto 18px}
#${CARD_ID} p{font-size:13.5px;color:#b9c2cf;margin:0;line-height:1.5}
#${CARD_ID} .big{font:700 20px/1.4 Inter,system-ui,sans-serif;color:#fff;margin:0 0 20px}
#${CARD_ID} .url{color:#e9473f;font-weight:700;font-size:16px}
`

/** Installed on every page load: the overlay layer, restored from sessionStorage across navigations. */
const INIT = `(() => {
  const CSS = ${JSON.stringify(OVERLAY_CSS)};
  const apply = () => {
    if (!document.body) return;
    if (!document.getElementById('__ovl_css')) {
      const s = document.createElement('style'); s.id = '__ovl_css'; s.textContent = CSS; document.head.appendChild(s);
    }
    let m = document.getElementById('${MARKER_ID}');
    if (!m) { m = document.createElement('div'); m.id = '${MARKER_ID}'; document.body.appendChild(m); }
    const k = sessionStorage.getItem('__beat_k');
    m.style.background = k === null ? '#fff' : 'rgb(' + [60 + 12 * Number(k), 60 + 12 * Number(k), 60 + 12 * Number(k)].join(',') + ')';
    const cap = sessionStorage.getItem('__cap');
    let c = document.getElementById('${CAPTION_ID}');
    if (cap) { if (!c) { c = document.createElement('div'); c.id = '${CAPTION_ID}'; document.body.appendChild(c); } c.textContent = cap; }
    else if (c) c.remove();
  };
  window.__ovl = apply;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
  new MutationObserver(() => { if (document.body && !document.getElementById('${MARKER_ID}')) apply(); }).observe(document.documentElement, { childList: true });
})()`

export async function launch({ record = true, video = null } = {}) {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH })
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
    permissions: ['clipboard-read', 'clipboard-write'],
    ...(record ? { recordVideo: { dir: video, size: VIEWPORT } } : {}),
  })
  // Fonts come from Google; on a machine without network the page would wait on them.
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  await ctx.addInitScript(INIT)
  const page = await ctx.newPage()
  page.on('dialog', (d) => d.accept())
  return { browser, ctx, page }
}

/** Per-recording state: beat index, timings, the narration durations to hold for. */
export class Harness {
  constructor(page, durations, { captions = [] } = {}) {
    this.page = page
    this.dur = durations // seconds, one per beat
    this.captions = captions
    this.k = -1
    this.beatAt = 0
    this.t0 = Date.now()
  }

  /** Hold the current beat until its narration (plus pad) has had time to play. */
  async settle() {
    if (this.k < 0) return
    const need = Math.max(MIN_BEAT_MS, this.dur[this.k] * 1000 + PAD_MS)
    const left = need - (Date.now() - this.beatAt)
    if (left > 0) await this.page.waitForTimeout(left)
  }

  /** Wait until `seconds` into the current beat (for an action timed to a phrase in the narration). */
  async waitUntil(seconds) {
    const left = seconds * 1000 - (Date.now() - this.beatAt)
    if (left > 0) await this.page.waitForTimeout(left)
  }

  /** Start the next beat: paint its marker and caption. */
  async beat(caption) {
    await this.settle()
    this.k += 1
    if (this.k >= this.dur.length) throw new Error(`More beats than narration lines (beat ${this.k})`)
    const cap = caption !== undefined ? caption : this.captions[this.k] || ''
    const k = this.k
    await this.page.evaluate(
      ([k, cap]) => {
        sessionStorage.setItem('__beat_k', String(k))
        if (cap) sessionStorage.setItem('__cap', cap)
        else sessionStorage.removeItem('__cap')
        window.__ovl?.()
      },
      [k, cap]
    )
    this.beatAt = Date.now()
  }

  /** A full-screen card: title (with Code chip) or a plain interstitial like "Your customer". */
  async card({ kicker, title, sub, big, url, logo = true }) {
    await this.page.evaluate(
      ({ kicker, title, sub, big, url, logo }) => {
        let c = document.getElementById('__card')
        if (!c) {
          c = document.createElement('div')
          c.id = '__card'
          document.body.appendChild(c)
        }
        c.innerHTML =
          (logo ? '<img src="./nhqb-logo.png" alt="">' : '') +
          (kicker ? `<div class="k">${kicker}</div>` : '') +
          (title ? `<h1>${title}</h1><div class="rule"></div>` : '') +
          (big ? `<div class="big">${big}</div>` : '') +
          (sub ? `<p>${sub}</p>` : '') +
          (url ? `<div class="url">${url}</div>` : '')
        window.__ovl?.()
      },
      { kicker, title, sub, big, url, logo }
    )
    // Give the logo a moment to paint before the beat is stamped.
    await this.page.waitForTimeout(250)
  }

  async uncard() {
    await this.page.evaluate(() => document.getElementById('__card')?.remove())
  }

  /** Clear the overlay state (between the developer's app and the customer's). */
  async clearCaption() {
    await this.page.evaluate(() => {
      sessionStorage.removeItem('__cap')
      window.__ovl?.()
    })
  }

  async end() {
    await this.settle()
    // A final frame with no marker, so the last beat has a definite end.
    await this.page.evaluate(() => {
      sessionStorage.removeItem('__beat_k')
      sessionStorage.removeItem('__cap')
      window.__ovl?.()
      document.getElementById('__beat')?.remove()
    })
    await this.page.waitForTimeout(400)
  }
}

// ---------------------------------------------------------------------------
// App-driving helpers shared by scenarios, the tour, the picture guide and tests
// ---------------------------------------------------------------------------

export async function freshApp(page, { unlocked = true, demo = true, developerName = 'Meadow Homes Ltd', email = 'customercare@meadowhomes.example', phone = '01242 555 0199' } = {}) {
  await page.goto(APP, { waitUntil: 'load' })
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  if (unlocked) {
    await page.evaluate(
      ([h]) => {
        localStorage.setItem('plot-clock-access', h)
        localStorage.setItem('plot-clock-help-seen', '1')
      },
      [ACCESS_HASH]
    )
  }
  await page.goto(APP, { waitUntil: 'load' })
  await page.waitForTimeout(300)
  if (unlocked) await loadDemo(page, { developerName, email, phone, demo })
}

/** Enter the developer's details in Settings (they save as you type), and load the demo development unless told not to. */
export async function loadDemo(page, { developerName = 'Meadow Homes Ltd', email = 'customercare@meadowhomes.example', phone = '01242 555 0199', demo = true } = {}) {
  await page.getByRole('button', { name: 'Settings' }).click()
  const name = page.getByPlaceholder('e.g. Meadow Homes Ltd')
  await name.fill(developerName)
  await page.getByPlaceholder('e.g. you@yourcompany.co.uk').fill(email)
  if (phone) await page.getByPlaceholder('e.g. 01234 567890').fill(phone)
  if (demo) await page.getByRole('button', { name: 'Load demo data' }).click()
  else await page.locator('.sheet-close').click()
  await page.waitForTimeout(400)
}

/** Edit the developer's stored state in place (scenario set-up only — never a substitute for driving the screens), then reload. */
export async function patchState(page, fn) {
  await page.evaluate((src) => {
    const s = JSON.parse(localStorage.getItem('plot-clock-state-v1') || 'null')
    if (!s) return
    // eslint-disable-next-line no-new-func
    new Function('state', 'today', src)(s, new Date().toISOString().slice(0, 10))
    localStorage.setItem('plot-clock-state-v1', JSON.stringify(s))
  }, `(${fn.toString()})(state, today)`)
  await page.reload({ waitUntil: 'load' })
  await page.waitForTimeout(300)
}

export async function openDevelopment(page, name = 'Meadow View') {
  await page.getByText(name, { exact: true }).first().click()
  await page.waitForTimeout(250)
}

export async function openPlot(page, address) {
  await page.locator('.plot-card', { hasText: address }).first().click()
  await page.waitForTimeout(300)
}

/** Close any open sheet: Done/Close/Cancel/Got it if present, else the ✕. */
export async function closeSheet(page) {
  if (!(await page.locator('.sheet').count())) return
  for (const name of ['Done', 'Close', 'Cancel', 'Got it', 'Not now']) {
    const b = page.locator('.sheet').getByRole('button', { name, exact: true })
    if (await b.count()) {
      await b.last().click()
      await page.waitForTimeout(200)
      if (!(await page.locator('.sheet').count())) return
    }
  }
  const x = page.locator('.sheet-close')
  if (await x.count()) await x.first().click()
  await page.waitForTimeout(200)
}

/** Scroll the page so an element sits about a third of the way down the viewport. */
export async function scrollTo(page, locator, offset = 120) {
  await locator.first().evaluate((el, offset) => {
    const y = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top: Math.max(0, y), behavior: 'instant' })
  }, offset)
  await page.waitForTimeout(250)
}

/** Scroll a sheet's body so an element inside it is visible near the top. */
export async function scrollSheetTo(page, locator, offset = 120) {
  await locator.first().evaluate((el, offset) => {
    const sheet = el.closest('.sheet')
    if (!sheet) return
    const y = el.getBoundingClientRect().top - sheet.getBoundingClientRect().top + sheet.scrollTop - offset
    sheet.scrollTo({ top: Math.max(0, y), behavior: 'instant' })
  }, offset)
  await page.waitForTimeout(250)
}

/**
 * Go to a URL on the app's origin and make sure the app boots for it. A change
 * of fragment alone (developer app → customer link) is a same-document
 * navigation that would not re-run the app's boot, so go via about:blank.
 */
export async function navigate(page, url) {
  await page.goto('about:blank')
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(350)
}

/** Type like a person, character by character. */
export async function type(page, locator, text, delay = 28) {
  await locator.first().click()
  await locator.first().pressSequentially(text, { delay })
}

/** Copy the customer's link from the share sheet and return it (leaves the plot screen open). */
export async function copyCustomerLink(page) {
  await page.getByRole('button', { name: 'Share with customer' }).click()
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: /Copy link/ }).click()
  await page.waitForTimeout(250)
  const link = await page.evaluate(() => navigator.clipboard.readText())
  await closeSheet(page)
  return link
}

/** The customer's report email, produced from their page. Returns the email text. */
export async function customerReport(page, { category, text, emergency = false }) {
  await page.getByRole('button', { name: /Report a problem/ }).click()
  await page.waitForTimeout(300)
  if (emergency) await page.getByText('Emergency — immediate threat', { exact: true }).click()
  else await page.getByText(category, { exact: true }).click()
  await page.waitForTimeout(300)
  await page.locator('.sheet textarea').first().fill(text)
  await page.getByRole('button', { name: /Copy to send another way/ }).click()
  await page.waitForTimeout(300)
  return page.evaluate(() => navigator.clipboard.readText())
}

export function reportLinkFrom(email) {
  const m = email.match(/https?:\/\/\S+#\/report\/v[01]\.[A-Za-z0-9_-]+/)
  if (!m) throw new Error('No report link in the email')
  return m[0]
}

// ---------------------------------------------------------------------------
// Video: detect beats, mux narration, poster
// ---------------------------------------------------------------------------

/** Read the marker square from the raw recording at 10 fps and return each beat's first-seen time. */
export function detectBeats(webm, count) {
  const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', webm, '-vf', 'crop=8:8:2:870,scale=1:1,format=gray', '-r', '10', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 26 })
  const starts = []
  let k = 0
  for (let i = 0; i < raw.length && k < count; i++) {
    if (Math.abs(raw[i] - grey(k)) <= 5) {
      starts.push(i / 10)
      k += 1
    }
  }
  if (starts.length < count) throw new Error(`Beat ${starts.length} marker never appears (found ${starts.length}/${count})`)
  // End: last frame where the last marker is still present.
  let end = raw.length / 10
  for (let i = raw.length - 1; i >= 0; i--) {
    if (Math.abs(raw[i] - grey(count - 1)) <= 5) {
      end = (i + 1) / 10
      break
    }
  }
  return { starts, end }
}

/** Lay the narration at the beat times, trim to the first beat, encode to mp4. */
export function mux({ webm, starts, end, clips, out }) {
  const trim = starts[0]
  const delays = starts.map((s) => s - trim)
  for (let i = 0; i < clips.length; i++) {
    const next = i + 1 < delays.length ? delays[i + 1] : end - trim
    if (delays[i] + clips[i].dur > next + 0.05) {
      throw new Error(`Beat ${i} overrun: narration ${clips[i].dur.toFixed(1)}s but the beat lasts ${(next - delays[i]).toFixed(1)}s`)
    }
  }
  const args = ['-y', '-loglevel', 'error', '-ss', String(trim), '-to', String(end + 0.4), '-i', webm]
  clips.forEach((c) => args.push('-i', c.wav))
  const filters = clips.map((c, i) => `[${i + 1}:a]adelay=${Math.round(delays[i] * 1000)}|${Math.round(delays[i] * 1000)}[a${i}]`)
  const mixIn = clips.map((_, i) => `[a${i}]`).join('')
  filters.push(`${mixIn}amix=inputs=${clips.length}:normalize=0,loudnorm=I=-17:TP=-1.5:LRA=11[aout]`)
  args.push('-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[aout]')
  args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', '25', '-c:a', 'aac', '-b:a', '112k', '-movflags', '+faststart', out)
  const r = spawnSync('ffmpeg', args, { stdio: ['ignore', 'inherit', 'inherit'] })
  if (r.status !== 0) throw new Error('ffmpeg mux failed')
  return { delays, duration: end - trim }
}

export function poster(mp4, at, out) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(at), '-i', mp4, '-frames:v', '1', '-vf', 'scale=402:-2', '-q:v', '4', out])
}

export function videoDuration(path) {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).toString().trim())
}

/** Playwright names the recording itself; take the main page's (the largest, if a popup was recorded too). */
export function takeRecording(dir, dest) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.webm'))
    .sort((a, b) => statSync(join(dir, b)).size - statSync(join(dir, a)).size)
  if (files.length === 0) throw new Error(`No recording in ${dir}`)
  renameSync(join(dir, files[0]), dest)
  return dest
}

export function workDir(slug) {
  const d = join(CACHE, 'rec', slug)
  if (existsSync(d)) rmSync(d, { recursive: true })
  mkdirSync(d, { recursive: true })
  return d
}

export function fileSize(p) {
  return statSync(p).size
}
