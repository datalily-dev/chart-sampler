/** Number formatting shared by the axis, the tooltips, and the data tables. */

/**
 * Axis, dot-label, and prose style: 1.3B, 910M, 5.4M, 772K, 0.
 *
 * Always rounds down, and never shows more than one decimal, so a short label
 * can only ever understate the figure behind it: 1,390,289,396 reads 1.3B, not
 * 1.4B. The exact number is still one hover (or one table row) away.
 */
export function compact(value) {
  if (value === 0) return '0';
  if (value >= 1e9) return `${roundedDown(value / 1e9)}B`;
  if (value >= 1e6) return `${roundedDown(value / 1e6)}M`;
  if (value >= 1e3) return `${roundedDown(value / 1e3)}K`;
  return String(Math.floor(value));
}

function roundedDown(n) {
  // The epsilon absorbs float-division noise, so 1.2 never arrives as 1.19999.
  if (n >= 100) return String(Math.floor(n + 1e-9));
  const fixed = (Math.floor(n * 10 + 1e-9) / 10).toFixed(1);
  // Drop a bare ".0" so 900 stays 900 rather than 900.0.
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
}

/** Table style: 1,390,289,396. */
export function withCommas(value) {
  return value.toLocaleString('en-US');
}

/** Prose style: "1.3 billion", for the plain-text takeaway sentences. */
export function spelled(value) {
  if (value >= 1e9) return `${roundedDown(value / 1e9)} billion`;
  if (value >= 1e6) return `${roundedDown(value / 1e6)} million`;
  return withCommas(value);
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2025-11-28" to "November 28, 2025". Parsed manually to dodge timezone drift. */
export function longDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

/** "2025-11-28" to "Nov 28". */
export function shortDate(iso) {
  const [, month, day] = iso.split('-').map(Number);
  return `${MONTHS[month - 1].slice(0, 3)} ${day}`;
}
