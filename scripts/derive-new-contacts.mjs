/**
 * Regenerates src/data/new-contacts.json.
 *
 * CONTACTS below is the source of truth: 62 days, October 31 to December 31
 * 2025, transcribed from the handoff tables at full precision. Unlike the rate
 * charts there is nothing to trace or interpolate here — these are exact
 * counts, so they are written out verbatim.
 *
 * What this script does have to pin down is the colour scale. The calendar
 * shades each day into one of five steps, and the comp assigns those steps by
 * hand rather than from a formula: no linear, quantile, or power scale over the
 * email series reproduces its choices. So the steps are cut at explicit
 * thresholds, and BUCKETS records the step the comp gives every one of the 62
 * days. The run stops unless the thresholds reproduce that reading exactly,
 * which keeps the published card and the design in agreement even if a figure
 * is later corrected.
 *
 * Each threshold sits in the middle of the gap it splits rather than hard
 * against one side, so a small revision to a figure near a boundary does not
 * silently reshade the calendar. The widest of those gaps is real: the email
 * series jumps from 10.6M to 15.9M with nothing in between, which is the split
 * between the weekend days and the weekday ones.
 *
 * Run: node scripts/derive-new-contacts.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'new-contacts.json');

const WINDOW = 'October 31-December 31, 2025';

const SERIES = {
  email: {
    label: 'Email',
    unit: 'new contacts',
    note: `New contacts subscribed for Mailchimp customers on free and paid plans, ${WINDOW}`,
    // Five steps, so four cuts. Read off the comp; see the header note.
    thresholds: [7_500_000, 12_500_000, 18_000_000, 21_000_000],
  },
  sms: {
    label: 'SMS',
    unit: 'new contacts',
    note: `New SMS contacts subscribed for Mailchimp customers on free and paid plans, ${WINDOW}`,
    /*
     * The comp only shades the email series, so SMS gets its own cuts, placed
     * the same way: in the gaps of its own distribution, on round numbers. SMS
     * runs two orders of magnitude below email and has no weekend cliff to
     * split on, so the steps land closer to even than email's do.
     */
    thresholds: [150_000, 250_000, 400_000, 600_000],
  },
};

const CONTACTS = {
  '2025-10-31': { email: 15_965_524, sms: 364_323, holiday: 'Halloween' },
  '2025-11-01': { email: 6_069_034, sms: 104_379 },
  '2025-11-02': { email: 5_844_425, sms: 59_483 },
  '2025-11-03': { email: 17_417_598, sms: 246_760 },
  '2025-11-04': { email: 17_751_593, sms: 168_146 },
  '2025-11-05': { email: 18_481_845, sms: 210_999 },
  '2025-11-06': { email: 17_500_316, sms: 436_653 },
  '2025-11-07': { email: 15_891_511, sms: 179_724 },
  '2025-11-08': { email: 6_176_971, sms: 100_346 },
  '2025-11-09': { email: 6_055_518, sms: 31_590 },
  '2025-11-10': { email: 19_541_478, sms: 245_678 },
  '2025-11-11': { email: 19_919_804, sms: 238_525 },
  '2025-11-12': { email: 16_740_230, sms: 207_167 },
  '2025-11-13': { email: 19_821_588, sms: 239_479 },
  '2025-11-14': { email: 18_048_602, sms: 231_567 },
  '2025-11-15': { email: 6_464_461, sms: 78_459 },
  '2025-11-16': { email: 6_315_645, sms: 66_199 },
  '2025-11-17': { email: 20_228_917, sms: 332_230 },
  '2025-11-18': { email: 19_594_411, sms: 713_571 },
  '2025-11-19': { email: 21_908_471, sms: 256_309 },
  '2025-11-20': { email: 20_259_577, sms: 464_581 },
  '2025-11-21': { email: 18_761_713, sms: 393_832 },
  '2025-11-22': { email: 7_625_502, sms: 109_219 },
  '2025-11-23': { email: 6_860_557, sms: 102_427 },
  '2025-11-24': { email: 22_969_650, sms: 286_830 },
  '2025-11-25': { email: 21_933_846, sms: 1_159_742 },
  '2025-11-26': { email: 21_932_377, sms: 1_078_793, holiday: 'Pre-Thanksgiving Day' },
  '2025-11-27': { email: 18_657_191, sms: 406_658, holiday: 'Thanksgiving' },
  '2025-11-28': { email: 15_936_042, sms: 366_159, holiday: 'Black Friday' },
  '2025-11-29': { email: 8_082_180, sms: 138_062, holiday: 'Small Business Saturday' },
  '2025-11-30': { email: 9_503_198, sms: 102_605 },
  '2025-12-01': { email: 19_911_651, sms: 754_047, holiday: 'Cyber Monday' },
  '2025-12-02': { email: 22_738_282, sms: 636_042, holiday: 'Giving Tuesday' },
  '2025-12-03': { email: 18_639_439, sms: 339_213 },
  '2025-12-04': { email: 17_057_725, sms: 394_207 },
  '2025-12-05': { email: 16_471_719, sms: 302_166 },
  '2025-12-06': { email: 5_705_253, sms: 114_078 },
  '2025-12-07': { email: 6_302_600, sms: 150_383 },
  '2025-12-08': { email: 17_114_040, sms: 584_560 },
  '2025-12-09': { email: 18_580_480, sms: 1_067_807 },
  '2025-12-10': { email: 18_021_874, sms: 560_797 },
  '2025-12-11': { email: 18_784_146, sms: 340_079 },
  '2025-12-12': { email: 16_278_333, sms: 330_406 },
  '2025-12-13': { email: 6_070_621, sms: 407_788 },
  '2025-12-14': { email: 6_115_742, sms: 99_410 },
  '2025-12-15': { email: 18_194_833, sms: 286_089 },
  '2025-12-16': { email: 22_139_716, sms: 455_732 },
  '2025-12-17': { email: 20_850_285, sms: 430_557 },
  '2025-12-18': { email: 20_181_819, sms: 416_286 },
  '2025-12-19': { email: 24_869_797, sms: 276_979 },
  '2025-12-20': { email: 9_895_927, sms: 321_798 },
  '2025-12-21': { email: 5_069_964, sms: 204_225 },
  '2025-12-22': { email: 18_279_519, sms: 688_359 },
  '2025-12-23': { email: 16_203_446, sms: 609_067 },
  '2025-12-24': { email: 8_208_543, sms: 327_279, holiday: 'Christmas Eve' },
  '2025-12-25': { email: 4_390_262, sms: 69_216, holiday: 'Christmas Day' },
  '2025-12-26': { email: 7_008_025, sms: 126_977, holiday: 'Boxing Day' },
  '2025-12-27': { email: 4_588_042, sms: 99_347 },
  '2025-12-28': { email: 4_783_699, sms: 99_363 },
  '2025-12-29': { email: 10_231_677, sms: 449_125 },
  '2025-12-30': { email: 10_574_599, sms: 215_298 },
  '2025-12-31': { email: 9_622_676, sms: 341_634, holiday: "New Year's Eve" },
};

