/**
 * Regenerates src/data/order-rates.json.
 *
 * RATES below is the source of truth: 62 days, October 31 to December 31 2025,
 * transcribed from the handoff tables. Each row carries three numbers:
 *
 *   published  the two-decimal figure printed in the handoff table
 *   email      the same day read off the published chart, to four decimals
 *   sms        the SMS figure, at the two decimals the table publishes
 *
 * Email needs the extra precision for the same reason revenue-per-message.json
 * does. Rounded to hundredths of a percent the whole email series is four
 * distinct values, so the line draws as a staircase and the weekly rhythm the
 * chart exists to show disappears. The finer figures are traced from the
 * published chart rather than invented, and every one of them is checked here
 * against the two-decimal figure in the table: if a traced value would print as
 * anything other than what the table publishes, the run stops. SMS spans 0.03%
 * to 0.25%, which is twenty-three steps, so it needs no such treatment.
 *
 * Run: node scripts/derive-order-rates.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'order-rates.json');

const SERIES = {
  email: {
    label: 'Email',
    unit: 'order rate',
    note:
      'Order rate by day for Mailchimp customers on free and paid plans with a connected ' +
      'ecommerce store, October 31-December 31, 2025, weekends shaded',
    axisMax: 0.04,
    axisTicks: [0, 0.01, 0.02, 0.03, 0.04],
  },
  sms: {
    label: 'SMS',
    unit: 'order rate',
    note:
      'Order rate by day for Mailchimp customers on free and paid plans with a connected ' +
      'ecommerce store, October 31-December 31, 2025, weekends shaded',
    axisMax: 0.25,
    axisTicks: [0, 0.05, 0.1, 0.15, 0.2, 0.25],
  },
};

/** Order rate as a percentage: 0.0148 is 0.0148%, not 1.48%. */
const RATES = {
  '2025-10-31': { published: 0.01, email: 0.0148, sms: 0.09, holiday: 'Halloween' },
  '2025-11-01': { published: 0.03, email: 0.028, sms: 0.23 },
  '2025-11-02': { published: 0.03, email: 0.0281, sms: 0.13 },
  '2025-11-03': { published: 0.02, email: 0.0181, sms: 0.1 },
  '2025-11-04': { published: 0.01, email: 0.0134, sms: 0.06 },
  '2025-11-05': { published: 0.01, email: 0.0131, sms: 0.08 },
  '2025-11-06': { published: 0.01, email: 0.0122, sms: 0.05 },
  '2025-11-07': { published: 0.01, email: 0.0127, sms: 0.08 },
  '2025-11-08': { published: 0.02, email: 0.0223, sms: 0.14 },
  '2025-11-09': { published: 0.03, email: 0.0256, sms: 0.13 },
  '2025-11-10': { published: 0.01, email: 0.0149, sms: 0.09 },
  '2025-11-11': { published: 0.02, email: 0.016, sms: 0.06 },
  '2025-11-12': { published: 0.01, email: 0.0142, sms: 0.07 },
  '2025-11-13': { published: 0.01, email: 0.0124, sms: 0.06 },
  '2025-11-14': { published: 0.01, email: 0.0135, sms: 0.1 },
  '2025-11-15': { published: 0.03, email: 0.025, sms: 0.25 },
  '2025-11-16': { published: 0.03, email: 0.0298, sms: 0.16 },
  '2025-11-17': { published: 0.02, email: 0.0241, sms: 0.1 },
  '2025-11-18': { published: 0.01, email: 0.0149, sms: 0.05 },
  '2025-11-19': { published: 0.01, email: 0.014, sms: 0.06 },
  '2025-11-20': { published: 0.01, email: 0.0136, sms: 0.07 },
  '2025-11-21': { published: 0.02, email: 0.0226, sms: 0.08 },
  '2025-11-22': { published: 0.03, email: 0.0294, sms: 0.14 },
  '2025-11-23': { published: 0.03, email: 0.0263, sms: 0.17 },
  '2025-11-24': { published: 0.02, email: 0.0205, sms: 0.08 },
  '2025-11-25': { published: 0.02, email: 0.0169, sms: 0.08 },
  '2025-11-26': { published: 0.02, email: 0.016, sms: 0.07, holiday: 'Pre-Thanksgiving Day' },
  '2025-11-27': { published: 0.02, email: 0.0165, sms: 0.09, holiday: 'Thanksgiving' },
  '2025-11-28': { published: 0.03, email: 0.027, sms: 0.08, holiday: 'Black Friday' },
  '2025-11-29': { published: 0.04, email: 0.0377, sms: 0.18, holiday: 'Small Business Saturday' },
  '2025-11-30': { published: 0.04, email: 0.0377, sms: 0.16 },
  '2025-12-01': { published: 0.02, email: 0.0249, sms: 0.11, holiday: 'Cyber Monday' },
  '2025-12-02': { published: 0.02, email: 0.0202, sms: 0.08, holiday: 'Giving Tuesday' },
  '2025-12-03': { published: 0.01, email: 0.0145, sms: 0.06 },
  '2025-12-04': { published: 0.01, email: 0.0141, sms: 0.08 },
  '2025-12-05': { published: 0.01, email: 0.0149, sms: 0.09 },
  '2025-12-06': { published: 0.03, email: 0.0268, sms: 0.19 },
  '2025-12-07': { published: 0.03, email: 0.0257, sms: 0.15 },
  '2025-12-08': { published: 0.02, email: 0.0187, sms: 0.07 },
  '2025-12-09': { published: 0.01, email: 0.0143, sms: 0.08 },
  '2025-12-10': { published: 0.01, email: 0.0128, sms: 0.04 },
  '2025-12-11': { published: 0.01, email: 0.0149, sms: 0.04 },
  '2025-12-12': { published: 0.02, email: 0.0218, sms: 0.07 },
  '2025-12-13': { published: 0.03, email: 0.0262, sms: 0.12 },
  '2025-12-14': { published: 0.03, email: 0.025, sms: 0.09 },
  '2025-12-15': { published: 0.02, email: 0.0161, sms: 0.04 },
  '2025-12-16': { published: 0.01, email: 0.0126, sms: 0.03 },
  '2025-12-17': { published: 0.01, email: 0.0109, sms: 0.04 },
  '2025-12-18': { published: 0.01, email: 0.0122, sms: 0.05 },
  '2025-12-19': { published: 0.01, email: 0.0149, sms: 0.05 },
  '2025-12-20': { published: 0.02, email: 0.02, sms: 0.11 },
  '2025-12-21': { published: 0.02, email: 0.0187, sms: 0.09 },
  '2025-12-22': { published: 0.01, email: 0.0146, sms: 0.03 },
  '2025-12-23': { published: 0.01, email: 0.0103, sms: 0.04 },
  '2025-12-24': { published: 0.01, email: 0.011, sms: 0.06, holiday: 'Christmas Eve' },
  '2025-12-25': { published: 0.01, email: 0.0145, sms: 0.09, holiday: 'Christmas Day' },
  '2025-12-26': { published: 0.02, email: 0.0194, sms: 0.05, holiday: 'Boxing Day' },
  '2025-12-27': { published: 0.02, email: 0.023, sms: 0.07 },
  '2025-12-28': { published: 0.02, email: 0.0204, sms: 0.08 },
  '2025-12-29': { published: 0.01, email: 0.0123, sms: 0.04 },
  '2025-12-30': { published: 0.01, email: 0.011, sms: 0.04 },
  '2025-12-31': { published: 0.01, email: 0.011, sms: 0.05, holiday: "New Year's Eve" },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** UTC throughout: these are calendar dates, not moments. */
const weekdayOf = (iso) => WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()];

