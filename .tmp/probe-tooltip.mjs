/** Does the tooltip survive a channel toggle? Usage: node .tmp/probe-tooltip.mjs */

import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });

const card = page.locator('figure', { has: page.getByText('New contacts added by day') });
await card.waitFor();

const tip = () => card.locator('[role="presentation"]').count();

console.log(`after load:                 tooltips ${await tip()}`);

// A real mouse click on the toggle, which is what the shooter does.
await card.getByRole('button', { name: 'SMS' }).click();
await page.waitForTimeout(400);
console.log(`after real click on SMS:    tooltips ${await tip()}`);
console.log(`  mouse is over: ${await page.evaluate(() => document.activeElement?.textContent?.slice(0, 20))}`);

// A programmatic click, which moves no pointer at all.
await page.reload({ waitUntil: 'load' });
await card.waitFor();
await card.getByRole('button', { name: 'SMS' }).evaluate((el) => el.click());
await page.waitForTimeout(400);
console.log(`after scripted click:       tooltips ${await tip()}`);

// Hover a cell, then leave the calendar upward into the header.
await page.reload({ waitUntil: 'load' });
await card.waitFor();
const cell = card.locator('[data-day="20"]');
await cell.hover();
await page.waitForTimeout(200);
console.log(`after hovering a cell:      tooltips ${await tip()}`);
await card.locator('h3').hover();
await page.waitForTimeout(300);
console.log(`after leaving to the title: tooltips ${await tip()}`);

await browser.close();
