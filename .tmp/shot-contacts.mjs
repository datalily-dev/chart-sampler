/** Screenshots the new-contacts card at the comp widths. Usage: node .tmp/shot-contacts.mjs */

import { chromium } from 'playwright';

const SHOTS = [
  { width: 390, name: 'mobile' },
  { width: 1000, name: 'tablet' },
  { width: 1440, name: 'desktop' },
];

const browser = await chromium.launch();

for (const { width, name } of SHOTS) {
  for (const channel of ['Email', 'SMS']) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    await page.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    const card = page.locator('figure', { has: page.getByText('New contacts added by day') });
    await card.waitFor();
    if (channel === 'SMS') await card.getByRole('button', { name: 'SMS' }).click();
    // Park the pointer clear of the card: the screenshot scrolls the element
    // into view, which would otherwise leave the cursor over a cell.
    await page.mouse.move(0, 0);
    await page.waitForTimeout(600);
    const box = await card.boundingBox();
    console.log(`${name} ${width} ${channel}: card ${Math.round(box.width)}x${Math.round(box.height)}`);
    await card.screenshot({ path: `.tmp/shot-${name}-${channel.toLowerCase()}.png` });
    await page.close();
  }
}

await browser.close();
