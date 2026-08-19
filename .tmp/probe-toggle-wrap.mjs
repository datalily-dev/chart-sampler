/** Reports, per card and per width, whether the channel toggle wraps below the title. */

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4321/';
const widths = [360, 390, 412, 430, 480, 560, 640, 768];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 1200 } });
await page.goto(url, { waitUntil: 'networkidle' });

for (const width of widths) {
  await page.setViewportSize({ width, height: 1200 });
  await page.waitForTimeout(250);
  const rows = await page.evaluate(() => {
    const out = [];
    for (const group of document.querySelectorAll('[aria-label="Choose a channel"]')) {
      const figure = group.closest('figure');
      const title = figure?.querySelector('h3');
      if (!title) continue;
      const t = title.getBoundingClientRect();
      const g = group.getBoundingClientRect();
      out.push({
        title: title.textContent.trim().slice(0, 42),
        below: g.top >= t.bottom - 1,
        toggleLeft: Math.round(g.left),
        toggleTop: Math.round(g.top),
        titleBottom: Math.round(t.bottom),
        toggleWidth: Math.round(g.width),
      });
    }
    return out;
  });
  console.log(`\n=== ${width}px ===`);
  for (const row of rows) {
    console.log(
      `${row.below ? 'BELOW' : 'RIGHT'}  tw=${row.toggleWidth} tl=${row.toggleLeft} ` +
        `gTop=${row.toggleTop} titleBottom=${row.titleBottom}  ${row.title}`,
    );
  }
}

await browser.close();
