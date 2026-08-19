/**
 * Order rates by day during peak season 2025 — the full-width card below
 * revenue per message, on the same React + D3 + MUI stack as its neighbours.
 *
 * It runs the report's whole peak season, 62 days rather than the 7 and 19 the
 * other charts cover, and that length is what makes it a separate component:
 *
 * 1. Dots mark every day, but their radius comes off the column gap rather than
 *    a fixed size: sixty-two full-size dots are a solid row of ink on a phone.
 *    No value labels either way — the figures stay on the tooltip.
 * 2. Hovering picks the nearest day off a transparent plate over the plot
 *    rather than each point owning a hit area, because at this density the
 *    columns are narrower than a comfortable target. Arrow keys walk the same
 *    selection for anyone not using a pointer.
 * 3. Weekends are shaded, which is the chart's actual finding: order rates run
 *    on a weekly rhythm across the whole season. The bands come off the weekday
 *    field rather than from indices, so they stay right if the window moves, and
 *    a short rule at each end marks where the pair of days begins and ends.
 *
 * Each channel keeps its own y-axis: SMS runs six times the email order rate,
 * so a shared domain would flatten email against the floor.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { line as d3Line } from 'd3-shape';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import ChartTag, { tagMetrics, tagWidth } from './ChartTag.jsx';
import { longDate, shortDate } from './format.js';

const PEPPERCORN = '#231E15';
const WHITE = '#ffffff';
const FONT_STACK =
  '"Graphik Mailchimp App", "Helvetica Neue", Helvetica, Arial, sans-serif';

/* The cream palette from SendsPerDayChart.jsx, its band colour carrying the
   weekend shading here. */
const CREAM = {
  line: '#D79637',
  cardBg: '#FCF8F0',
  grid: '#F6EBD2',
  weekend: '#FAF1DF',
};

/* A short rule at each end of a weekend band, in the tag's peppercorn, so the
   shading reads as a marked-off span rather than a wash of colour. */
const WEEKEND_MARK = 5;

const EM_PER_CHAR = 0.64;
const textWidth = (text, fontSize) => text.length * EM_PER_CHAR * fontSize;

/** "0.04%", "0.25%", and a bare "0%" on the baseline, as the design prints it. */
const percent = (value) => (value === 0 ? '0%' : `${value.toFixed(2)}%`);

/** Saturday and Sunday runs, as half-open day columns rather than points. */
function weekendBands(points) {
  const bands = [];
  let start = null;
  points.forEach((point, index) => {
    const weekend = point.weekday === 'Sat' || point.weekday === 'Sun';
    if (weekend && start === null) start = index;
    if (!weekend && start !== null) {
      bands.push({ start: start - 0.5, end: index - 0.5 });
      start = null;
    }
  });
  if (start !== null) bands.push({ start: start - 0.5, end: points.length - 0.5 });
  return bands;
}

