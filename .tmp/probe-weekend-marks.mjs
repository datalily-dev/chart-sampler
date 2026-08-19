/**
 * Reads the weekend band edge marks off the order rates card at the three
 * report widths: their count and geometry, plus a tight crop of the first two
 * bands so the 5px rules can be eyeballed against the top gridline.
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
  const page = await browser.newPage({ viewport: { width, height: 1200 }, deviceScaleFactor: 3 });
  await page.goto(url, { waitUntil: 'networkidle' });
  const card = await page.waitForSelector('figure:has(svg[aria-label^="Order rates by day"])');
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);

  const info = await card.evaluate((node) => {
    const marks = [...node.querySelectorAll('rect[shape-rendering="crispEdges"]')].map((r) => ({
      x: Number(r.getAttribute('x')),
      y: Number(r.getAttribute('y')),
      w: Number(r.getAttribute('width')),
      h: Number(r.getAttribute('height')),
    }));
    const bands = [...node.querySelectorAll('g > rect:first-child')].map((r) => ({
      x: Number(r.getAttribute('x')),
      w: Number(r.getAttribute('width')),
    }));
    const svg = node.querySelector('svg').getBoundingClientRect();
    return { marks, bands, svg: { x: svg.x, y: svg.y } };
  });

  const bandMarks = info.marks.filter((m) => m.h === 5);
  const first = bandMarks[0];
  console.log(
    name.padEnd(8),
    `w=${width}`,
    `marks=${bandMarks.length}`,
    `bands=${info.bands.length}`,
    `bandWidth=${info.bands[0] ? Math.round(info.bands[0].w * 100) / 100 : 'n/a'}`,
    `first=${JSON.stringify(first)}`,
  );

  if (first) {
    await page.screenshot({
      path: `.tmp/weekend-marks-${name}.png`,
      clip: {
        x: info.svg.x + first.x - 30,
        y: info.svg.y + first.y - 12,
        width: Math.min(340, width - 40),
        height: 34,
      },
    });
  }
  await page.close();
}

await browser.close();
