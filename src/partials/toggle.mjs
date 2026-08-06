/**
 * The Email/SMS pill toggle.
 *
 * Built from real radio inputs so it works with JavaScript disabled: the
 * checked input drives sibling visibility through CSS, which means both series
 * are present in the HTML and a crawler sees the data for each one regardless
 * of which state happens to be selected.
 */

import { html } from '../lib/html.mjs';

export function toggle({ id, series, active = 'email', label }) {
  return html`<div class="toggle" role="group" aria-label="${label}">
    ${Object.entries(series).map(
      ([key, config]) => html`<input
          type="radio"
          class="toggle__input"
          name="${id}-series"
          id="${id}-${key}"
          value="${key}"
          ${key === active ? html`checked` : ''}
        /><label class="toggle__pill" for="${id}-${key}">${config.label}</label>`,
    )}
  </div>`;
}