export default function OrderRatesChart({ data }) {
  const seriesKeys = Object.keys(data.series);
  const [active, setActive] = useState(seriesKeys[0] ?? 'email');
  const series = data.series[active];
  const points = data.points;

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
  const narrow = width > 0 && width < 640;
  const tickFont = narrow ? 12 : 14;
  const markerRadius = narrow ? 4 : 5;
  const tag = tagMetrics(narrow);

  /*
   * The gutter holds the widest tick this series can print, so "0.04%" and
   * "0.25%" each get what they need. Above the plot go the half tick label that
   * would otherwise sit over the card's edge, then the Weekends tag.
   */
  const margin = useMemo(() => {
    const widest = Math.max(...series.axisTicks.map((tick) => textWidth(percent(tick), tickFont)));
    return {
      top: (narrow ? 18 : 22) + tag.gap + tag.height,
      right: narrow ? 14 : 28,
      bottom: narrow ? 32 : 36,
      left: Math.ceil(widest) + 14,
    };
  }, [series.axisTicks, tickFont, narrow, tag.gap, tag.height]);

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
        .domain([0, series.axisMax])
        .range([height - margin.bottom, margin.top]),
    [series.axisMax, height, margin.bottom, margin.top],
  );

  /*
   * Weekly dates, which is the design's rhythm and lands on Oct 31, Nov 7, Nov
   * 14 and so on. Where a week's worth of columns is too narrow to hold a date
   * the axis drops to fortnightly rather than rotating or scrolling.
   */
  const plotWidth = Math.max(0, width - margin.left - margin.right);
  const gap = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;

  /* Dots stay a little under a quarter of the gap so neighbours keep daylight
     between them, floored so they don't vanish on the narrowest phone. */
  const dotRadius = Math.max(1.5, Math.min(3, gap * 0.22));
  const dateTicks = useMemo(() => {
    const needed = Math.max(...points.map((p) => textWidth(shortDate(p.date), tickFont))) + 12;
    const step = [7, 14, 21].find((candidate) => candidate * gap >= needed) ?? 21;
    const indices = [];
    for (let i = 0; i < points.length; i += step) indices.push(i);
    // The last day closes the range, so it gets a label unless the tick before
    // it is close enough to collide.
    const last = points.length - 1;
    if (last - indices.at(-1) >= step / 2) indices.push(last);
    return indices;
  }, [points, gap, tickFont]);

  const [hovered, setHovered] = useState(null);
  const [shown, setShown] = useState(null);

  const select = (index) => {
    const clamped = Math.max(0, Math.min(points.length - 1, index));
    setHovered(clamped);
    setShown(clamped);
  };

  const nearestTo = (clientX) => {
    const plate = containerRef.current;
    if (!plate) return null;
    const rect = plate.getBoundingClientRect();
    return Math.round(xScale.invert(clientX - rect.left));
  };

  const linePath = useMemo(() => {
    const generator = d3Line()
      .x((_, i) => xScale(i))
      .y((point) => yScale(point[active]));
    return generator(points);
  }, [xScale, yScale, active, points]);

  const weekends = useMemo(() => weekendBands(points), [points]);
  const weekendTagWidth = tagWidth('Weekends', tag.fontSize);

  // Draw-in animation, matched to its neighbours and static/enhance.js: dash the
  // path to its own length, then transition the offset to zero.
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
      path.style.transition = 'stroke-dashoffset 1100ms ease-out';
      path.style.strokeDashoffset = '0';
    });
    return () => cancelAnimationFrame(frame);
  }, [active, linePath]);

  const plotTop = margin.top;
  const plotBottom = Math.max(margin.top, height - margin.bottom);

  return (
    <Box
      component="figure"
      sx={{
        m: 0,
        width: '100%',
        boxSizing: 'border-box',
        p: '24px 20px',
        borderRadius: '26px',
        bgcolor: CREAM.cardBg,
        color: PEPPERCORN,
        fontFamily: FONT_STACK,
        display: 'flex',
        flexDirection: 'column',
        '@media (min-width: 768px)': { p: '30px 30px 24px' },
        '@media (min-width: 1024px)': { p: '34px 40px 30px' },
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
        {/* Below a 260px basis the toggle wraps under the subtitle, which is the
            phone; above it the toggle holds the top-right corner. */}
        <Box sx={{ flex: '1 1 260px', minWidth: 0 }}>
          <Typography
            component="h3"
            sx={{ m: 0, fontFamily: FONT_STACK, fontSize: 21, fontWeight: 500, lineHeight: 1.35 }}
          >
            {data.title}
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
          minHeight: 240,
          /* Near-square on a phone, where height is free, flattening out as the
             card widens to the report's margins. */
          aspectRatio: '1 / 0.85',
          '@media (min-width: 768px)': { aspectRatio: '1 / 0.44' },
          '@media (min-width: 1024px)': { aspectRatio: '1 / 0.32' },
        }}
      >
        {width > 0 && height > 0 ? (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`${data.title}, ${series.label}. ${data.range}. ${series.note}`}
            style={{ display: 'block', maxWidth: '100%', overflow: 'visible' }}
          >
            {weekends.map((band) => {
              const left = xScale(band.start);
              const right = xScale(band.end);
              /* Rects rather than stroked lines, as in ChartTag: the scale puts
                 these edges between device pixels, where a 1px stroke renders as
                 two grey columns instead of one dark one. */
              const mark = (x) => (
                <rect
                  x={x}
                  y={plotTop}
                  width={1}
                  height={WEEKEND_MARK}
                  fill={PEPPERCORN}
                  shapeRendering="crispEdges"
                />
              );
              return (
                <g key={band.start}>
                  <rect
                    x={left}
                    y={plotTop}
                    width={Math.max(0, right - left)}
                    height={plotBottom - plotTop}
                    fill={CREAM.weekend}
                  />
                  {mark(left)}
                  {mark(right - 1)}
                </g>
              );
            })}

            {/* Nine weekends, so the tag cannot sit on the shading it names the
                way the BFCM one does; it takes the plot's right edge instead. */}
            {weekends.length ? (
              <ChartTag
                x={Math.max(margin.left, width - margin.right - weekendTagWidth)}
                width={Math.min(weekendTagWidth, Math.max(0, width - margin.left - margin.right))}
                bottom={plotTop - tag.gap}
                height={tag.height}
                label="Weekends"
                fontSize={tag.fontSize}
                fill={CREAM.weekend}
              />
            ) : null}

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
                    {percent(tick)}
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

            {/* Hit testing stays on the plate below, so these are decoration
                only and take no pointer events of their own. */}
            {points.map((point, i) => (
              <circle
                key={point.date}
                cx={xScale(i)}
                cy={yScale(point[active])}
                r={dotRadius}
                fill={CREAM.line}
                pointerEvents="none"
              />
            ))}

            {shown !== null && points[shown] ? (
              <>
                <line
                  x1={xScale(shown)}
                  x2={xScale(shown)}
                  y1={plotTop}
                  y2={plotBottom}
                  stroke={PEPPERCORN}
                  strokeWidth="1"
                  opacity={hovered === null ? 0 : 0.25}
                />
                <circle
                  cx={xScale(shown)}
                  cy={yScale(points[shown][active])}
                  r={markerRadius}
                  fill={CREAM.line}
                  stroke={CREAM.cardBg}
                  strokeWidth="2"
                  opacity={hovered === null ? 0 : 1}
                />
              </>
            ) : null}

            {dateTicks.map((index) => (
              <text
                key={points[index].date}
                x={xScale(index)}
                y={height - margin.bottom + 22}
                textAnchor="middle"
                style={{ fontSize: tickFont, fontWeight: 400, fill: PEPPERCORN }}
              >
                {shortDate(points[index].date)}
              </text>
            ))}

            {/*
             * One plate for the whole plot instead of 62 hit areas. It carries
             * the keyboard affordance too: focus lands here once, and the arrow
             * keys walk the series a day at a time.
             */}
            <Box
              component="rect"
              x={margin.left}
              y={plotTop}
              width={Math.max(0, width - margin.left - margin.right)}
              height={plotBottom - plotTop}
              fill="transparent"
              tabIndex={0}
              role="slider"
              aria-label={`${series.label} order rate by day. Use the arrow keys to read each day.`}
              aria-valuemin={0}
              aria-valuemax={points.length - 1}
              aria-valuenow={shown ?? 0}
              aria-valuetext={
                shown === null
                  ? undefined
                  : `${longDate(points[shown].date)}, ${percent(points[shown][active])}`
              }
              onPointerMove={(event) => {
                const index = nearestTo(event.clientX);
                if (index !== null) select(index);
              }}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => select(shown ?? 0)}
              onBlur={() => setHovered(null)}
              onKeyDown={(event) => {
                const current = shown ?? 0;
                if (event.key === 'ArrowRight') select(current + 1);
                else if (event.key === 'ArrowLeft') select(current - 1);
                else if (event.key === 'Home') select(0);
                else if (event.key === 'End') select(points.length - 1);
                else return;
                event.preventDefault();
              }}
              sx={{
                cursor: 'crosshair',
                '&:focus': { outline: 'none' },
                '&:focus-visible': { outline: `2px solid ${PEPPERCORN}`, outlineOffset: '2px' },
              }}
            />
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
              // Held inside the card: a day near either end would otherwise
              // hang the tooltip off the edge.
              left: Math.min(Math.max(xScale(shown), 90), Math.max(90, width - 90)),
              top: yScale(points[shown][active]) - markerRadius - 10,
              opacity: hovered === null ? 0 : 1,
            }}
          >
            <strong style={{ fontWeight: 500 }}>{percent(points[shown][active])}</strong>{' '}
            {series.unit}
            <br />
            <span>
              {longDate(points[shown].date)}
              {points[shown].holiday ? ` · ${points[shown].holiday}` : ''}
            </span>
          </Box>
        ) : null}
      </Box>

      {/* The logo takes the footer's right edge once there is room for it beside
          two lines of source text, and drops below them when there is not. */}
      <Box
        component="figcaption"
        sx={{
          mt: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '6px',
          flexShrink: 0,
          '@media (min-width: 1024px)': {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '24px',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
          <Typography sx={{ m: 0, fontFamily: FONT_STACK, fontSize: 13, lineHeight: 1.4 }}>
            Source: {data.source}
          </Typography>
          <Typography sx={{ m: 0, fontFamily: FONT_STACK, fontSize: 13, lineHeight: 1.4 }}>
            {series.note}
          </Typography>
        </Box>
        <Box
          component="img"
          src="mailchimp-logo.svg"
          alt="Intuit Mailchimp"
          width={99}
          height={28}
          sx={{
            display: 'block',
            mt: '12px',
            flexShrink: 0,
            '@media (min-width: 1024px)': { mt: 0 },
          }}
        />
      </Box>
    </Box>
  );
}
