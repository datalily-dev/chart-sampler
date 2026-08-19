/** Lists which sends-per-day figures are missing at a given width. */

import { chromium } from 'playwright';

const width = Number(process.argv[2] ?? 640);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width, height: 1200 } });
await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
const card = await page.waitForSelector('figure:has(svg[aria-label^="Messages sent per day"])');
await page.waitForTimeout(1000);

const shown = await card.evaluate((node) => {
  const texts = [...node.querySelectorAll('svg > text')];
  return texts
    .filter((t) => !/^[A-Z][a-z]{2} \d+$/.test(t.textContent) && t.textContent !== 'BFCM')
    .map((t) => ({ text: t.textContent, x: Math.round(Number(t.getAttribute('x'))) }));
});

console.log(`width ${width}: ${shown.length} labels`);
console.log(shown.map((s) => `${s.text}@${s.x}`).join('  '));
await browser.close();
