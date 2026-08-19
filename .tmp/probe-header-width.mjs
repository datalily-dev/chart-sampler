/** Header content width per card, to check a basis against the wrap threshold. */

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4321/';
const widths = [768, 900, 1024, 1100, 1280, 1440];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1024, height: 1000 } });
await page.goto(url, { waitUntil: 'networkidle' });

for (const width of widths) {
  await page.setViewportSize({ width, height: 1000 });
  await page.waitForTimeout(250);
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-label="Choose a channel"]')].map((group) => ({
      title: group.closest('figure').querySelector('h3').textContent.trim().slice(0, 34),
      header: Math.round(group.parentElement.getBoundingClientRect().width),
    })),
  );
  console.log(`\n=== ${width}px ===`);
  for (const row of rows) console.log(`header=${row.header}  ${row.title}`);
}

await browser.close();
