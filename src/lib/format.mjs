/** Number formatting shared by the axis, the tooltips, and the data tables. */

/** Axis and tooltip style: 1.39B, 910M, 5.4M, 0. */
export function compact(value) {
  if (value === 0) return '0';
  if (value >= 1e9) return `${trimZeros(value / 1e9)}B`;
  if (value >= 1e6) return `${trimZeros(value / 1e6)}M`;
  if (value >= 1e3) return `${trimZeros(value / 1e3)}K`;
  return String(value);
}

function trimZeros(n) {
  const fixed = n >= 100 ? n.toFixed(0) : n.toFixed(n >= 10 ? 1 : 2);
  // Only strip zeros that sit after a decimal point, so 900 stays 900.
  return fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed;
}

/** Table style: 1,390,289,396. */
export function withCommas(value) {
  return value.toLocaleString('en-US');
}

/** Prose style: "1.39 billion", for the plain-text takeaway sentences. */
export function spelled(value) {
  if (value >= 1e9) return `${trimZeros(value / 1e9)} billion`;
  if (value >= 1e6) return `${trimZeros(value / 1e6)} million`;
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
