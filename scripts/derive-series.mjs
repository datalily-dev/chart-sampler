/**
 * Regenerates src/data/daily-sends.json.
 *
 * The Figma design has no data bound to it: both charts are static vector art.
 * The marker coordinates are exact though, and the y-axis is a plain linear
 * scale, so the plotted values are recoverable by inverting that scale.
 *
 * Coordinates below are read from the SVG that Figma exports for the plot
 * group (node 72:5926 for email, 73:5961 for SMS). Each series has 19 points;
 * the 17 interior ones are <circle> markers and the two endpoints are the
 * polyline's rounded caps.
 *
 * Six days in this window have figures published in the 2026 Peak Season
 * Marketing Report. Those are used verbatim rather than derived, and they also
 * serve as a check on the derivation: the Black Friday marker inverts to
 * 1.399e9 against a true 1.390e9, an error of 0.65%.
 *
 * Run: node scripts/derive-series.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'daily-sends.json');

const DATES = [
  '2025-11-20', '2025-11-21', '2025-11-22', '2025-11-23', '2025-11-24',
  '2025-11-25', '2025-11-26', '2025-11-27', '2025-11-28', '2025-11-29',
  '2025-11-30', '2025-12-01', '2025-12-02', '2025-12-03', '2025-12-04',
  '2025-12-05', '2025-12-06', '2025-12-07', '2025-12-08',
];

/** Marker y positions in the exported plot SVG's own coordinate space. */
const MARKER_Y = {
  email: [
    111.5, 114.5, 250.5, 265.5, 135.5, 85.5, 94.5, 119.5, 5.5, 226.5,
    216.5, 36.5, 69.5, 142.5, 121.5, 136.5, 256.5, 273.5, 180.5,
  ],
  sms: [
    261.5, 226.5, 293.5, 305.5, 237.5, 214.5, 236.5, 243.5, 5.5, 241.5,
    280.5, 120.5, 199.5, 222.5, 230.5, 182.5, 289.5, 305.5, 246.5,
  ],
};

/**
 * Maps the plot SVG's y space onto data values.
 *
 * `plotTop` is where svg y=0 sits in card coordinates, and the two gridlines
 * give the reference points. For email, card y=134 is 1.5e9 and y=514 is zero;
 * for SMS, card y=134 is 6e6 and y=511 is zero.
 */
const CALIBRATION = {
  email: { plotTop: 154, zeroY: 514, maxY: 134, maxValue: 1.5e9 },
  sms: { plotTop: 169, zeroY: 511, maxY: 134, maxValue: 6e6 },
};

/** Published figures for the days this window shares with the holiday report. */
const PUBLISHED = {
  '2025-11-26': { email: 1_013_302_698, sms: 1_654_653, label: 'Pre-Thanksgiving Day' },
  '2025-11-27': { email: 929_582_577, sms: 1_517_036, label: 'Thanksgiving' },
  '2025-11-28': { email: 1_390_289_396, sms: 5_430_859, label: 'Black Friday' },
  '2025-11-29': { email: 541_884_269, sms: 1_555_037, label: 'Small Business Saturday' },
  '2025-12-01': { email: 1_300_247_595, sms: 3_405_629, label: 'Cyber Monday' },
  '2025-12-02': { email: 1_153_007_717, sms: 2_429_545, label: 'Giving Tuesday' },
};

function invertScale(series, markerY) {
  const { plotTop, zeroY, maxY, maxValue } = CALIBRATION[series];
  const cardY = plotTop + markerY;
  return ((zeroY - cardY) / (zeroY - maxY)) * maxValue;
}

/** Rounds to three significant figures, so derived values never imply false precision. */
function roundSignificant(value) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)) - 2);
  return Math.round(value / magnitude) * magnitude;
}

const points = DATES.map((date, i) => {
  const published = PUBLISHED[date];
  const point = { date };

  for (const series of ['email', 'sms']) {
    if (published) {
      point[series] = published[series];
    } else {
      point[series] = roundSignificant(invertScale(series, MARKER_Y[series][i]));
    }
  }

  point.derived = !published;
  if (published) point.holiday = published.label;

  return point;
});

const data = {
  title: 'Sent per day during BFCM 2025',
  range: 'November 20 - December 8',
  source: '2026 Peak Season Marketing Report',
  note:
    'Points flagged "derived": true were recovered from the Figma chart geometry because no ' +
    'published daily figure exists for that date. Replace them if exact numbers become available.',
  series: {
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
  },
  points,
};

writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);

const derivedCount = points.filter((p) => p.derived).length;
console.log(`Wrote ${points.length} points (${derivedCount} derived) to src/data/daily-sends.json`);

for (const [date, published] of Object.entries(PUBLISHED)) {
  const i = DATES.indexOf(date);
  for (const series of ['email', 'sms']) {
    const derived = invertScale(series, MARKER_Y[series][i]);
    const error = ((derived - published[series]) / published[series]) * 100;
    console.log(
      `  check ${date} ${series.padEnd(5)} derived ${derived.toExponential(3)} ` +
        `vs published ${published[series].toExponential(3)} (${error >= 0 ? '+' : ''}${error.toFixed(1)}%)`,
    );
  }
}
