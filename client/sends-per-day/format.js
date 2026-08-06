/**
 * Number and date formatting, ported from src/lib/format.mjs so the bundle is
 * self-contained. Kept byte-for-byte compatible with the server-rendered chart
 * so the two variants read identically to a human.
 */

export function compact(value) {
  if (value === 0) return '0';
  if (value >= 1e9) return `${trimZeros(value / 1e9)}B`;
  if (value >= 1e6) return `${trimZeros(value / 1e6)}M`;
  if (value >= 1e3) return `${trimZeros(value / 1e3)}K`;
  return String(value);
}

function trimZeros(n) {
  const fixed = n >= 100 ? n.toFixed(0) : n.toFixed(n >= 10 ? 1 : 2);
  return fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed;
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
