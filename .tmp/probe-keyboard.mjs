/** Keyboard walk over the calendar. Usage: node .tmp/probe-keyboard.mjs */

import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });

const card = page.locator('figure', { has: page.getByText('New contacts added by day') });
await card.waitFor();
const slider = card.getByRole('slider');
const read = async () => (await slider.getAttribute('aria-valuetext')) ?? '(none)';

await slider.focus();
console.log(`on focus:        ${await read()}`);

for (const [key, label] of [
  ['ArrowRight', 'right x3'],
  ['ArrowRight', ''],
  ['ArrowRight', ''],
]) {
  await page.keyboard.press(key);
  if (label) process.stdout.write('');
}
console.log(`after 3 rights:  ${await read()}`);

await page.keyboard.press('ArrowDown');
console.log(`after down:      ${await read()}`);
await page.keyboard.press('ArrowUp');
console.log(`after up:        ${await read()}`);
await page.keyboard.press('End');
console.log(`after End:       ${await read()}`);
await page.keyboard.press('ArrowRight');
console.log(`right past end:  ${await read()}`);
await page.keyboard.press('Home');
console.log(`after Home:      ${await read()}`);
await page.keyboard.press('ArrowLeft');
console.log(`left past start: ${await read()}`);

// The tooltip should be following the selection, and be visible in the shot.
await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(200);
console.log(`tooltips shown:  ${await card.locator('[role="presentation"]').count()}`);
await card.screenshot({ path: '.tmp/shot-keyboard.png' });

await browser.close();
