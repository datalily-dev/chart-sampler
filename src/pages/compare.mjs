/**
 * The meeting artifact: why the delivery mechanism decides whether the report
 * is visible to AI search, and what the three options actually cost.
 */

import { html } from '../lib/html.mjs';
import { page } from '../lib/layout.mjs';

const YES = { mark: 'Yes', tone: 'yes' };
const NO = { mark: 'No', tone: 'no' };
const DEFERRED = { mark: 'Deferred', tone: 'partial' };

/**
 * Crawler behaviour as measured in the 2026 Resoneo sentinel study, which
 * served one page with the same string injected 15 different ways and recorded
 * which agents could report it back.
 */
const AGENTS = [
  { name: 'ChatGPT', agent: 'GPTBot, OAI-SearchBot', html: YES, js: NO, iframe: NO },
  { name: 'Claude', agent: 'ClaudeBot, Claude-User', html: YES, js: NO, iframe: NO },
  { name: 'Gemini', agent: 'Google-Extended', html: YES, js: NO, iframe: NO },
  { name: 'Perplexity', agent: 'PerplexityBot', html: YES, js: NO, iframe: NO },
  { name: 'Grok', agent: 'xAI', html: YES, js: YES, iframe: NO },
  { name: 'DeepSeek', agent: 'DeepSeek', html: YES, js: YES, iframe: NO },
  { name: 'Bing Copilot', agent: 'Bingbot', html: YES, js: YES, iframe: YES },
  { name: 'Google Search', agent: 'Googlebot', html: YES, js: DEFERRED, iframe: NO },
];

const OPTIONS = [
  {
    href: 'index.html',
    tone: 'pass',
    name: 'Server-rendered HTML',
    verdict: 'Recommended',
    detail:
      'The chart markup, every axis label, the full data table, and a JSON-LD Dataset block ' +
      'are all in the initial response. JavaScript adds tooltips and an animation, and nothing ' +
      'breaks if it never loads.',
    ask: 'Needs the CMS to accept an HTML partial in the article body.',
  },
  {
    href: 'embed-iframe.html',
    tone: 'fail',
    name: 'Iframe embed',
    verdict: 'Fails for seven of eight agents',
    detail:
      'The parent document contains prose and two iframe elements. Only Bing Copilot follows ' +
      'the source, so for every other agent the report has no numbers in it.',
    ask: 'Easiest for the CMS, worst for AI visibility.',
  },
  {
    href: 'embed-script-tag.html',
    tone: 'fail',
    name: 'Client-rendered by script tag',
    verdict: 'Fails for five of eight agents',
    detail:
      'Looks identical in a browser, and is barely better than the iframe. The four agents that ' +
      'matter most for AI search, ChatGPT, Claude, Gemini, and Perplexity, run no JavaScript at all.',
    ask: 'The usual default for third-party embeds, and the trap worth naming out loud.',
  },
  {
    href: 'embed-react-d3.html',
    tone: 'fail',
    name: 'Client-rendered by React + D3',
    verdict: 'Fails for five of eight agents',
    detail:
      'The same chart rebuilt on a charting stack (React, D3, MUI), the way most embed tools ' +
      'ship it. It renders only after the bundle runs, so it fails for the same agents as any ' +
      'other script-tag embed, and it ships a framework runtime to draw one chart.',
    ask: 'Two lines to paste, but a build step and hundreds of kilobytes of dependencies behind them.',
  },
];

/**
 * The two responsive strategies, one added to each chart, with their honest
 * trade-offs. The point is not that one wins: it is that reflow and crawler
 * visibility pull in opposite directions.
 */
const RESPONSIVE = [
  {
    eyebrow: 'Server-rendered + resize script',
    name: 'Progressive enhancement',
    pros: [
      'Every figure and label ships in the static HTML, so the chart stays fully readable to crawlers and with JavaScript off.',
      'The enhancement is ~40 lines of vanilla JS in enhance.js, no framework, no build step, no dependencies.',
      'The no-JS fallback still works: the chart fits the column and scrolls sideways below its min-width.',
    ],
    cons: [
      'The SVG is a fixed viewBox, so text scales down with the chart. The script can thin labels to stop collisions but cannot hold the font size constant.',
      'It reacts to width but cannot truly recompute geometry: no per-breakpoint margins, no adaptive tick math, no layout swap.',
      'Below ~640px the honest option is still a horizontal scroll, because shrinking further makes the labels too small to read.',
    ],
  },
  {
    eyebrow: 'React + D3 + MUI',
    name: 'Charting library',
    pros: [
      'A ResizeObserver measures the real pixel width, so fonts stay constant, margins tighten, labels drop to every fourth day, and dots shrink as the screen narrows.',
      'True reflow with no horizontal scroll at any width, because the geometry is recomputed from measured dimensions rather than scaled.',
      'The same measured-width pattern scales to many charts and richer interactions without hand-writing the math each time.',
    ],
    cons: [
      'It renders in the browser, so the figures live in the bundle, not the HTML. Crawlers that skip JavaScript see an empty div (0 of 8 probes).',
      'It ships a React runtime, D3, and MUI to draw one chart: a 726 KB bundle plus an install and a build step.',
      'Nothing renders until the script runs, so a script failure or a slow connection means no chart at all.',
    ],
  },
];

