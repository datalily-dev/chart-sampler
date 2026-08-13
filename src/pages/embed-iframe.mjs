/**
 * Delivery option one from the CMS conversation: an iframe embed.
 *
 * The components render correctly for a human. The parent document, which is
 * what a crawler actually receives, contains no figures at all: just two iframe
 * elements pointing somewhere else.
 */

import { html } from '../lib/html.mjs';
import { page, variantBanner } from '../lib/layout.mjs';

export function render() {
  return page({
    title: 'Iframe embed | Holiday Lookback interactive elements',
    description:
      'The Holiday Lookback chart and stats card delivered as iframe embeds, which most AI ' +
      'crawlers cannot see into.',
    script: false,
    banner: variantBanner({
      name: 'Iframe embed',
      tone: 'fail',
      verdict: 'Read by Bing Copilot only',
      summary:
        'ChatGPT, Claude, Gemini, Perplexity, Grok, and DeepSeek do not follow iframe sources. ' +
        'To all of them this page is empty.',
    }),
    main: html`<iframe
        class="embed-frame"
        src="frame-sends-per-day.html"
        title="Emails and SMS sent per day during BFCM 2025"
        height="760"
        loading="lazy"
      ></iframe>
      <iframe
        class="embed-frame embed-frame--stats"
        src="frame-peak-stats.html"
        title="2025 peak season performance across email and SMS"
        height="640"
        loading="lazy"
      ></iframe>`,
  });
}
