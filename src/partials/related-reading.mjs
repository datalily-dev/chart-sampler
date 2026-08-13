/** Figma node 350:3366. */

import { html } from '../lib/html.mjs';

export const RELATED_READING = {
  label: 'Related reading',
  title: 'How to Use Artificial Intelligence in Marketing Campaigns',
  href: 'https://mailchimp.com/resources/why-artificial-intelligence-in-marketing-is-vital/',
};

/**
 * The design links only the title. The whole row is the link here: the label
 * and arrow are part of the same affordance, so they belong inside the target.
 */
export function relatedReading({ link = RELATED_READING } = {}) {
  return html`<nav class="related-reading" aria-label="${link.label}">
    <a class="related-reading__link" href="${link.href}" target="_blank" rel="noopener noreferrer">
      <span class="related-reading__group">
        <span class="related-reading__label">${link.label}</span>
        <span class="related-reading__title">${link.title}</span>
      </span>
      <img class="related-reading__arrow" src="img/arrow-right.svg" alt="" width="19" height="18" />
    </a>
  </nav>`;
}
