/**
 * Revenue per message surrounding BFCM 2025 — the full-width card below the
 * click rates section, on the same React + D3 + MUI stack as its neighbours.
 *
 * It is closest to SendsPerDayChart: one shared 19-day x-axis, both channels
 * keyed on the same points, and the Black Friday - Cyber Monday band marking
 * the holiday weekend inside the wider window. Three things differ:
 *
 * 1. No per-point value labels. Nineteen currency labels do not fit on one
 *    row at any width the report uses, and the design does not ask for them;
 *    the figures stay on the tooltip.
 * 2. The card's height comes from the plot's aspect ratio rather than a fixed
 *    520px, because this one runs to the report's margins at every breakpoint
 *    instead of sitting inside the sampler's centred column.
 * 3. Each channel keeps its own y-axis. SMS earns five times what email does
 *    per message, so a shared domain would flatten the email series to a line
 *    along the floor.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { line as d3Line } from 'd3-shape';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import ChartTag, { tagMetrics } from './ChartTag.jsx';
import { longDate, shortDate } from './format.js';

const PEPPERCORN = '#231E15';
const WHITE = '#ffffff';
const FONT_STACK =
  '"Graphik Mailchimp App", "Helvetica Neue", Helvetica, Arial, sans-serif';

/* The cream palette from SendsPerDayChart.jsx, band included. */
const CREAM = {
  line: '#D79637',
  cardBg: '#FCF8F0',
  grid: '#F6EBD2',
  band: '#FAF1DF',
};

const EM_PER_CHAR = 0.64;
const textWidth = (text, fontSize) => text.length * EM_PER_CHAR * fontSize;

/*
 * Cents, floored. The report rounds every displayed figure down, so the sub-cent
 * email values print as the same cent figures the handoff table publishes:
 * 0.0585 reads $0.05, never $0.06. The epsilon is the one from format.js, there
 * to stop 0.29 * 100 landing on 28.999999999999996.
 */
const dollars = (value) => `$${(Math.floor(value * 100 + 1e-9) / 100).toFixed(2)}`;

/** Black Friday → Cyber Monday window, by holiday rather than fixed coords. */
function bandRange(points) {
  const bf = points.findIndex((p) => p.holiday === 'Black Friday');
  const cm = points.findIndex((p) => p.holiday === 'Cyber Monday');
  if (bf < 0 || cm < 0) return null;
  // Inclusive of BF and CM only (Nov 28 – Dec 1); half-step pads so the solid
  // block covers those day columns rather than point-centers.
  return { start: bf - 0.5, end: cm + 0.5 };
}

export default function RevenuePerMessageChart({ data }) {
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
  const dotRadius = narrow ? 3.5 : 5;
  const hoverRadius = narrow ? 6 : 8;
  const tag = tagMetrics(narrow);

  /*
   * The gutter holds the widest tick this series can print, so "$0.06" and
   * "$0.30" each get what they need. The top margin is the BFCM tag's room,
   * which is one strip at every width now that the label is an abbreviation.
   */
  const margin = useMemo(() => {
    const widest = Math.max(
      ...series.axisTicks.map((tick) => textWidth(dollars(tick), tickFont)),
    );
    return {
      top: 46,
      right: narrow ? 14 : 28,
      bottom: narrow ? 32 : 36,
      left: Math.ceil(widest) + 14,
    };
  }, [series.axisTicks, tickFont, narrow]);

  /*
   * Nineteen dates never all fit, so the axis thins rather than rotating or
   * scrolling. Step 2 is the design's desktop rhythm (Nov 20, 22, 24 …); step 6
   * is the phone's, and lands exactly on Nov 20, Nov 26, Dec 2, Dec 8.
   */
  const plotWidth = Math.max(0, width - margin.left - margin.right);
  const gap = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;
  const dayStep = useMemo(() => {
    const needed = Math.max(...points.map((p) => textWidth(shortDate(p.date), tickFont))) + 12;
    return [2, 3, 6].find((step) => step * gap >= needed) ?? 6;
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
        .domain([0, series.axisMax])
        .range([height - margin.bottom, margin.top]),
    [series.axisMax, height, margin.bottom, margin.top],
  );

  const linePath = useMemo(() => {
    const generator = d3Line()
      .x((_, i) => xScale(i))
      .y((point) => yScale(point[active]));
    return generator(points);
  }, [xScale, yScale, active, points]);

  const band = useMemo(() => bandRange(points), [points]);
  const bandWidth = band ? Math.max(0, xScale(band.end) - xScale(band.start)) : 0;

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
            {band ? (
              <>
                <rect
                  x={xScale(band.start)}
                  y={margin.top}
                  width={bandWidth}
                  height={Math.max(0, height - margin.bottom - margin.top)}
                  fill={CREAM.band}
                />
                <ChartTag
                  x={xScale(band.start)}
                  width={bandWidth}
                  bottom={margin.top - tag.gap}
                  height={tag.height}
                  label="BFCM"
                  fontSize={tag.fontSize}
                  fill={CREAM.band}
                />
              </>
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
                    {dollars(tick)}
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
                cy={yScale(point[active])}
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
              top: yScale(points[shown][active]) - hoverRadius - 10,
              opacity: hovered === null ? 0 : 1,
            }}
          >
            <strong style={{ fontWeight: 500 }}>{dollars(points[shown][active])}</strong>{' '}
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
