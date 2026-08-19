/** Figma node 77:5. */

import { html } from '../lib/html.mjs';
import { toggle } from './toggle.mjs';
import { datasetScript, peakStatsDataset } from '../lib/schema.mjs';

export function peakStatsCard({ stats, id = 'peak-stats', active = 'email' }) {
  return html`<figure class="card card--stats" id="${id}">
    <div class="card__header">
      <h3 class="card__title card__title--stats">${stats.title}</h3>
      ${toggle({ id, series: stats.series, active, label: 'Choose a channel' })}
    </div>

    <dl class="stats">
      ${stats.rows.map(
        (row) => html`<div class="stats__row">
          <dt class="stats__label">${row.label}</dt>
          ${Object.keys(stats.series).map(
            (key) => html`<dd class="stats__value" data-series="${key}">${row[key]}</dd>`,
          )}
        </div>`,
      )}
    </dl>

    <footer class="card__footer">
      <p class="card__source">Source: ${stats.source}</p>
      ${stats.note ? html`<p class="card__source">${stats.note}</p>` : ''}
      <img class="card__logo" src="mailchimp-logo.svg" alt="Intuit Mailchimp" width="99" height="28" />
    </footer>

    ${datasetScript(peakStatsDataset(stats))}
  </figure>`;
}
