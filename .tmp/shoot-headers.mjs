/** Crops each card's header block at a given width, one PNG per card. */

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4321/';
const width = Number(process.argv[3] ?? 390);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width, height: 1000 },
  deviceScaleFactor: 2,
});
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

const groups = await page.$$('[aria-label="Choose a channel"]');
for (const [index, group] of groups.entries()) {
  const header = await group.evaluateHandle((el) => el.parentElement);
  const slug = await group.evaluate((el) =>
    el.closest('figure').querySelector('h3').textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 28),
  );
  const path = `.tmp/hdr-${width}-${index}-${slug}.png`;
  await header.asElement().screenshot({ path });
  console.log(`wrote ${path}`);
}

await browser.close();
