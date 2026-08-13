/**
 * Smoke test: the built page must carry everything the React bundle needs.
 *
 * The chart itself is client-rendered, so there is nothing in the HTML to probe
 * for figures. What the shell must still get right is the mount point, the
 * bundle reference, the stylesheets, and the surrounding article prose.
 *
 * Run: node build.mjs && node scripts/smoke.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const body = readFileSync(join(DIST, 'index.html'), 'utf8');

const CHECKS = [
  { label: 'React mount point', needle: 'data-sends-per-day-react' },
  { label: 'React bundle', needle: 'sends-per-day-react.js' },
  { label: 'Design tokens', needle: 'tokens.css' },
  { label: 'Component styles', needle: 'components.css' },
  { label: 'Article heading', needle: 'Email drives more overall peak season revenue' },
];

const missing = CHECKS.filter((check) => !body.includes(check.needle));

if (missing.length) {
  console.error(`Smoke failed: ${missing.length} of ${CHECKS.length} checks missing from index.html`);
  for (const check of missing) {
    console.error(`  MISSING  ${check.label}  ${check.needle}`);
  }
  process.exit(1);
}

console.log(`Smoke passed: ${CHECKS.length} of ${CHECKS.length} checks present in index.html`);
