/** Daily sends as a real HTML table, so every figure reaches a text-only crawler. */

import { html } from '../lib/html.mjs';
import { longDate, withCommas } from '../lib/format.mjs';

export function dataTable({ data }) {
  const seriesKeys = Object.keys(data.series);

  return html`<div class="data-table">
    <table>
      <caption>
        ${data.title}, ${data.range}
      </caption>
      <thead>
        <tr>
          <th scope="col">Date</th>
          ${seriesKeys.map(
            (key) => html`<th scope="col" data-series="${key}">${data.series[key].label}</th>`,
          )}
        </tr>
      </thead>
      <tbody>
        ${data.points.map(
          (point) => html`<tr>
            <th scope="row">${longDate(point.date)}</th>
            ${seriesKeys.map(
              (key) =>
                html`<td data-series="${key}">
                  ${withCommas(point[key])}${point.derived ? '*' : ''}
                </td>`,
            )}
          </tr>`,
        )}
      </tbody>
    </table>
    ${data.note
      ? html`<p class="data-table__note"><span aria-hidden="true">*</span> ${data.note}</p>`
      : ''}
  </div>`;
}
