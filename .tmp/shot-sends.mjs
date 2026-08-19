/** Screenshots the sends-per-day card at a few widths. Usage: node .tmp/shot-sends.mjs */

import { chromium } from 'playwright';

const WIDTHS = [390, 768, 1024, 1440];
const browser = await chromium.launch();

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await page.waitForSelector('figure');
  await page.waitForTimeout(1200);
  const card = page.locator('figure').nth(1);
  const box = await card.boundingBox();
  console.log(`${width}: card ${Math.round(box.width)}x${Math.round(box.height)}`);
  await card.screenshot({ path: `.tmp/sends-${width}.png` });
  await page.close();
}

await browser.close();
