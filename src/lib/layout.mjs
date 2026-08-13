import { html } from './html.mjs';

/**
 * Prose lifted from the Holiday Lookback Report itself, so each delivery
 * variant is a realistic page: the surrounding copy is always in the HTML and
 * only the interactive component's delivery mechanism changes between them.
 */
export const ARTICLE = {
  eyebrow: 'Peak season',
  heading: 'Email drives more overall peak season revenue, but SMS has higher order rates',
  body:
    'No surprise, email drove the majority of revenue during peak season, largely because ' +
    'brands send more emails than SMS messages. Throughout peak season, Mailchimp brands sent ' +
    'over 500x more marketing emails than text messages. But SMS is quickly growing as a ' +
    'high-value channel. Text message order rates landed between 0.05% and 0.25% during peak ' +
    'season, while email order rates were between 0.01% and 0.04%.',
};

export function page({ title, description, banner, main, script = true, chrome = true }) {
  return html`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="stylesheet" href="tokens.css" />
    <link rel="stylesheet" href="components.css" />
    ${chrome ? html`<link rel="stylesheet" href="demo.css" />` : ''}
  </head>
  <body${chrome ? '' : html` class="bare"`}>
    ${banner ?? ''}
    <main class="page">${main}</main>
    ${script ? html`<script src="enhance.js" defer></script>` : ''}
  </body>
</html>
`;
}

export function variantBanner({ name, verdict, tone, summary }) {
  return html`<div class="banner banner--${tone}">
    <div class="banner__inner">
      <p class="banner__name">${name}</p>
      <p class="banner__verdict">${verdict}</p>
      <p class="banner__summary">${summary}</p>
      <nav class="banner__nav">
        <a href="index.html">Server-rendered</a>
        <a href="embed-iframe.html">Iframe</a>
        <a href="embed-script-tag.html">Client-rendered</a>
        <a href="embed-react-d3.html">React + D3</a>
        <a href="compare.html">Compare</a>
      </nav>
    </div>
  </div>`;
}

export function articleProse() {
  return html`<header class="article__header">
      <p class="article__eyebrow">${ARTICLE.eyebrow}</p>
      <h1 class="article__heading">${ARTICLE.heading}</h1>
    </header>
    <p class="article__body">${ARTICLE.body}</p>`;
}
