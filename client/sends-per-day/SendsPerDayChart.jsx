/**
 * The sends-per-day line chart, rebuilt on Flowerplot's relevant stack:
 * React for the component tree, D3 (d3-scale + d3-shape) for the plot geometry,
 * and MUI + Emotion for the card shell, typography, and the Email/SMS toggle.
 *
 * This is the counterpoint to src/partials/line-chart.mjs. That file emits the
 * whole chart as static SVG at build time with zero dependencies. This one
 * produces an identical-looking chart, but only after React mounts and D3 runs
 * in the browser, which is exactly why a JavaScript-free crawler sees nothing.
 *
 * The one thing it does that the static SVG genuinely cannot: it measures its
 * own width with a ResizeObserver and recomputes the layout on every resize, so
 * fonts stay a constant pixel size, axis labels thin out, and margins shrink as
 * the screen narrows. No horizontal scroll, real reflow. That is the payoff for
 * the runtime cost, and the whole reason this variant exists.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { line as d3Line } from 'd3-shape';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { compact, longDate, shortDate, withCommas } from './format.js';

const PUMPKIN = '#ff7346';
const PEPPERCORN = '#231e15';
const WHITE = '#ffffff';
const RULE = 'rgba(35, 30, 21, 0.15)';
const BAND_PINK = '#ffccd8';
const FONT_STACK =
  '"Graphik Mailchimp App", "Helvetica Neue", Helvetica, Arial, sans-serif';

/** Black Friday → Cyber Monday window, by holiday rather than fixed coords. */
function bandRange(points) {
  const bf = points.findIndex((p) => p.holiday === 'Black Friday');
  const cm = points.findIndex((p) => p.holiday === 'Cyber Monday');
  if (bf < 0 || cm < 0) return null;
  return { start: Math.max(0, bf - 1), end: cm };
}

/**
 * Figma callout gradient (node 70:5729), scaled to the live plot.
 * Static SVG uses matrix(18.871 0 0 35.417 …) with r=10 over a 323-wide band —
 * that tall ellipse is what softens the pink instead of a hard vertical strip.
 */
function bandGradient(bandX, bandWidth, plotTop, plotBottom) {
  const cx = bandX + bandWidth / 2;
  const cy = (plotTop + plotBottom) / 2;
  // Figma: rx=188.71, ry=354.17 against band width 323
  const rx = bandWidth * (188.71 / 323);
  const ry = bandWidth * (354.17 / 323);
  // Figma band hangs ~64 above / ~76 below the plot; keep that soft overflow
  const plotH = plotBottom - plotTop;
  const y = plotTop - plotH * (64 / 380);
  const height = plotH * (520 / 380);
  return { cx, cy, rx, ry, x: bandX, y, width: bandWidth, height };
}

