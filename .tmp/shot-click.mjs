/** Screenshots the click-rates card, both tabs, at a phone and a desktop width. */

import { chromium } from 'playwright';

const browser = await chromium.launch();

for (const width of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 1200 } });
  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await page.waitForSelector('figure');
  await page.waitForTimeout(800);
  const card = page.locator('figure').nth(2);
  for (const channel of ['Email', 'SMS']) {
    await card.getByRole('button', { name: channel }).click();
    await page.waitForTimeout(1200);
    const box = await card.boundingBox();
    console.log(`${width} ${channel}: ${Math.round(box.width)}x${Math.round(box.height)}`);
    await card.screenshot({ path: `.tmp/click-${width}-${channel.toLowerCase()}.png` });
  }
  await page.close();
}

await browser.close();