/*
 * The step the comp shades each email day into, lightest 0 to darkest 4, in the
 * order the days are listed above. Recovered from the comp by reading the fill
 * of all 62 cells, so this is the design's own reading rather than a guess at
 * its intent.
 */
const BUCKETS =
  '2' + // Oct 31
  '002232200332330033433104443211' + // Nov 1-30
  '3432200233320034334103210000111'; // Dec 1-31

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** UTC throughout: these are calendar dates, not moments. */
const weekdayOf = (iso) => WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()];

/** Which of the five steps a value falls in: the count of thresholds it clears. */
const bucketOf = (value, thresholds) => thresholds.filter((cut) => value >= cut).length;

const problems = [];
const dates = Object.keys(CONTACTS);

if (dates.length !== 62) {
  problems.push(`${dates.length} days transcribed; October 31 to December 31 is 62`);
}

if (BUCKETS.length !== dates.length) {
  problems.push(`BUCKETS reads ${BUCKETS.length} days; ${dates.length} are transcribed`);
}

for (const [key, series] of Object.entries(SERIES)) {
  const cuts = series.thresholds;
  if (cuts.some((cut, i) => i > 0 && cut <= cuts[i - 1])) {
    problems.push(`${key}: thresholds are not in ascending order`);
  }
  /*
   * A figure sitting exactly on a threshold is not wrong, but it means the
   * comp's reading and this scale agree by luck: nudge the figure and the cell
   * changes step. Every cut is meant to sit in a gap, so flag it.
   */
  for (const [date, day] of Object.entries(CONTACTS)) {
    if (cuts.includes(day[key])) {
      problems.push(`${date} ${key}: ${day[key]} sits exactly on a threshold`);
    }
  }
}

dates.forEach((date, index) => {
  const expected = Number(BUCKETS[index]);
  const actual = bucketOf(CONTACTS[date].email, SERIES.email.thresholds);
  if (actual !== expected) {
    problems.push(
      `${date} email: ${CONTACTS[date].email} falls in step ${actual}, but the comp shades it ${expected}`,
    );
  }
});

if (problems.length) {
  console.error(`Refusing to write: ${problems.length} value(s) fail their check`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

const points = Object.entries(CONTACTS).map(([date, day]) => {
  const point = { date, weekday: weekdayOf(date), email: day.email, sms: day.sms };
  if (day.holiday) point.holiday = day.holiday;
  return point;
});

const data = {
  title: 'New contacts added by day',
  // The calendar shows two whole months; the window it plots is in the footnote.
  range: 'November 1 - December 31',
  source: 'Breaking Through Peak Season Noise Report, September 2026',
  series: SERIES,
  points,
  notes:
    'Exact counts, written out verbatim. The five colour steps are cut at the thresholds on each ' +
    'series; the email cuts reproduce the fill of all 62 cells in the comp, which ' +
    'scripts/derive-new-contacts.mjs checks before writing. October 31 shares November\u2019s ' +
    'first week, so the calendar carries it there rather than opening a section for one day.',
};

writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);

console.log(`Wrote ${points.length} points to src/data/new-contacts.json`);

for (const [key, series] of Object.entries(SERIES)) {
  const peak = points.reduce((a, b) => (b[key] > a[key] ? b : a));
  const total = points.reduce((sum, p) => sum + p[key], 0);
  const steps = series.thresholds.length + 1;
  const spread = Array.from(
    { length: steps },
    (_, step) => points.filter((p) => bucketOf(p[key], series.thresholds) === step).length,
  );
  console.log(
    `  ${series.label.padEnd(5)} total ${total.toLocaleString('en-US')}, ` +
      `peak ${peak[key].toLocaleString('en-US')} on ${peak.date} ` +
      `(${peak.holiday ?? peak.weekday}), days per step ${spread.join('/')}`,
  );
}
