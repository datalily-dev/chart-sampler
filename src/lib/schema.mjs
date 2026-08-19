/**
 * JSON-LD Dataset markup.
 *
 * This lands in the raw HTML response, which is the whole point: crawlers that
 * never execute JavaScript still parse script tags of type application/ld+json,
 * so the figures reach them in a structured form alongside the visible table.
 */

import { html, raw } from './html.mjs';
import { longDate, withCommas } from './format.mjs';

const PUBLISHER = {
  '@type': 'Organization',
  name: 'Intuit Mailchimp',
  url: 'https://mailchimp.com',
};

export function datasetScript(dataset) {
  // Only forward-slashes need escaping here; the payload is generated, not user input.
  const json = JSON.stringify(dataset, null, 2).replace(/</g, '\\u003c');
  return html`<script type="application/ld+json">
${raw(json)}
</script>`;
}

export function dailySendsDataset(data) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Marketing messages sent per day during BFCM 2025',
    description:
      'Daily volume of marketing emails and SMS messages sent through Intuit Mailchimp ' +
      `between ${longDate(data.points[0].date)} and ${longDate(data.points.at(-1).date)}.`,
    temporalCoverage: `${data.points[0].date}/${data.points.at(-1).date}`,
    creditText: data.source,
    publisher: PUBLISHER,
    variableMeasured: Object.entries(data.series).map(([key, series]) => ({
      '@type': 'PropertyValue',
      name: `${series.label} messages sent per day`,
      unitText: series.unit,
      maxValue: Math.max(...data.points.map((p) => p[key])),
      minValue: Math.min(...data.points.map((p) => p[key])),
    })),
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'application/json',
      contentUrl: 'daily-sends.json',
    },
  };
}

export function peakStatsDataset(stats) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: stats.title,
    description:
      'Gross revenue, revenue per order, average order rate, and revenue per message for ' +
      'email and SMS during the 2025 peak season, October 31 to December 31.',
    temporalCoverage: '2025-10-31/2025-12-31',
    creditText: stats.source,
    publisher: PUBLISHER,
    variableMeasured: stats.rows.flatMap((row) =>
      Object.keys(stats.series).map((key) => ({
        '@type': 'PropertyValue',
        name: `${row.label} (${stats.series[key].label})`,
        value: row[key],
      })),
    ),
  };
}

/**
 * A one-sentence takeaway per chart. Short declarative sentences with the
 * figure and the date in them are what actually get quoted back by an LLM,
 * so each component ships one in plain text.
 */
export function takeaway(data, seriesKey) {
  const series = data.series[seriesKey];
  const peak = data.points.reduce((a, b) => (b[seriesKey] > a[seriesKey] ? b : a));
  const total = data.points.reduce((sum, p) => sum + p[seriesKey], 0);
  // Floored, not rounded: a published figure may understate, never overstate.
  const average = Math.floor(total / data.points.length);

  return (
    `${series.label} sending peaked at ${withCommas(peak[seriesKey])} ${series.unit} on ` +
    `${longDate(peak.date)}${peak.holiday ? ` (${peak.holiday})` : ''}, against a daily average of ` +
    `${withCommas(average)} across the ${data.points.length} days from ` +
    `${longDate(data.points[0].date)} to ${longDate(data.points.at(-1).date)}.`
  );
}
