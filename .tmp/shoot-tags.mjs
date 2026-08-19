/**
 * Screenshots the three shaded cards at the report's three widths and measures
 * the tag: its width against the band it names, its height, and the 1px rules.
 */

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4321/';
const cards = [
  ['sends', 'Messages sent per day'],
  ['revenue', 'Revenue per message'],
  ['order', 'Order rates by day'],
];
const widths = [
  ['desktop', 1440],
  ['tablet', 900],
  ['mobile', 390],
];

const browser = await chromium.launch({ channel: 'chrome' });

for (const [name, width] of widths) {
  const page = await browser.newPage({ viewport: { width, height: 1400 }, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('figure svg');
  await page.waitForTimeout(1500);

  for (const [key, label] of cards) {
    const card = await page.waitForSelector(`figure:has(svg[aria-label^="${label}"])`);
    const stats = await card.evaluate((node) => {
      const rects = [...node.querySelectorAll('svg > rect')];
      const num = (r, a) => Math.round(Number(r.getAttribute(a)) * 100) / 100;
      const text = node.querySelector('svg > text');
      return {
        rects: rects.map((r) => ({
          x: num(r, 'x'),
          y: num(r, 'y'),
          w: num(r, 'width'),
          h: num(r, 'height'),
          fill: r.getAttribute('fill'),
        })),
        tagText: text?.textContent,
        tagFont: text ? getComputedStyle(text).fontSize : null,
      };
    });
    console.log(`${name.padEnd(8)} ${key.padEnd(8)}`, JSON.stringify(stats));
    await card.screenshot({ path: `.tmp/tag-${key}-${name}.png` });
  }

  await page.close();
}

await browser.close();
