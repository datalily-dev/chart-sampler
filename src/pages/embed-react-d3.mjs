/**
 * React + D3 + MUI variant of the sends-per-day chart (client-rendered).
 */

import { html } from '../lib/html.mjs';
import { page, articleProse } from '../lib/layout.mjs';

export function render() {
  return page({
    title: 'React + D3 | Holiday Lookback Report',
    description:
      'Holiday Lookback chart and peak season stats built with React, D3, and MUI.',
    // The bundle mounts its own React tree; enhance.js is not used here.
    script: false,
    main: html`${articleProse()}
      <div data-sends-per-day-react></div>
      <script src="sends-per-day-react.js" defer></script>`,
  });
}
