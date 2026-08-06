/**
 * Smoke test: the server-rendered page must keep every crawler probe.
 *
 * Run: node build.mjs && node scripts/smoke.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { PROBES } from './crawler-view.mjs';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const body = readFileSync(join(DIST, 'index.html'), 'utf8');

const missing = PROBES.filter((probe) => !body.includes(probe.needle));

if (missing.length) {
  console.error(
    `Smoke failed: ${missing.length} of ${PROBES.length} probes missing from index.html`,
  );
  for (const probe of missing) {
    console.error(`  MISSING  ${probe.label}  ${probe.needle}`);
  }
  process.exit(1);
}

console.log(`Smoke passed: ${PROBES.length} of ${PROBES.length} probes present in index.html`);