/** Two decimals, half up, which is how the handoff table prints its figures. */
const printed = (value) => Math.round(value * 100 + 1e-9) / 100;

const problems = [];
const dates = Object.keys(RATES);

if (dates.length !== 62) {
  problems.push(`${dates.length} days transcribed; October 31 to December 31 is 62`);
}

for (const [date, day] of Object.entries(RATES)) {
  if (printed(day.email) !== day.published) {
    problems.push(
      `${date} email: ${day.email} prints as ${printed(day.email).toFixed(2)}%, but the table ` +
        `publishes ${day.published.toFixed(2)}%`,
    );
  }
  if (day.email > SERIES.email.axisMax) {
    problems.push(`${date} email: ${day.email}% is above the ${SERIES.email.axisMax}% axis`);
  }
  if (day.sms > SERIES.sms.axisMax) {
    problems.push(`${date} sms: ${day.sms}% is above the ${SERIES.sms.axisMax}% axis`);
  }
  if (printed(day.sms) !== day.sms) {
    problems.push(`${date} sms: ${day.sms} is finer than the two decimals the table publishes`);
  }
}

if (problems.length) {
  console.error(`Refusing to write: ${problems.length} value(s) fail their check`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

const points = Object.entries(RATES).map(([date, day]) => {
  const point = { date, weekday: weekdayOf(date), email: day.email, sms: day.sms };
  if (day.holiday) point.holiday = day.holiday;
  return point;
});

const data = {
  title: 'Order rates by day during peak season 2025',
  range: 'October 31 - December 31',
  source: 'Breaking Through Peak Season Noise Report, September 2026',
  series: SERIES,
  points,
  notes:
    'Email figures carry four decimals because the two-decimal series only spans four steps and ' +
    'draws as a staircase; each one prints as the figure the handoff table publishes, which ' +
    'scripts/derive-order-rates.mjs checks before writing. Weekends are shaded from the weekday ' +
    'field; the holiday field names the day on the tooltip.',
};

writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);

console.log(`Wrote ${points.length} points to src/data/order-rates.json`);

for (const [key, series] of Object.entries(SERIES)) {
  const peak = points.reduce((a, b) => (b[key] > a[key] ? b : a));
  const weekend = points.filter((p) => p.weekday === 'Sat' || p.weekday === 'Sun');
  const weekday = points.filter((p) => p.weekday !== 'Sat' && p.weekday !== 'Sun');
  const mean = (list) => list.reduce((sum, p) => sum + p[key], 0) / list.length;
  console.log(
    `  ${series.label.padEnd(5)} peak ${peak[key]}% on ${peak.date} ` +
      `(${peak.holiday ?? peak.weekday}), weekend average ${mean(weekend).toFixed(4)}%, ` +
      `weekday average ${mean(weekday).toFixed(4)}%`,
  );
}
