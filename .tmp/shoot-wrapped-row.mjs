/** Close-up of the two holiday rows whose names wrap on a phone. */

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4321/';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 4 });
await page.goto(url, { waitUntil: 'networkidle' });
const card = await page.waitForSelector('figure:has([aria-label="Choose a metric"])');

for (const [name, needle] of [
  ['veterans', "Veteran's"],
  ['smallbiz', 'Small Business'],
]) {
  const row = await card.$(`li:has-text("${needle}")`);
  await row.screenshot({ path: `.tmp/row-${name}.png` });
  console.log(`wrote .tmp/row-${name}.png`);
}

await browser.close();
