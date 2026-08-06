/**
 * Charts page: server-rendered Holiday Lookback interactive elements.
 */

import { html } from '../lib/html.mjs';
import { page, articleProse, variantSwitch } from '../lib/layout.mjs';
import { sendsPerDayCard } from '../partials/sends-per-day-card.mjs';
import { peakStatsCard } from '../partials/peak-stats-card.mjs';

export function render({ dailySends, peakStats }) {
  return page({
    title: 'Charts | Holiday Lookback Report',
    description:
      'Holiday Lookback sends-per-day chart and peak season stats card.',
    main: html`${variantSwitch('html')}
      ${articleProse()}
      ${sendsPerDayCard({ data: dailySends })}
      ${peakStatsCard({ stats: peakStats })}`,
  });
}
