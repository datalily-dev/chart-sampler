/** Reports the click-rates card's height, and its parts, across widths. */

import { chromium } from 'playwright';

const browser = await chromium.launch();

for (const width of [1440, 1200, 1024, 900, 768, 600, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 1400 } });
  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await page.waitForSelector('figure');
  await page.waitForTimeout(600);
  const card = page.locator('figure', { has: page.getByRole('heading', { name: /Click rates by day/ }) });
  const box = await card.boundingBox();
  const parts = await card.evaluate((el) => {
    const kids = [...el.children];
    return kids.map((kid) => Math.round(kid.getBoundingClientRect().height));
  });
  console.log(
    `${width}: card ${Math.round(box.width)}x${Math.round(box.height)}  parts header/plot/caption ${parts.join('/')}`,
  );
  await page.close();
}

await browser.close();
