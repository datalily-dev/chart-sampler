/**
 * The sends-per-day line chart, as static inline SVG.
 *
 * Both series are rendered into the markup and CSS hides the inactive one, so
 * the numbers for email and SMS are both in the HTML no matter which toggle
 * state is selected. Every label is a real <text> node rather than canvas
 * pixels, which keeps the chart readable to crawlers and screen readers alike.
 */

import { html } from '../lib/html.mjs';
import { PLOT, linePath, points, xFor } from '../lib/chart-math.mjs';
import { compact, longDate, shortDate, withCommas } from '../lib/format.mjs';
import { takeaway } from '../lib/schema.mjs';

/** Reproduces the Figma callout gradient (node 70:5729) for the BFCM window. */
function band(id) {
  const { x, y, width, height, labelX, labelY } = PLOT.band;
  return html`<defs>
      <radialGradient
        id="${id}-band"
        gradientUnits="userSpaceOnUse"
        cx="0"
        cy="0"
        r="10"
        gradientTransform="matrix(18.871 0 0 35.417 ${x + 151.29} ${y + 260})"
      >
        <stop stop-color="#ffccd8" offset="0" />
        <stop stop-color="#ffccd8" offset="0.35" />
        <stop stop-color="#fef6f7" offset="0.75" />
      </radialGradient>
    </defs>
    <rect
      x="${x}"
      y="${y}"
      width="${width}"
      height="${height}"
      fill="url(#${id}-band)"
      opacity="0.5"
    />
    <text class="chart__band-label" x="${labelX}" y="${labelY}" text-anchor="middle">
      Black Friday - Cyber Monday
    </text>`;
}

function grid(series) {
  return series.axisTicks.map((tick) => {
    const y = PLOT.zeroY - (tick / series.axisMax) * (PLOT.zeroY - PLOT.topY);
    return html`<g class="chart__gridline">
      <line x1="${PLOT.gridLeft}" x2="${PLOT.gridRight}" y1="${y}" y2="${y}" />
      <text x="${PLOT.labelRight}" y="${y}" text-anchor="end" dominant-baseline="middle">
        ${compact(tick)}
      </text>
    </g>`;
  });
}

function seriesGroup({ id, seriesKey, series, data }) {
  const values = data.points.map((point) => point[seriesKey]);
  const plotted = points(values, series.axisMax);

  return html`<g class="chart__series" data-series="${seriesKey}">
    ${grid(series)}
    <path class="chart__line" d="${linePath(values, series.axisMax)}" />
    ${plotted.map((point, i) => {
      const source = data.points[i];
      return html`<circle
        class="chart__dot"
        cx="${point.x}"
        cy="${point.y}"
        r="${PLOT.dotRadius}"
        data-date="${longDate(source.date)}"
        data-value="${withCommas(point.value)}"
        data-unit="${series.unit}"
        data-holiday="${source.holiday ?? ''}"
      />`;
    })}
    ${/* The figure above each dot, so the exact reading does not depend on hover. */ ''}
    ${plotted.map(
      (point) => html`<text
        class="chart__value"
        x="${point.x}"
        y="${point.y - PLOT.valueLabelOffset}"
        text-anchor="middle"
      >
        ${compact(point.value)}
      </text>`,
    )}
  </g>`;
}

function xAxis(data) {
  return html`<g class="chart__xaxis">
    ${data.points.map((point, i) =>
      // The design labels every other day, which keeps 19 points legible.
      i % 2 === 0
        ? html`<text x="${xFor(i, data.points.length)}" y="${PLOT.axisLabelY}" text-anchor="middle">
            ${shortDate(point.date)}
          </text>`
        : '',
    )}
  </g>`;
}

export function lineChart({ id, data, active = 'email' }) {
  const description = Object.keys(data.series)
    .map((key) => takeaway(data, key))
    .join(' ');

  return html`<svg
    class="chart__plot"
    viewBox="${PLOT.viewBox}"
    role="img"
    aria-labelledby="${id}-svg-title ${id}-svg-desc"
  >
    <title id="${id}-svg-title">${data.series[active].title}</title>
    <desc id="${id}-svg-desc">${description}</desc>
    ${band(id)}
    ${Object.entries(data.series).map(([seriesKey, series]) =>
      seriesGroup({ id, seriesKey, series, data }),
    )}
    ${xAxis(data)}
  </svg>`;
}
