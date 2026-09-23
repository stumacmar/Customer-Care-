/*
 * Record the videos.
 *
 *   node tools/media/record.mjs all          every scenario, then the tour
 *   node tools/media/record.mjs snag delay   just those
 *   node tools/media/record.mjs tour         the tour only
 *
 * Needs the built app served at $APP_URL (default http://localhost:4173/):
 *   npm run build && npx vite preview --port 4173 --strictPort
 *
 * Outputs public/videos/<slug>.mp4 + .jpg, public/demo.mp4 + .jpg, and
 * updates tools/media/manifest.json, from which library.mjs writes
 * src/lib/videoLibrary.ts and the Guide's tour timestamps.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { ORDER, SCENARIOS, TOUR } from './scripts.mjs'
import { SCENARIO_RUNNERS, tour } from './scenarios.mjs'
import { narration, HERE } from './tts.mjs'
import { detectBeats, Harness, launch, mux, poster, takeRecording, videoDuration, workDir } from './harness.mjs'

const ROOT = resolve(HERE, '..', '..')
const MANIFEST = join(HERE, 'manifest.json')
const PUBLIC = join(ROOT, 'public')

function loadManifest() {
  return existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { videos: {}, tour: {} }
}

async function recordOne(slug, script, run, out) {
  console.log(`\n▶ ${slug}`)
  const clips = narration(slug, script.lines)
  const dir = workDir(slug)
  const { browser, ctx, page } = await launch({ video: dir })
  const h = new Harness(page, clips.map((c) => c.dur), { captions: script.lines.map((l) => l.cap || '') })
  let failed = null
  try {
    await run(h, page, script)
    await h.end()
  } catch (e) {
    failed = e
    try {
      await page.screenshot({ path: join(dir, 'failure.png') })
    } catch {
      /* page gone */
    }
  }
  await ctx.close()
  await browser.close()
  if (failed) throw failed
  if (h.k !== clips.length - 1) throw new Error(`${slug}: ${h.k + 1} beats recorded, script has ${clips.length} lines`)
  const webm = takeRecording(dir, join(dir, 'raw.webm'))
  const { starts, end } = detectBeats(webm, clips.length)
  const { delays, duration } = mux({ webm, starts, end, clips, out })
  console.log(`  beats at ${delays.map((d) => d.toFixed(1)).join(' ')}  · ${duration.toFixed(1)}s`)
  return { delays, duration: Math.round(videoDuration(out)) }
}

const args = process.argv.slice(2)
const wantTour = args.includes('all') || args.includes('tour')
const slugs = args.includes('all') ? ORDER : args.filter((a) => a !== 'tour')
for (const s of slugs) if (!SCENARIOS[s]) throw new Error(`Unknown scenario ${s}`)

const manifest = loadManifest()
for (const slug of slugs) {
  const script = SCENARIOS[slug]
  const out = join(PUBLIC, 'videos', `${slug}.mp4`)
  const { delays, duration } = await recordOne(slug, script, SCENARIO_RUNNERS[slug], out)
  // Poster: a moment into the first "doing" beat, past the title card.
  poster(out, delays[1] + 1.4, join(PUBLIC, 'videos', `${slug}.jpg`))
  manifest.videos[slug] = { title: script.title, code: script.code, duration, beats: delays.map((d) => Math.round(d * 10) / 10) }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
}
if (wantTour) {
  const out = join(PUBLIC, 'demo.mp4')
  const { delays, duration } = await recordOne('demo', TOUR, tour, out)
  poster(out, delays[2] + 1.2, join(PUBLIC, 'demo.jpg'))
  manifest.tour = {
    duration,
    beats: delays.map((d) => Math.round(d * 10) / 10),
    // The Guide's "Watch in the tour" chips: "Reading the screen" = the plot screen beat, "Sharing" = the share beat.
    watchAt: { 'Reading the screen': Math.floor(delays[3]), 'Sharing with your customer': Math.floor(delays[10]) },
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
}
console.log('\nDone. Now: node tools/media/library.mjs')
