/**
 * Number and date formatting, ported from src/lib/format.mjs so the bundle is
 * self-contained. Kept byte-for-byte compatible with the server-rendered chart
 * so the two variants read identically to a human.
 */

/** Rounds down, one decimal at most: 1.3B, 910M, 5.4M, 772K, 0. */
export function compact(value) {
  if (value === 0) return '0';
  if (value >= 1e9) return `${roundedDown(value / 1e9)}B`;
  if (value >= 1e6) return `${roundedDown(value / 1e6)}M`;
  if (value >= 1e3) return `${roundedDown(value / 1e3)}K`;
  return String(Math.floor(value));
}

function roundedDown(n) {
  if (n >= 100) return String(Math.floor(n + 1e-9));
  const fixed = (Math.floor(n * 10 + 1e-9) / 10).toFixed(1);
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
}

export function withCommas(value) {
  return value.toLocaleString('en-US');
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function longDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export function shortDate(iso) {
  const [, month, day] = iso.split('-').map(Number);
  return `${MONTHS[month - 1].slice(0, 3)} ${day}`;
}
