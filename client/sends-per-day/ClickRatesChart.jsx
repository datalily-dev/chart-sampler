/**
 * Click rates by day during BFCM 2025 — the right-hand card of the "shoulder
 * days" section, React + D3 + MUI, matching SendsPerDayChart's stack.
 *
 * Three things make it its own component rather than a mode of that one:
 *
 * 1. Each channel brings its own points, axis, and date range. Email is a
 *    seven-day series read in hundredths of a percent, SMS is eight days an
 *    order of magnitude higher, so nothing but the card is shared between the
 *    two tabs — not even the x-axis.
 * 2. Both axes start at zero, so the dip through Black Friday reads against the
 *    whole click rate rather than against a cropped window. Each channel keeps
 *    its own maximum, in three steps either way, which puts the gridlines in the
 *    same places on both tabs.
 * 3. The card is a fixed 600px tall at every width — square in the 600px column
 *    of the report's two-column band, and the same height once that band
 *    collapses to one column.
 *
 * There is no Black Friday - Cyber Monday band here. The sends chart needs one
 * to mark a spike inside a 19-day window; this window is the holiday weekend.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { line as d3Line } from 'd3-shape';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { longDate, shortDate } from './format.js';

const PEPPERCORN = '#231E15';
const WHITE = '#ffffff';
const FONT_STACK =
  '"Graphik Mailchimp App", "Helvetica Neue", Helvetica, Arial, sans-serif';

/* The cream entry from SendsPerDayChart.jsx, minus the band it does not draw. */
const CREAM = {
  line: '#D79637',
  cardBg: '#FCF8F0',
  grid: '#F6EBD2',
};

/*
 * Text width without measuring it. A label renders at roughly 0.64em per
 * character in this font, which is the same constant SendsPerDayChart uses to
 * decide how many labels fit; close enough to choose a density, and it costs no
 * layout pass.
 */
const EM_PER_CHAR = 0.64;
const textWidth = (text, fontSize) => text.length * EM_PER_CHAR * fontSize;

/**
 * "1.61%", "1.8%", "13%" — the decimals the source published, per series, and a
 * bare "0%" on the baseline, as the order rates chart prints it.
 */
const percent = (value, decimals) => (value === 0 ? '0%' : `${value.toFixed(decimals)}%`);

