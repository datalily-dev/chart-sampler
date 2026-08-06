/**
 * Delivery option two from the CMS conversation: a script tag that injects the
 * component at runtime.
 *
 * This is the shape most third-party embed snippets take, and it looks
 * identical to the server-rendered version in a browser. The parent HTML is
 * still empty of figures, so the crawlers that skip JavaScript see the same
 * nothing they see with the iframe.
 */

import { html } from '../lib/html.mjs';
import { page, variantBanner, articleProse } from '../lib/layout.mjs';

export function render() {
  return page({
    title: 'Client-rendered | Holiday Lookback interactive elements',
    description:
      'The Holiday Lookback chart and stats card injected by JavaScript at runtime, which ' +
      'crawlers that do not execute scripts cannot see.',
    // The widget injects enhance.js after mount; loading it here would run it twice.
    script: false,
    banner: variantBanner({
      name: 'Client-rendered by a script tag',
      tone: 'fail',
      verdict: 'Read by Bing, Grok, and DeepSeek only',
      summary:
        'ChatGPT, Claude, Gemini, and Perplexity are plain HTTP clients with no JavaScript ' +
        'engine. They fetch this page and find two empty divs where the data should be.',
    }),
    main: html`${articleProse()}
      <div id="sends-per-day-mount" data-widget="sends-per-day"></div>
      <div id="peak-stats-mount" data-widget="peak-stats"></div>
      <script src="widget.js" defer></script>`,
  });
}
