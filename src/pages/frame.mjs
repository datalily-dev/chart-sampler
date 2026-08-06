/** The documents loaded inside the iframes on the iframe variant. */

import { html } from '../lib/html.mjs';
import { page } from '../lib/layout.mjs';
import { sendsPerDayCard } from '../partials/sends-per-day-card.mjs';
import { peakStatsCard } from '../partials/peak-stats-card.mjs';

export function renderSendsFrame({ dailySends }) {
  return page({
    title: 'Emails and SMS sent per day during BFCM 2025',
    description: 'Chart frame.',
    chrome: false,
    main: html`${sendsPerDayCard({ data: dailySends, id: 'framed-sends-per-day' })}`,
  });
}

export function renderStatsFrame({ peakStats }) {
  return page({
    title: '2025 peak season performance across email and SMS',
    description: 'Stats frame.',
    chrome: false,
    main: html`${peakStatsCard({ stats: peakStats, id: 'framed-peak-stats' })}`,
  });
}
