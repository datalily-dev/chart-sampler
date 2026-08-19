/**
 * Reports the computed letter-spacing and text width of each metric tab in the
 * holiday performance card, so the tracking can be compared tab by tab.
 */

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4321/';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('[aria-label="Choose a metric"] [role="tab"]');

const rows = await page.$$eval('[aria-label="Choose a metric"] [role="tab"]', (tabs) =>
  tabs.map((tab) => {
    const style = getComputedStyle(tab);
    return {
      label: tab.textContent,
      letterSpacing: style.letterSpacing,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      width: Math.round(tab.getBoundingClientRect().width * 100) / 100,
      selected: tab.getAttribute('aria-selected'),
    };
  }),
);

console.table(rows);
await browser.close();
