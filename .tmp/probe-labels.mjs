/**
 * Counts the value labels the sends card places, per channel and width, so the
 * BFCM tag can be checked for pushing figures off the chart.
 */

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4321/';
const widths = [1440, 1200, 1024, 900, 768, 640, 500, 390, 320];
const browser = await chromium.launch({ channel: 'chrome' });

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 1200 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  const card = await page.waitForSelector('figure:has(svg[aria-label^="Messages sent per day"])');
  await page.waitForTimeout(900);

  const counts = [];
  for (const channel of ['Email', 'SMS']) {
    await page.getByRole('button', { name: channel, exact: true }).first().click();
    await page.waitForTimeout(300);
    counts.push(
      await card.evaluate((node) => {
        const texts = [...node.querySelectorAll('svg > text')];
        // Tag, then value labels, then the date axis: the dates are the ones
        // sitting below the plot, so count what is left after dropping them.
        const dates = texts.filter((t) => /^[A-Z][a-z]{2} \d+$/.test(t.textContent)).length;
        return texts.length - dates - 1;
      }),
    );
  }

  console.log(`${String(width).padStart(5)}  email=${counts[0]}  sms=${counts[1]}  of 19`);
  await page.close();
}

await browser.close();
