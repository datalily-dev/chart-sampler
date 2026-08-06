/**
 * Build the charts pages for /charts.
 *
 * Reads the data, renders the server-rendered index and the React + D3
 * variant, and writes dist/.
 *
 * Run: node build.mjs
 */

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { toString } from './src/lib/html.mjs';
import { render as renderIndex } from './src/pages/index.mjs';
import { render as renderReactD3 } from './src/pages/embed-react-d3.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');

const readData = (name) => JSON.parse(readFileSync(join(ROOT, 'src', 'data', name), 'utf8'));

const dailySends = readData('daily-sends.json');
const peakStats = readData('peak-season-stats.json');

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const write = (name, contents) => {
  writeFileSync(join(DIST, name), typeof contents === 'string' ? contents : toString(contents));
};

write('index.html', renderIndex({ dailySends, peakStats }));
write('react.html', renderReactD3());
write('daily-sends.json', `${JSON.stringify(dailySends, null, 2)}\n`);
cpSync(join(ROOT, 'static'), DIST, { recursive: true });

const clientBundle = join(ROOT, 'client', 'dist', 'sends-per-day-react.js');
if (existsSync(clientBundle)) {
  cpSync(clientBundle, join(DIST, 'sends-per-day-react.js'));
  console.log('Built index.html + react.html plus static assets and React bundle into dist/');
} else {
  console.log('Built index.html + react.html plus static assets into dist/');
  console.log('Note: sends-per-day-react.js not found. Run "npm run build:client" in chart-sampler.');
}
