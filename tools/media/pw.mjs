/*
 * Playwright is not a dependency of the app, so it is resolved from wherever
 * it is installed: the project, a global npm install, or $PLAYWRIGHT.
 */
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const require = createRequire(import.meta.url)

function locate() {
  if (process.env.PLAYWRIGHT) return process.env.PLAYWRIGHT
  try {
    return require.resolve('playwright')
  } catch {
    /* not local */
  }
  try {
    const root = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    const p = join(root, 'playwright', 'index.js')
    if (existsSync(p)) return p
  } catch {
    /* no npm */
  }
  throw new Error('Playwright not found — npm install -g playwright, or set PLAYWRIGHT to its index.js')
}

const mod = await import(locate())
export const chromium = mod.chromium || mod.default.chromium
export const CHROMIUM_PATH = process.env.CHROMIUM || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)