export default function SendsPerDayChart({ data }) {
  const seriesKeys = Object.keys(data.series);
  const [active, setActive] = useState(seriesKeys[0] ?? 'email');
  const series = data.series[active];

  // Measure the container. This is the entire basis for the responsive layout:
  // every dimension below is derived from `width`, and the observer re-renders
  // the chart whenever it changes.
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const update = () => setWidth(el.clientWidth);
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update, { passive: true });
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const narrow = width > 0 && width < 640;
  const height = narrow ? 340 : 440;
  const margin = {
    top: 44,
    right: narrow ? 14 : 28,
    bottom: 40,
    left: narrow ? 46 : 58,
  };
  const labelStep = narrow ? 4 : 2;
  const dotRadius = narrow ? 4 : 5.5;
  const hoverRadius = narrow ? 6 : 8;
  const tickFont = narrow ? 11 : 14;
  const valueFont = narrow ? 10 : width < 900 ? 11.5 : 13;

  /*
   * The per-point value labels are the one thing here that can genuinely
   * collide, so their density is derived from how wide they actually are rather
   * than from a guessed breakpoint. Measured in the browser, a label renders at
   * about 0.64em per character in this font ("981M" is 33.3px at 13px), so the
   * widest label the current series can produce plus a little breathing room is
   * what one column has to clear.
   *
   * When a single row of labels no longer fits, they take a second row below
   * the line before any of them are dropped. Two rows double the horizontal
   * room each label has, which is what keeps all 19 figures on the chart down
   * to a phone-width card. Only below that does the step open up to every other
   * point, and then every fourth; whatever is dropped is still on the tooltip.
   */
  const gap =
    data.points.length > 1
      ? Math.max(0, width - margin.left - margin.right) / (data.points.length - 1)
      : width;
  const longestValue = useMemo(
    () => Math.max(...data.points.map((point) => compact(point[active]).length)),
    [data.points, active],
  );
  const valueWidth = longestValue * 0.64 * valueFont + 6;
  const twoRows = gap < valueWidth;
  const valueStep =
    [1, 2, 4].find((step) => step * gap * (twoRows ? 2 : 1) >= valueWidth) ?? 4;

  // Hover/focus tooltip, ported from the CSS + enhance.js pair the static chart
  // used: `hovered` drives the dot swell and the fade-in, `shown` keeps the last
  // hovered point on screen so the tooltip fades out in place rather than
  // snapping to the origin.
  const [hovered, setHovered] = useState(null);
  const [shown, setShown] = useState(null);

  const enterDot = (index) => {
    setHovered(index);
    setShown(index);
  };
  const leaveDot = (index) => {
    setHovered((current) => (current === index ? null : current));
  };

  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, data.points.length - 1])
        .range([margin.left, Math.max(margin.left + 1, width - margin.right)]),
    [width, margin.left, margin.right, data.points.length],
  );

  const yScale = useMemo(
    () => scaleLinear().domain([0, series.axisMax]).range([height - margin.bottom, margin.top]),
    [series.axisMax, height, margin.bottom, margin.top],
  );

  const linePath = useMemo(() => {
    const generator = d3Line()
      .x((_, i) => xScale(i))
      .y((point) => yScale(point[active]));
    return generator(data.points);
  }, [xScale, yScale, active, data.points]);

  const band = useMemo(() => bandRange(data.points), [data.points]);

  /*
   * Placing the labels, once the density is settled.
   *
   * Alternating above/below on a strict odd/even rule is not enough on its own,
   * because the offsets follow the line: where the line climbs steeply, the
   * label hanging under a high point lands at the same height as the label
   * sitting over the next one. So the labels are placed left to right against
   * the boxes already on the chart, each one taking the first position that is
   * clear — above the dot, below it, then a row further out on either side. A
   * label with nowhere to go is dropped rather than allowed to overlap, which
   * in practice only happens on the narrowest cards.
   *
   * The y-axis ticks go in as fixed obstacles, because the first point sits
   * directly against that column and would otherwise print on top of one.
   */
  const valueLabels = useMemo(() => {
    if (!width) return [];
    const lineHeight = valueFont + 3;
    const ceiling = margin.top - 4;
    const floor = height - margin.bottom - 4;
    const placed = series.axisTicks.map((tick) => {
      const tickWidth = compact(tick).length * 0.64 * tickFont + 6;
      return { x: margin.left - 10 - tickWidth / 2, y: yScale(tick), half: tickWidth / 2 };
    });
    const labels = [];

    for (let i = 0; i < data.points.length; i += valueStep) {
      const point = data.points[i];
      const text = compact(point[active]);
      const half = (text.length * 0.64 * valueFont + 6) / 2;
      const x = xScale(i);
      const y = yScale(point[active]);
      const above = y - dotRadius - 8;
      const below = y + dotRadius + valueFont + 2;
      const options = twoRows
        ? [above, below, above - lineHeight, below + lineHeight]
        : [above];

      // Only the labels still within a label's width can overlap this one.
      const neighbours = placed.filter((label) => label.x + label.half > x - half);
      const spot = options.find(
        (candidate) =>
          candidate >= ceiling &&
          candidate <= floor &&
          neighbours.every((label) => Math.abs(label.y - candidate) >= lineHeight),
      );
      if (spot === undefined) continue;
      const label = { key: point.date, text, x, y: spot, half };
      placed.push(label);
      labels.push(label);
    }

    return labels;
  }, [
    width,
    active,
    data.points,
    series.axisTicks,
    valueStep,
    twoRows,
    valueFont,
    tickFont,
    dotRadius,
    height,
    margin.top,
    margin.bottom,
    margin.left,
    xScale,
    yScale,
  ]);
  const lineRef = useRef(null);

  // The draw-in animation, matched to static/enhance.js: measure the path, dash
  // it to its own length, then transition the offset to zero. Re-runs when the
  // series or the width changes, because both change the path length.
  useEffect(() => {
    const path = lineRef.current;
    if (!path || !linePath) return undefined;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const length = path.getTotalLength();
    if (reduceMotion) {
      path.style.strokeDasharray = 'none';
      path.style.strokeDashoffset = '0';
      return undefined;
    }
    path.style.transition = 'none';
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    path.getBoundingClientRect();
    const frame = requestAnimationFrame(() => {
      path.style.transition = 'stroke-dashoffset 900ms ease-out';
      path.style.strokeDashoffset = '0';
    });
    return () => cancelAnimationFrame(frame);
  }, [active, linePath]);

  return (
    <Box
      component="figure"
      sx={{
        m: 0,
        maxWidth: 1280,
        p: { xs: '20px 16px 24px', sm: '34px 40px 40px' },
        borderRadius: '26px',
        bgcolor: '#fef6f7',
        color: PEPPERCORN,
        fontFamily: FONT_STACK,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 3,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography
            component="h3"
            sx={{ m: 0, fontFamily: FONT_STACK, fontSize: 21, fontWeight: 500, lineHeight: 1.35 }}
          >
            {series.title}
          </Typography>
          <Typography
            sx={{ mt: 1, fontFamily: FONT_STACK, fontSize: 16, fontWeight: 400, lineHeight: 1.5 }}
          >
            {data.range}
          </Typography>
        </Box>

        <ToggleButtonGroup
          exclusive
          value={active}
          onChange={(_, next) => {
            if (!next) return;
            setActive(next);
            setHovered(null);
            setShown(null);
          }}
          aria-label="Choose a channel"
          sx={{
            bgcolor: '#ffffff',
            border: '1px solid #bcbbb9',
            borderRadius: '100px',
            p: '6px',
            gap: '6px',
            '& .MuiToggleButtonGroup-grouped': {
              m: 0,
              border: 0,
              borderRadius: '100px !important',
              px: '18px',
              py: '8px',
              fontFamily: FONT_STACK,
              fontSize: 13,
              fontWeight: 500,
              textTransform: 'none',
              color: PEPPERCORN,
              '&.Mui-selected': {
                bgcolor: PEPPERCORN,
                color: '#ffffff',
                '&:hover': { bgcolor: PEPPERCORN },
              },
            },
          }}
        >
          {seriesKeys.map((key) => (
            <ToggleButton key={key} value={key} aria-label={data.series[key].label}>
              {data.series[key].label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box ref={containerRef} sx={{ mt: 4, width: '100%', position: 'relative' }}>
        {width > 0 ? (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`${series.title}. ${data.range}.`}
            style={{ display: 'block', maxWidth: '100%', overflow: 'visible' }}
          >
            {band
              ? (() => {
                  const plotTop = margin.top;
                  const plotBottom = height - margin.bottom;
                  const bandX = xScale(band.start);
                  const bandWidth = Math.max(0, xScale(band.end) - bandX);
                  const g = bandGradient(bandX, bandWidth, plotTop, plotBottom);
                  const gradientId = `react-band-${active}`;
                  return (
                    <>
                      <defs>
                        <radialGradient
                          id={gradientId}
                          gradientUnits="userSpaceOnUse"
                          cx="0"
                          cy="0"
                          r="10"
                          gradientTransform={`matrix(${g.rx / 10} 0 0 ${g.ry / 10} ${g.cx} ${g.cy})`}
                        >
                          <stop stopColor={BAND_PINK} offset="0" />
                          <stop stopColor={BAND_PINK} offset="0.35" />
                          <stop stopColor="#fef6f7" offset="0.75" />
                        </radialGradient>
                      </defs>
                      <rect
                        x={g.x}
                        y={g.y}
                        width={g.width}
                        height={g.height}
                        fill={`url(#${gradientId})`}
                        opacity="0.5"
                      />
                      <text
                        x={g.cx}
                        y={margin.top - 16}
                        textAnchor="middle"
                        style={{ fontSize: narrow ? 12 : 16, fontWeight: 500, fill: PUMPKIN }}
                      >
                        {narrow ? 'BFCM' : 'Black Friday - Cyber Monday'}
                      </text>
                    </>
                  );
                })()
              : null}

            {series.axisTicks.map((tick) => {
              const y = yScale(tick);
              return (
                <g key={tick}>
                  <line
                    x1={margin.left}
                    x2={width - margin.right}
                    y1={y}
                    y2={y}
                    stroke={RULE}
                    strokeWidth="1"
                  />
                  <text
                    x={margin.left - 10}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    style={{ fontSize: tickFont, fontWeight: 500, fill: PEPPERCORN }}
                  >
                    {compact(tick)}
                  </text>
                </g>
              );
            })}

            <path
              ref={lineRef}
              d={linePath}
              fill="none"
              stroke={PUMPKIN}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {data.points.map((point, i) => (
              <Box
                component="circle"
                key={point.date}
                cx={xScale(i)}
                cy={yScale(point[active])}
                r={hovered === i ? hoverRadius : dotRadius}
                fill={PUMPKIN}
                tabIndex={0}
                onMouseEnter={() => enterDot(i)}
                onMouseLeave={() => leaveDot(i)}
                onFocus={() => enterDot(i)}
                onBlur={() => leaveDot(i)}
                sx={{
                  cursor: 'pointer',
                  transition: 'r 100ms ease',
                  '&:focus': { outline: 'none' },
                  '&:focus-visible': {
                    outline: `2px solid ${PEPPERCORN}`,
                    outlineOffset: '2px',
                  },
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                }}
              />
            ))}

            {valueLabels.map((label) => (
              <text
                key={label.key}
                x={label.x}
                y={label.y}
                textAnchor="middle"
                style={{
                  fontSize: valueFont,
                  fontWeight: 500,
                  fill: PEPPERCORN,
                  // Halo in the card colour, painted under the glyphs, so the
                  // label stays readable where it crosses the line or band.
                  paintOrder: 'stroke',
                  stroke: '#fef6f7',
                  strokeWidth: 3,
                  strokeLinejoin: 'round',
                  pointerEvents: 'none',
                }}
              >
                {label.text}
              </text>
            ))}

            {data.points.map((point, i) =>
              i % labelStep === 0 ? (
                <text
                  key={point.date}
                  x={xScale(i)}
                  y={height - margin.bottom + 22}
                  textAnchor="middle"
                  style={{ fontSize: tickFont, fontWeight: 400, fill: PEPPERCORN }}
                >
                  {shortDate(point.date)}
                </text>
              ) : null,
            )}
          </svg>
        ) : (
          <Box sx={{ height }} aria-hidden="true" />
        )}

        {shown !== null && data.points[shown] ? (
          <Box
            role="presentation"
            sx={{
              position: 'absolute',
              zIndex: 2,
              pointerEvents: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              bgcolor: PEPPERCORN,
              color: WHITE,
              fontFamily: FONT_STACK,
              fontSize: 13,
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
              transform: 'translate(-50%, -100%)',
              transition: 'opacity 120ms ease',
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
            style={{
              left: xScale(shown),
              top: yScale(data.points[shown][active]) - hoverRadius - 10,
              opacity: hovered === null ? 0 : 1,
            }}
          >
            <strong style={{ fontWeight: 500 }}>
              {withCommas(data.points[shown][active])}
            </strong>{' '}
            {series.unit}
            <br />
            <span>
              {longDate(data.points[shown].date)}
              {data.points[shown].holiday ? ` · ${data.points[shown].holiday}` : ''}
            </span>
          </Box>
        ) : null}
      </Box>

      <Box
        component="footer"
        sx={{
          mt: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Typography sx={{ m: 0, fontFamily: FONT_STACK, fontSize: 13, lineHeight: 1.3 }}>
          Source: {data.source}
        </Typography>
        <Box
          component="img"
          src="mailchimp-logo.svg"
          alt="Intuit Mailchimp"
          width={99}
          height={28}
          sx={{ display: 'block', flexShrink: 0 }}
        />
      </Box>
    </Box>
  );
}