export default function ClickRatesChart({ data }) {
  const seriesKeys = Object.keys(data.series);
  const [active, setActive] = useState(seriesKeys[0] ?? 'email');
  const series = data.series[active];
  const points = series.points;
  const tickDecimals = series.tickDecimals ?? 1;
  const valueDecimals = series.decimals ?? 1;

  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update, { passive: true });
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { width, height } = size;
  // Phone-sized plot, not tablet-sized: the 448px column is 388px of plot,
  // which still holds the desktop type. Only the stacked single-column layout
  // drops below this.
  const narrow = width > 0 && width < 360;
  const tickFont = narrow ? 11 : 14;
  const valueFont = narrow ? 10 : 11.5;
  const dotRadius = narrow ? 4 : 5.5;
  const hoverRadius = narrow ? 6 : 8;

  /*
   * The gutter holds the widest y tick this series can print, so "1.8%" and
   * "13%" each get what they need and no more. Measured off the ticks rather
   * than fixed, because the two channels are three orders of magnitude apart.
   */
  const margin = useMemo(() => {
    const widest = Math.max(
      ...series.axisTicks.map((tick) => textWidth(percent(tick, tickDecimals), tickFont)),
    );
    return {
      top: narrow ? 20 : 24,
      right: narrow ? 14 : 22,
      bottom: narrow ? 30 : 34,
      left: Math.ceil(widest) + 14,
    };
  }, [series.axisTicks, tickDecimals, tickFont, narrow]);

  const plotWidth = Math.max(0, width - margin.left - margin.right);
  const gap = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;

  /*
   * Every day gets a label where the columns are wide enough to hold one, which
   * is all seven at 600px and every other one at 448px and on a phone. Thinning
   * rather than rotating or scrolling: the dates are the x-axis's whole job and
   * a reader should not have to tilt their head to use it.
   */
  const dayStep = useMemo(() => {
    const needed =
      Math.max(...points.map((point) => textWidth(shortDate(point.date), tickFont))) + 8;
    return [1, 2, 4].find((step) => step * gap >= needed) ?? 4;
  }, [points, gap, tickFont]);

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
        .domain([0, points.length - 1])
        .range([margin.left, Math.max(margin.left + 1, width - margin.right)]),
    [width, margin.left, margin.right, points.length],
  );

  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([series.axisMin, series.axisMax])
        .range([height - margin.bottom, margin.top]),
    [series.axisMin, series.axisMax, height, margin.bottom, margin.top],
  );

  const linePath = useMemo(() => {
    const generator = d3Line()
      .x((_, i) => xScale(i))
      .y((point) => yScale(point.value));
    return generator(points);
  }, [xScale, yScale, points]);

  /*
   * Label placement, same approach as SendsPerDayChart: work left to right and
   * give each label the first slot that is clear of the labels already placed
   * and of the y-axis ticks, which go in as fixed obstacles because the first
   * point sits against that column. A label with nowhere to go is dropped
   * rather than allowed to overlap; the tooltip still has the figure.
   *
   * With seven or eight points this only bites on a phone, where a steep
   * climb can put one label's slot on top of its neighbour's.
   */
  const valueLabels = useMemo(() => {
    if (!width || !height) return [];
    const lineHeight = valueFont + 3;
    const ceiling = margin.top - 4;
    const floor = height - margin.bottom - 4;
    const placed = series.axisTicks.map((tick) => {
      const half = textWidth(percent(tick, tickDecimals), tickFont) / 2;
      return { x: margin.left - 12 - half, y: yScale(tick), half };
    });
    const labels = [];

    for (const [index, point] of points.entries()) {
      const text = percent(point.value, valueDecimals);
      const half = (textWidth(text, valueFont) + 6) / 2;
      const x = xScale(index);
      const y = yScale(point.value);
      const above = y - dotRadius - 8;
      const below = y + dotRadius + valueFont + 2;
      const rows = [above, below, above - lineHeight, below + lineHeight];

      /*
       * The end points get a sideways move as a second try. The first one sits
       * hard against the y-axis column, so in a narrow card every row it wants
       * is taken by a tick; stepping it inboard clears that column entirely and
       * saves a label that would otherwise be dropped.
       */
      const nudge = half - dotRadius + 4;
      const shifts =
        index === 0 ? [0, nudge] : index === points.length - 1 ? [0, -nudge] : [0];

      let spot;
      for (const shift of shifts) {
        const cx = x + shift;
        // Only labels still within a label's width of this one can collide.
        const neighbours = placed.filter((label) => label.x + label.half > cx - half);
        const row = rows.find(
          (candidate) =>
            candidate >= ceiling &&
            candidate <= floor &&
            neighbours.every((label) => Math.abs(label.y - candidate) >= lineHeight),
        );
        if (row !== undefined) {
          spot = { x: cx, y: row };
          break;
        }
      }
      if (!spot) continue;
      const label = { key: point.date, text, x: spot.x, y: spot.y, half };
      placed.push(label);
      labels.push(label);
    }

    return labels;
  }, [
    width,
    height,
    points,
    series.axisTicks,
    valueDecimals,
    tickDecimals,
    valueFont,
    tickFont,
    dotRadius,
    margin,
    xScale,
    yScale,
  ]);

  // Draw-in animation, matched to SendsPerDayChart and static/enhance.js: dash
  // the path to its own length, then transition the offset to zero.
  const lineRef = useRef(null);
  useEffect(() => {
    const path = lineRef.current;
    if (!path || !linePath) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      path.style.strokeDasharray = 'none';
      path.style.strokeDashoffset = '0';
      return undefined;
    }
    const length = path.getTotalLength();
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
        width: '100%',
        // 600px at every width. The header and the caption both grow as the card
        // narrows — the toggle wraps under the subtitle, the two source lines
        // become four — so the plot absorbs that growth rather than the card.
        height: 600,
        boxSizing: 'border-box',
        p: '24px 20px',
        borderRadius: '26px',
        bgcolor: CREAM.cardBg,
        color: PEPPERCORN,
        fontFamily: FONT_STACK,
        display: 'flex',
        flexDirection: 'column',
        '@media (min-width: 768px)': { p: '30px 30px 24px' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        {/*
         * The 240px basis is the hinge. Above it the toggle still fits alongside
         * and sits top-right, which is the 600px column; below it the toggle
         * wraps under the subtitle, which is the 448px column and the phone.
         */}
        <Box sx={{ flex: '1 1 240px', minWidth: 0 }}>
          <Typography
            component="h3"
            sx={{ m: 0, fontFamily: FONT_STACK, fontSize: 21, fontWeight: 500, lineHeight: 1.35 }}
          >
            {data.title}
          </Typography>
          <Typography
            sx={{ mt: 1, fontFamily: FONT_STACK, fontSize: 16, fontWeight: 400, lineHeight: 1.5 }}
          >
            {series.range}
          </Typography>
        </Box>

        <ToggleButtonGroup
          exclusive
          value={active}
          onChange={(_, next) => {
            if (!next) return;
            setActive(next);
            // The two series are different lengths, so a held index would point
            // at a day the incoming channel may not have.
            setHovered(null);
            setShown(null);
          }}
          aria-label="Choose a channel"
          sx={{
            bgcolor: WHITE,
            border: '1px solid #bcbbb9',
            borderRadius: '100px',
            p: '6px',
            gap: '6px',
            flexShrink: 0,
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
                color: WHITE,
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

      <Box
        ref={containerRef}
        sx={{
          mt: '20px',
          width: '100%',
          position: 'relative',
          // Takes what the fixed card has left after the header and the
          // caption: 306px in the 600px column, 204px once both have wrapped.
          flex: 1,
          minHeight: 0,
        }}
      >
        {width > 0 && height > 0 ? (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`${data.title}, ${series.label}. ${series.range}. ${series.note}`}
            style={{ display: 'block', maxWidth: '100%', overflow: 'visible' }}
          >
            {series.axisTicks.map((tick) => {
              const y = yScale(tick);
              return (
                <g key={tick}>
                  <line
                    x1={margin.left}
                    x2={width - margin.right}
                    y1={y}
                    y2={y}
                    stroke={CREAM.grid}
                    strokeWidth="1"
                  />
                  <text
                    x={margin.left - 12}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    style={{ fontSize: tickFont, fontWeight: 500, fill: PEPPERCORN }}
                  >
                    {percent(tick, tickDecimals)}
                  </text>
                </g>
              );
            })}

            <path
              ref={lineRef}
              d={linePath}
              fill="none"
              stroke={CREAM.line}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {points.map((point, i) => (
              <Box
                component="circle"
                key={point.date}
                cx={xScale(i)}
                cy={yScale(point.value)}
                r={hovered === i ? hoverRadius : dotRadius}
                fill={CREAM.line}
                tabIndex={0}
                onMouseEnter={() => enterDot(i)}
                onMouseLeave={() => leaveDot(i)}
                onFocus={() => enterDot(i)}
                onBlur={() => leaveDot(i)}
                sx={{
                  cursor: 'pointer',
                  transition: 'r 100ms ease',
                  '&:focus': { outline: 'none' },
                  '&:focus-visible': { outline: `2px solid ${PEPPERCORN}`, outlineOffset: '2px' },
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
                  // Halo in the card colour under the glyphs, so a label stays
                  // readable where it crosses the line or a gridline.
                  paintOrder: 'stroke',
                  stroke: CREAM.cardBg,
                  strokeWidth: 3,
                  strokeLinejoin: 'round',
                  pointerEvents: 'none',
                }}
              >
                {label.text}
              </text>
            ))}

            {points.map((point, i) =>
              i % dayStep === 0 ? (
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
        ) : null}

        {shown !== null && points[shown] && width > 0 && height > 0 ? (
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
              top: yScale(points[shown].value) - hoverRadius - 10,
              opacity: hovered === null ? 0 : 1,
            }}
          >
            <strong style={{ fontWeight: 500 }}>
              {percent(points[shown].value, valueDecimals)}
            </strong>{' '}
            {series.unit}
            <br />
            <span>
              {longDate(points[shown].date)}
              {points[shown].holiday ? ` · ${points[shown].holiday}` : ''}
            </span>
          </Box>
        ) : null}
      </Box>

      <Box
        component="figcaption"
        sx={{ mt: '24px', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}
      >
        <Typography sx={{ m: 0, fontFamily: FONT_STACK, fontSize: 13, lineHeight: 1.4 }}>
          Source: {data.source}
        </Typography>
        <Typography sx={{ m: 0, fontFamily: FONT_STACK, fontSize: 13, lineHeight: 1.4 }}>
          {series.note}
        </Typography>
        <Box
          component="img"
          src="mailchimp-logo.svg"
          alt="Intuit Mailchimp"
          width={99}
          height={28}
          sx={{ display: 'block', mt: '12px', flexShrink: 0 }}
        />
      </Box>
    </Box>
  );
}
