/** Figma nodes 74:5975 (Email state) and 73:5962 (SMS state). */

import { html } from '../lib/html.mjs';
import { toggle } from './toggle.mjs';
import { lineChart } from './line-chart.mjs';
import { dataTable } from './data-table.mjs';
import { datasetScript, dailySendsDataset } from '../lib/schema.mjs';

export function sendsPerDayCard({ data, id = 'sends-per-day', active = 'email' }) {
  return html`<figure class="card card--chart" id="${id}">
    <div class="card__header">
      <div class="card__headings">
        ${Object.entries(data.series).map(
          ([key, series]) =>
            html`<h3 class="card__title" data-series="${key}">${series.title}</h3>`,
        )}
        <p class="card__subtitle">${data.range}</p>
      </div>
      ${toggle({ id, series: data.series, active, label: 'Choose a channel' })}
    </div>

    <div class="chart__scroll">${lineChart({ id, data, active })}</div>

    ${dataTable({ data })}

    <footer class="card__footer">
      <p class="card__source">Source: ${data.source}</p>
      <img class="card__logo" src="mailchimp-logo.svg" alt="Intuit Mailchimp" width="99" height="28" />
    </footer>

    ${datasetScript(dailySendsDataset(data))}
  </figure>`;
}
