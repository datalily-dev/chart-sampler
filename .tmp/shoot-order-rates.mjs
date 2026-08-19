/**
 * Screenshots the order rates card at the report's three widths and reports the
 * dot radius and the gap between day columns, so the dots can be checked for
 * merging on a phone.
 */

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4321/';
const widths = [
  ['desktop', 1440],
  ['tablet', 900],
  ['mobile', 390],
];

const browser = await chromium.launch({ channel: 'chrome' });

for (const [name, width] of widths) {
  const page = await browser.newPage({
    viewport: { width, height: 1200 },
    deviceScaleFactor: 2,
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  const card = await page.waitForSelector('figure:has(svg[aria-label^="Order rates by day"])');
  await page.waitForTimeout(1400);

  const stats = await card.evaluate((node) => {
    const dots = [...node.querySelectorAll('circle')];
    const xs = dots.map((dot) => Number(dot.getAttribute('cx')));
    const gaps = xs.slice(1).map((x, i) => x - xs[i]);
    return {
      dots: dots.length,
      radius: dots[0]?.getAttribute('r'),
      minGap: Math.round(Math.min(...gaps) * 100) / 100,
    };
  });

  await card.screenshot({ path: `.tmp/order-dots-${name}.png` });
  console.log(name.padEnd(8), `w=${width}`, JSON.stringify(stats));
  await page.close();
}

await browser.close();
