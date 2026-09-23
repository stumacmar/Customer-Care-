# Media pipeline

Everything that makes the Guide's videos and picture guide, kept in the
repository so it cannot be lost again (it was once — see Phase 5.8 in the
root README).

The videos are not filmed. A script drives the real app in a headless
Chromium while it is recorded, narration is synthesised from the scripts,
and the two are joined by reading timing markers back out of the recording.
Change a screen, re-run the pipeline, and every video and page is current.

## Setup (once per machine)

```
tools/media/setup.sh
```

Installs ffmpeg and poppler (apt), piper text-to-speech with the en_GB
"alba" voice, the vosk speech recogniser used to check the narration, and
Playwright. Downloads land in `tools/media/.cache/` (git-ignored).

## Regenerate everything

```
npm run build && npx vite preview --port 4173 --strictPort   # in one terminal
node tools/media/record.mjs all       # fourteen scenarios, then the tour
node tools/media/library.mjs          # src/lib/videoLibrary.ts + tour timestamps in GuideTab
node tools/media/pdfguide.mjs         # public/guide.pdf + guide-cover.jpg
python3 tools/media/stt-check.py      # every video says what its script says
```

Then bump the cache name in `public/sw.js` so installed apps fetch the new
files, rebuild, and commit `public/videos/`, `public/demo.*`, `public/guide*`,
`src/lib/videoLibrary.ts`, `src/components/GuideTab.tsx` and
`tools/media/manifest.json`.

`node tools/media/record.mjs snag delay` records only those; `tour` only the tour.

## The pieces

| File | What it does |
| --- | --- |
| `scripts.mjs` | The narration: one entry per beat with the spoken line and the on-screen caption, plus each video's title and Code reference. |
| `scenarios.mjs` | What the app shows for each beat — the clicks, typing and scrolling — and the tour. |
| `harness.mjs` | Playwright launch, the beat marker and caption overlay, title cards, beat detection, audio mix, posters; also the app-driving helpers the tests reuse. |
| `tts.mjs` | piper synthesis, cached per line. |
| `record.mjs` | Records, detects, muxes, writes posters and `manifest.json`. |
| `library.mjs` | Writes `src/lib/videoLibrary.ts` and the tour's length and "Watch in the tour" seconds in `GuideTab.tsx`, from `manifest.json`. |
| `pdfguide.mjs` | Ten annotated screenshots → A4 → `public/guide.pdf`, and the cover image. |
| `stt-check.py` | Transcribes each video and compares it with its script. |
| `pw.mjs` | Finds Playwright (project, global, or `$PLAYWRIGHT`). |

## How a recording is timed

Each beat paints a marker: an 8×8 grey square inside a 4 px black frame at
the bottom-left corner, grey = 60 + 12·k for beat k. The black frame stops
the encoder blending a white sheet into the grey. After recording, the raw
webm (never the re-encoded mp4) is sampled at 10 fps and each beat's first
frame found within ±5 of its grey. The narration for beat k is then laid at
that time; each beat is held on screen for at least its narration plus a
pad, and the build refuses to produce a video where a line would run into
the next beat.

Do not run anything else heavy — especially another Playwright session —
while a recording is in progress; a stall lengthens a beat past its
narration and the overrun check fires.

## Changing the narration

Edit `scripts.mjs`. If a beat is added or removed, add or remove the
matching `h.beat()` in `scenarios.mjs`: the recorder checks that the two
counts agree. Cached audio is re-synthesised only for lines whose text
changed.

## The product name and address

The scripts, cards and picture guide say "New Home Tracker" and, where an
address is spoken or printed, the address the app is currently served from
(`plotclock.co.uk`). If the domain changes, search this directory for it
and re-record.
