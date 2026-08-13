import { html } from './html.mjs';

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