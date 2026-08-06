# Holiday Lookback Report: interactive elements

Two interactive components from the Holiday Lookback Report, built three different ways so we can
settle how they should be delivered through the CMS.

The short version: the question was framed as iframe versus embedded JavaScript, and the
measurements say both lose. What decides whether AI search can read the report is not which of
those two you pick, but whether the numbers are in the HTML the server returns.

## Quick start

No dependencies, no install step. Node 18 or newer.

```bash
node build.mjs                  # writes dist/
node scripts/serve.mjs          # serves dist/ at http://127.0.0.1:4321
npm run share                   # build + serve on your LAN (HOST=0.0.0.0)
node scripts/crawler-view.mjs   # the demo
```

## The demo

`scripts/crawler-view.mjs` fetches each variant the way GPTBot does: one HTTP request, read the
body, no JavaScript, no subresources, no iframes followed. Then it looks for the figures a reader
would want to quote.

```
Server-rendered HTML  (26,203 bytes)          8 of 8 present
Iframe embed  (2,296 bytes)                   0 of 8 present
Client-rendered by script tag  (2,124 bytes)  0 of 8 present
```

All three look identical in a browser. Open them side by side at `/compare.html`.

## Why iframes and script tags both fail

A 2026 study served one page with the same sentinel string injected fifteen different ways and
recorded which agents could report it back.

| Agent | Static HTML | Client-rendered JS | Iframe |
| --- | --- | --- | --- |
| ChatGPT (GPTBot, OAI-SearchBot) | Yes | No | No |
| Claude (ClaudeBot, Claude-User) | Yes | No | No |
| Gemini (Google-Extended) | Yes | No | No |
| Perplexity (PerplexityBot) | Yes | No | No |
| Grok (xAI) | Yes | Yes | No |
| DeepSeek | Yes | Yes | No |
| Bing Copilot (Bingbot) | Yes | Yes | Yes |
| Google Search (Googlebot) | Yes | Deferred second pass | No |

Only Bing Copilot follows an iframe source. The four agents that matter most for AI search run no
JavaScript at all, so a script-tag embed leaves them with an empty div. Googlebot does render, but
on a separate pass that can lag the initial crawl by anywhere from seconds to weeks, so it is not
something to depend on.

### What to ask the web production team

The ask is narrow: the CMS needs to let us place an HTML partial in the article body, the way a
pull quote or a table already goes in. The component is plain HTML, one stylesheet, and one
optional script. No build step and no dependencies on either side.

If an iframe is genuinely the only embed the CMS offers, the fallback is to keep the iframe for the
interactive view and also place the summary sentence and the data table into the article body as
ordinary CMS content. The picture stays in the frame and the numbers still reach the crawler.

## Why there is no charting library

Hand-coded SVG, no dependencies. Each alternative had a disqualifying problem:

- **Chart.js, ECharts** render to `<canvas>`, which puts zero text in the DOM. Invisible to
  crawlers and to screen readers, which makes it the worst possible choice against a GEO
  requirement.
- **Recharts, Nivo, Victory** need a React runtime and only emit markup once JavaScript has run,
  which is the failure mode we are trying to avoid. They also own their own markup, which fights
  the custom pieces of this design.
- **Highcharts** adds licensing cost and the same markup-ownership problem.

The chart is one series of 19 points on a linear scale with ticks the design already fixes.
`src/lib/chart-math.mjs` is the entire replacement. If the report later grows to a dozen charts
with varied domains, add `d3-scale` and `d3-shape` as build-time-only helpers rather than a
component library.

### Seeing the trade-off directly

`embed-react-d3.html` is that rejected path, built and running, so the cost is not hypothetical.
It rebuilds the same sends-per-day chart on the stack a hosted charting tool actually uses: React
for the component tree, D3 (`d3-scale`, `d3-shape`) for the geometry, and MUI plus Emotion for the
card and toggle. The source lives in `client/` and bundles to a single `sends-per-day-react.js`.

The page a visitor receives is two lines, the same shape as any embed snippet:

```html
<div data-sends-per-day-react></div>
<script async src="sends-per-day-react.js"></script>
```

It looks identical to the server-rendered chart in a browser and empty to a crawler, because every
figure now lives inside the bundle instead of the HTML. That is the whole comparison: the
server-rendered variant needs no install and ships nothing but its own markup, while this one needs
`npm install`, a build step, and a framework runtime on the page to draw one chart.

