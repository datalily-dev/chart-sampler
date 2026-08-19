/**
 * Regenerates src/data/daily-sends.json.
 *
 * Every day in the window has a published figure, so SENDS below is the source
 * of truth and the series is written out verbatim. Values are transcribed by
 * hand, so each one is checked against its axis domain before being written: a
 * misplaced digit lands outside the plottable range and stops the run.
 *
 * Run: node scripts/derive-series.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'daily-sends.json');

const SERIES = {
  email: {
    label: 'Email',
    title: 'Emails sent per day during BFCM 2025',
    unit: 'emails',
    axisMax: 1.5e9,
    axisTicks: [0, 3e8, 6e8, 9e8, 1.2e9, 1.5e9],
  },
  sms: {
    label: 'SMS',
    title: 'SMS sent per day during BFCM 2025',
    unit: 'text messages',
    axisMax: 6e6,
    axisTicks: [0, 1.5e6, 3e6, 4.5e6, 6e6],
  },
};

/** Published daily figures, November 20 to December 8, 2025. */
const SENDS = {
  '2025-11-20': { email: 953_360_234, sms: 1_265_875 },
  '2025-11-21': { email: 946_589_375, sms: 1_745_337 },
  '2025-11-22': { email: 411_027_583, sms: 635_572 },
  '2025-11-23': { email: 364_090_006, sms: 461_892 },
  '2025-11-24': { email: 890_835_547, sms: 1_536_182 },
  '2025-11-25': { email: 1_030_004_886, sms: 1_895_030 },
  '2025-11-26': { email: 1_013_302_698, sms: 1_654_653, holiday: 'Pre-Thanksgiving Day' },
  '2025-11-27': { email: 929_582_577, sms: 1_517_036, holiday: 'Thanksgiving' },
  '2025-11-28': { email: 1_390_289_396, sms: 5_430_859, holiday: 'Black Friday' },
  '2025-11-29': { email: 541_884_269, sms: 1_555_037, holiday: 'Small Business Saturday' },
  '2025-11-30': { email: 565_537_819, sms: 938_713 },
  '2025-12-01': { email: 1_300_247_595, sms: 3_405_629, holiday: 'Cyber Monday' },
  '2025-12-02': { email: 1_153_007_717, sms: 2_429_545, holiday: 'Giving Tuesday' },
  '2025-12-03': { email: 875_176_041, sms: 1_890_480 },
  '2025-12-04': { email: 922_316_136, sms: 1_807_044 },
  '2025-12-05': { email: 886_884_461, sms: 2_471_481 },
  '2025-12-06': { email: 394_764_686, sms: 663_979 },
  '2025-12-07': { email: 339_551_035, sms: 489_669 },
  '2025-12-08': { email: 706_802_909, sms: 1_459_562 },
};

const problems = [];

for (const [date, day] of Object.entries(SENDS)) {
  for (const [key, series] of Object.entries(SERIES)) {
    const value = day[key];

    if (!Number.isInteger(value) || value <= 0) {
      problems.push(`${date} ${key}: ${value} is not a positive whole number of ${series.unit}`);
    } else if (value > series.axisMax) {
      problems.push(
        `${date} ${key}: ${value.toLocaleString('en-US')} exceeds the ${series.label} axis max ` +
          `of ${series.axisMax.toLocaleString('en-US')}`,
      );
    }
  }
}

if (problems.length) {
  console.error(`Refusing to write: ${problems.length} value(s) outside the plottable range`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

const points = Object.entries(SENDS).map(([date, day]) => {
  const point = { date, email: day.email, sms: day.sms };
  if (day.holiday) point.holiday = day.holiday;
  return point;
});

const data = {
  title: 'Messages sent per day during BFCM 2025',
  range: 'November 20 - December 8',
  source: 'Breaking Through Peak Season Noise Report, September 2026',
  // One note for both channels, because the population and the window are the
  // same on either tab; the sibling charts carry theirs per series only where
  // the two channels cover different days.
  note:
    'Daily messages sent by Mailchimp customers on free and paid plans, ' +
    'November 20-December 8, 2025',
  series: SERIES,
  points,
};

writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);

console.log(`Wrote ${points.length} points to src/data/daily-sends.json`);

for (const [key, series] of Object.entries(SERIES)) {
  const peak = points.reduce((a, b) => (b[key] > a[key] ? b : a));
  const total = points.reduce((sum, point) => sum + point[key], 0);
  console.log(
    `  ${series.label.padEnd(5)} peak ${peak[key].toLocaleString('en-US')} on ${peak.date} ` +
      `(${peak.holiday ?? 'no holiday'}), daily average ` +
      `${Math.floor(total / points.length).toLocaleString('en-US')}`,
  );
}
