/**
 * Screenshots the holiday performance card and reports, per row, where each line
 * of the name starts, so a wrapped name can be checked for hanging under its own
 * first line rather than under the date. Also prints the row's text as it would
 * be copied, which the leading space in the name span is there to protect.
 */

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4321/';
const width = Number(process.argv[3] ?? 390);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width, height: 1400 },
  deviceScaleFactor: 2,
});
await page.goto(url, { waitUntil: 'networkidle' });
const card = await page.waitForSelector('figure:has([aria-label="Choose a metric"])');

const rows = await card.$$eval('li', (items) =>
  items.map((item) => {
    const grid = item.querySelector('span');
    const [date, name] = grid.children;
    const round = (n) => Math.round(n * 10) / 10;
    const mid = (el) => {
      const r = el.getBoundingClientRect();
      return round(r.top + r.height / 2);
    };
    // The name span is a grid item, so it is blockified and reports one rect for
    // the whole box; a Range over its text still reports one rect per line.
    const range = document.createRange();
    range.selectNodeContents(name);
    const lineBoxes = [...range.getClientRects()].filter((r) => r.width > 1);

    return {
      copied: grid.textContent,
      lines: lineBoxes.length,
      lineStarts: lineBoxes.map((b) => round(b.left)).join(' | '),
      dateLeft: round(date.getBoundingClientRect().left),
      dateMid: mid(date),
      nameMid: mid(name),
    };
  }),
);

console.log(`viewport ${width}`);
console.table(rows.filter((r) => r.lines > 1 || r.copied.includes('Halloween')));
await card.screenshot({ path: `.tmp/holiday-rows-${width}.png` });
await browser.close();