The React variant is optional and isolated. `node build.mjs` still builds the rest of the site with
no dependencies; run `npm run build:client` (or `npm run build:all`) to also produce the bundle.

### Resizing on small screens

Both charts adapt to narrow viewports, by two routes with opposite trade-offs. `compare.html` lays
them out side by side.

- **Server-rendered + progressive enhancement.** `enhance.js` measures the rendered width with a
  `ResizeObserver`, thins the x-axis labels so they stop colliding, and drops the horizontal scroll
  once the chart is wide enough to read. *Pro:* every figure stays in the crawler-visible HTML, no
  framework, works with JS off. *Con:* the fixed `viewBox` means the text scales down with the
  chart, so it can de-clutter but not hold font sizes constant or recompute geometry, and very
  small screens still fall back to a scroll.
- **React + D3 measured-width reflow.** A `ResizeObserver` feeds the pixel width into D3, which
  recomputes scales, margins, label density, and dot size per width, with fonts in constant pixels
  and no scroll. *Pro:* true reflow at any size, the same pattern Flowerplot's own embed uses.
  *Con:* it only exists after the bundle runs, so it costs the 726 KB runtime and stays invisible to
  JavaScript-free crawlers.

The short version: the library makes real reflow easy, but the win requires client rendering, which
is the exact thing that removes the chart from the HTML a crawler reads.

## What makes these readable to an LLM

Beyond being in the initial HTML, each component ships:

- A `<figure>` with `<title>` plus `<desc>` inside the SVG.
- A plain-text takeaway sentence per series, which is what actually gets quoted. For example:
  "Email sending peaked at 1,390,289,396 emails on November 28, 2025 (Black Friday), against a
  daily average of 829,279,697 across the 19 days from November 20, 2025 to December 8, 2025."
- A full data table with every daily figure, so values that never appear as peaks are still
  readable as text.
- A JSON-LD `Dataset` block.

The Email/SMS toggle is built from real radio inputs driven by CSS, so it works with JavaScript
disabled. JavaScript only adds hover tooltips and the line draw-in animation.

## Components

| Component | Figma | Notes |
| --- | --- | --- |
| Sends per day | [74:5975](https://www.figma.com/design/63CAh3UawJ7TYQLYybBCFx/Holiday-Lookback-Report?node-id=74-5975) (Email), [73:5962](https://www.figma.com/design/63CAh3UawJ7TYQLYybBCFx/Holiday-Lookback-Report?node-id=73-5962) (SMS) | 1280x615, 19 daily points |
| Peak season stats | [77:5](https://www.figma.com/design/63CAh3UawJ7TYQLYybBCFx/Holiday-Lookback-Report?node-id=77-5) | 600x466, both states confirmed |

## Data

`src/data/peak-season-stats.json` holds confirmed figures for both states.

`src/data/daily-sends.json` is generated by `node scripts/derive-series.mjs`. The Figma chart has
no data bound to it, so the 19-day series was recovered by inverting the axis scale against the
exact marker coordinates. Six days in this window have published figures and are used verbatim;
they also validate the method, with Black Friday inverting to 1.399e9 against a true 1.390e9. The
other thirteen days are flagged `"derived": true` and marked with an asterisk in the rendered
table. Swap them out if exact numbers surface.

## Known issues to raise

- **Figma data bug.** The holidays card (`53:5181`) renders New Year's Eve as `555M`, which is the
  same value shown for Boxing Day directly above it. The true figure is 674,783,351, so `675M`.
- **Font.** Graphik Mailchimp App is licensed and is not in this repo. `tokens.css` falls back to a
  stack with similar metrics; the production team supplies the real webfont.
- **Holidays card not built.** `53:5181` is a third component using the same toggle and table
  patterns. The data exists and it would be a small addition.

## Layout

```
build.mjs               the entire build: reads data, writes dist/
src/data/               the two JSON data files
src/lib/                html templating, chart math, formatting, JSON-LD
src/partials/           toggle, line chart, data table, the two cards
src/pages/              index, compare, the three embed variants, iframe frames
static/                 tokens.css, components.css, enhance.js, logo
scripts/                derive-series, serve, crawler-view
client/                 the React + D3 + MUI variant; bundles to sends-per-day-react.js
dist/                   generated; this is the handoff artifact
```

`static/tokens.css`, `static/components.css`, and the component markup are the whole handoff.
`build.mjs` doubles as the specification: it shows exactly what HTML has to come out, in a form
that ports to PHP, Liquid, JSX, or whatever the CMS turns out to be.
