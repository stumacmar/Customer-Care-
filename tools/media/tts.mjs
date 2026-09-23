/*
 * Narration audio. One wav per line, made with piper (en_GB "alba" voice),
 * cached under .cache/tts/<slug>/<n>.wav next to the text it was made from,
 * so a line is only re-synthesised when its words change.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const HERE = dirname(fileURLToPath(import.meta.url))
export const CACHE = join(HERE, '.cache')
const VOICE = join(CACHE, 'voice', 'en_GB-alba-medium.onnx')

export function wavDuration(path) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).toString().trim()
  return Number(out)
}

/** Synthesise every line of a script. Returns [{ wav, dur }] in order. */
export function narration(slug, lines) {
  if (!existsSync(VOICE)) throw new Error(`Voice model missing: ${VOICE} — run tools/media/setup.sh`)
  const dir = join(CACHE, 'tts', slug)
  mkdirSync(dir, { recursive: true })
  return lines.map((line, i) => {
    const wav = join(dir, `${i}.wav`)
    const txt = join(dir, `${i}.txt`)
    const text = line.say
    if (!existsSync(wav) || !existsSync(txt) || readFileSync(txt, 'utf8') !== text) {
      execFileSync('python3', ['-m', 'piper', '-m', VOICE, '-f', wav, '--length_scale', '1.05', '--sentence_silence', '0.4'], {
        input: text,
        stdio: ['pipe', 'ignore', 'ignore'],
      })
      writeFileSync(txt, text)
    }
    return { wav, dur: wavDuration(wav), text }
  })
}
