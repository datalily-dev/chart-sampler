/**
 * React + D3 + MUI variant of the sends-per-day chart (client-rendered).
 */

import { html } from '../lib/html.mjs';
import { page } from '../lib/layout.mjs';
import { tacticsSection } from '../partials/tactics-section.mjs';
import { relatedReading } from '../partials/related-reading.mjs';

export function render() {
  return page({
    title: 'React + D3 | Holiday Lookback Report',
    description:
      'Holiday Lookback chart and peak season stats built with React, D3, and MUI.',
    // The bundle mounts its own React tree; enhance.js is not used here.
    script: false,
    main: html`<div data-sends-per-day-react></div>
      <div class="report-sections">${tacticsSection()} ${relatedReading()}</div>
      <script src="sends-per-day-react.js" defer></script>
      <!-- enhance.js is not used on this page; the carousel brings its own. -->
      <script src="carousel.js" defer></script>`,
  });
}
