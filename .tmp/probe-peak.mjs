/** Dumps the sends card's plot geometry around the peak, at one width. */

import { chromium } from 'playwright';

const width = Number(process.argv[2] ?? 640);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width, height: 1200 } });
await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
const card = await page.waitForSelector('figure:has(svg[aria-label^="Messages sent per day"])');
await page.waitForTimeout(1000);

console.log(
  JSON.stringify(
    await card.evaluate((node) => {
      const svg = node.querySelector('svg');
      const num = (el, a) => Math.round(Number(el.getAttribute(a)) * 10) / 10;
      const rects = [...svg.querySelectorAll(':scope > rect')].map((r) => ({
        x: num(r, 'x'),
        y: num(r, 'y'),
        w: num(r, 'width'),
        h: num(r, 'height'),
      }));
      const dots = [...svg.querySelectorAll(':scope > circle')].map((c) => ({
        x: num(c, 'cx'),
        y: num(c, 'cy'),
        r: num(c, 'r'),
      }));
      const labels = [...svg.querySelectorAll(':scope > text')].map((t) => ({
        t: t.textContent,
        x: num(t, 'x'),
        y: num(t, 'y'),
      }));
      return { svg: [svg.getAttribute('width'), svg.getAttribute('height')], rects, dots, labels };
    }),
    null,
    1,
  ),
);
await browser.close();
