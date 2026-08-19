/** Blows up a region of a reference image so alignment can be read off it. */

import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';

const [file, x, y, w, h, out, scaleArg] = process.argv.slice(2);
const scale = Number(scaleArg ?? 3);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 1200, height: 1200 },
  deviceScaleFactor: scale,
});
await page.goto(pathToFileURL(file).href);
await page.waitForLoadState('load');
await page.addStyleTag({
  content: 'html,body{margin:0!important;background:#fff}img{margin:0!important;max-width:none!important}',
});
await page.screenshot({
  path: out,
  clip: { x: Number(x), y: Number(y), width: Number(w), height: Number(h) },
});
console.log(`wrote ${out}`);
await browser.close();