function matrix() {
  const cell = (state) => html`<td class="matrix__cell matrix__cell--${state.tone}">${state.mark}</td>`;

  return html`<table class="matrix">
    <caption>
      Can the agent read content delivered this way? Source: Resoneo AI crawler sentinel study, 2026.
    </caption>
    <thead>
      <tr>
        <th scope="col">Agent</th>
        <th scope="col">Static HTML</th>
        <th scope="col">Client-rendered JS</th>
        <th scope="col">Iframe</th>
      </tr>
    </thead>
    <tbody>
      ${AGENTS.map(
        (row) => html`<tr>
          <th scope="row">
            ${row.name}
            <span class="matrix__agent">${row.agent}</span>
          </th>
          ${cell(row.html)} ${cell(row.js)} ${cell(row.iframe)}
        </tr>`,
      )}
    </tbody>
  </table>`;
}

export function render() {
  return page({
    title: 'Compare delivery modes | Holiday Lookback interactive elements',
    description:
      'Why iframe and client-rendered JavaScript both fail for AI search, and what to ask the ' +
      'CMS team for instead.',
    script: false,
    main: html`<header class="article__header">
        <p class="article__eyebrow">Delivery</p>
        <h1 class="article__heading">Four ways to ship the same chart</h1>
      </header>

      <p class="article__body">
        The question on the table is iframe versus embedded JavaScript. The measurements say both
        lose, and for the same reason: neither puts the numbers into the HTML the server returns.
        Most AI crawlers are plain HTTP clients with no JavaScript engine, so whatever is not in
        that first response does not exist to them.
      </p>

      <p class="article__body">
        Each option below is built and running. Open them and they look the same. Then run
        <code>npm run crawl</code>, which fetches all three the way GPTBot would and reports which
        figures survive.
      </p>

      ${matrix()}

      <div class="options">
        ${OPTIONS.map(
          (option) => html`<a class="option option--${option.tone}" href="${option.href}">
            <p class="option__verdict">${option.verdict}</p>
            <h2 class="option__name">${option.name}</h2>
            <p class="option__detail">${option.detail}</p>
            <p class="option__ask">${option.ask}</p>
          </a>`,
        )}
      </div>

      <h2 class="article__subheading">Resizing on small screens</h2>
      <p class="article__body">
        Fitting a chart to the column is free either way: an SVG with a
        <code>viewBox</code> scales to any width with no script at all. The hard part is reflow,
        changing the layout as space shrinks: thinning axis labels, tightening margins, and keeping
        the text legible. Both charts now do this, by two different routes with opposite trade-offs.
      </p>

      <div class="options">
        ${RESPONSIVE.map(
          (approach) => html`<div class="option">
            <p class="option__verdict">${approach.eyebrow}</p>
            <h3 class="option__name">${approach.name}</h3>
            <p class="option__detail">
              <strong>Pros:</strong>
              <span class="option__list">
                ${approach.pros.map((item) => html`<span class="option__item">${item}</span>`)}
              </span>
            </p>
            <p class="option__detail">
              <strong>Cons:</strong>
              <span class="option__list">
                ${approach.cons.map((item) => html`<span class="option__item">${item}</span>`)}
              </span>
            </p>
          </div>`,
        )}
      </div>

      <h2 class="article__subheading">What to ask for</h2>
      <p class="article__body">
        The ask is narrower than adopting a framework. The CMS needs to let us place an HTML
        partial in the article body, the way a pull quote or a table already goes in. The component
        is plain HTML, one stylesheet, and one optional script, with no build step and no
        dependencies on our side or theirs.
      </p>
      <p class="article__body">
        If the CMS genuinely cannot do that and an iframe is the only embed available, the fallback
        is to keep the iframe for the interactive view and also place the summary sentence and the
        data table into the article body as ordinary CMS content. The picture stays in the frame;
        the numbers still reach the crawler.
      </p>`,
  });
}
