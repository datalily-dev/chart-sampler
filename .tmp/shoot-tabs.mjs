/** Crops a screenshot to the metric tab strip of the holiday performance card. */

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4321/';
const out = process.argv[3] ?? '.tmp/tabs-after.png';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 1280, height: 1400 },
  deviceScaleFactor: 2,
});
await page.goto(url, { waitUntil: 'networkidle' });
const tabs = await page.waitForSelector('[aria-label="Choose a metric"]');
await tabs.screenshot({ path: out });
console.log(`wrote ${out}`);
await browser.close();
