// Minimal rename check, written to replace (a fraction of) the lost suites.
// Verifies: the new product name on every surface, the rotated access code,
// the old code reported as expired, and that existing records survive.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 402, height: 880 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await ctx.newPage();
page.on('dialog', (d) => d.accept());
const fails = [];
const check = (n, c) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + n); if (!c) fails.push(n); };
const body = () => page.textContent('body');
const OLD_HASH = '57b9b7721f58c0de65cabe0a3b67211320525eb6563f79ccc431f8a990b154c8';
const APP = 'http://localhost:4173/';

await page.goto(APP, { waitUntil: 'load' });
await page.evaluate(() => localStorage.clear());
await page.goto(APP, { waitUntil: 'load' });
await page.waitForTimeout(400);

// 1. The access screen, and the old code refused.
let b = await body();
check('access screen shows the new name', b.includes('New Home Tracker') && !b.includes('Plot Tracker'));
await page.getByPlaceholder('Access code').fill('NHQB-PLOT-2026');
await page.getByRole('button', { name: 'Continue' }).click();
await page.waitForTimeout(400);
check('the old code is refused as expired, not unrecognised', (await body()).includes('has expired'));

// 2. The new code works, typed casually.
await page.getByPlaceholder('Access code').fill('nhqb home 2026');
await page.getByPlaceholder('Access code').press('Enter');
await page.waitForTimeout(600);
b = await body();
check('the new code unlocks', !b.includes('For NHQB-registered developers'));
try { await page.getByRole('button', { name: 'Got it' }).click({ timeout: 2000 }); } catch {}

// 3. The name on the developer's surfaces.
b = await body();
check('header shows the new name', b.includes('New Home Tracker'));
await page.getByRole('button', { name: 'Settings' }).click();
await page.getByRole('button', { name: 'Load demo data' }).click();
await page.waitForTimeout(900);
await page.getByRole('button', { name: 'Settings' }).click();
await page.waitForTimeout(300);
b = await body();
check('Settings "about" names the app correctly', b.includes('NHQB New Home Tracker') && !b.includes('Plot Tracker'));
await page.mouse.click(201, 40);
await page.waitForTimeout(300);

// 4. The builder's own vocabulary is deliberately untouched (checked on the
//    plot screen, where it lives — not the developments list).
await page.getByText('Meadow View').first().click();
await page.waitForTimeout(400);
b = await body();
check('the developer still sees "plot" (Code 2.2h expects a plot number)', /\bPlot\b/.test(b));
await page.locator('.plot-card').first().click();
await page.waitForTimeout(400);

// 5. The customer's page and the email they send. Their page deliberately never
//    names the product — the header reads "My new home" — so the test is that
//    the old name is absent, and that the landing page carries the new one.
await page.getByRole('button', { name: 'Share with customer' }).click();
await page.waitForTimeout(600);
await page.getByRole('button', { name: /Copy link/ }).click();
await page.waitForTimeout(250);
const link = await page.evaluate(() => navigator.clipboard.readText());
const cust = await (await browser.newContext({ viewport: { width: 402, height: 880 }, permissions: ['clipboard-read', 'clipboard-write'] })).newPage();
await cust.goto(link, { waitUntil: 'load' });
await cust.waitForTimeout(600);
const cb = await cust.textContent('body');
check('customer page is about their home, and never shows the old name', cb.includes('My new home') && !cb.includes('Plot Tracker'));
await cust.getByRole('button', { name: /Report a problem/ }).click();
await cust.waitForTimeout(300);
await cust.getByText('Timescales or delay', { exact: true }).click();
await cust.waitForTimeout(300);
await cust.locator('.scrim textarea').first().fill('Checking the rename.');
await cust.getByRole('button', { name: /Copy to send another way/ }).click();
await cust.waitForTimeout(300);
const email = await cust.evaluate(() => navigator.clipboard.readText());
check("the customer's email carries the new name", email.includes('log it in New Home Tracker') && !email.includes('Plot Tracker'));
// A fresh visitor, because a browser that has already opened a real link
// restores that snapshot instead of showing the landing page.
const fresh = await (await browser.newContext({ viewport: { width: 402, height: 880 } })).newPage();
await fresh.goto(APP + '#/buyer', { waitUntil: 'load' });
await fresh.waitForTimeout(600);
check('the landing page (no link) shows the new name', (await fresh.textContent('body')).includes('NHQB New Home Tracker'));

// 6. Existing records must survive a rename: storage keys were not touched.
const stored = await page.evaluate(() => Object.keys(localStorage).sort());
check('storage keys unchanged, so nobody loses their records', stored.includes('plot-clock-state-v1'));
const plots = await page.evaluate(() => JSON.parse(localStorage.getItem('plot-clock-state-v1')).plots.length);
check('demo records still load', plots > 0);

await browser.close();
console.log(fails.length ? 'FAILURES: ' + fails.join(' | ') : 'ALL PASS');
