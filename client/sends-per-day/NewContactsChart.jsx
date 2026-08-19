/**
 * New contacts added by day — the right-hand card of the "BFCM is the top of
 * your funnel" section, in the report's 600px column, on the same React + D3 +
 * MUI stack as its neighbours.
 *
 * It is a calendar rather than a line, and that changes how it is built:
 *
 * 1. The marks are laid out by CSS grid, not by an SVG scale. A calendar's
 *    geometry is a seven-track grid with a heading per month, which is what grid
 *    does natively; drawing it into SVG would mean hand-placing 62 rects and
 *    124 labels, and re-deriving all of it on resize. D3 still does the part it
 *    is best at — scaleThreshold turns a count into one of five shades.
 * 2. Every day carries its own figure, which the line charts deliberately do
 *    not. Sixty-two labels along an axis is a solid row of ink; sixty-two labels
 *    each inside their own cell is what a calendar is for. They are floored to
 *    two significant figures to fit, so the tooltip carries the exact count.
 * 3. Type inside the calendar is sized off the cell, not off a breakpoint. The
 *    1024 breakpoint hands this card a 448px column and then grows it to 600px,
 *    so a media query would size the cell type for the narrow end of that range
 *    and be wrong for most of it.
 *
 * October 31 is the only day of its month in the window, and it shares a
 * Sunday-to-Saturday week with November 1, so it sits in November's grid rather
 * than getting a heading of its own over a single cell.
 *
 * Each channel keeps its own thresholds: SMS runs two orders of magnitude below
 * email, so email's cuts would shade the whole SMS calendar in one colour.
 */

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { scaleThreshold } from 'd3-scale';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { longDate, withCommas } from './format.js';

const PEPPERCORN = '#231E15';
const WHITE = '#ffffff';
const FONT_STACK =
  '"Graphik Mailchimp App", "Helvetica Neue", Helvetica, Arial, sans-serif';

/*
 * Jasmine is the surface the stats card uses, and the comp puts this calendar on
 * it too rather than on the cream the line charts sit on. The month heading is a
 * step down from it, and the five shades are sampled from the comp.
 */
const JASMINE = '#F5F5F5';
const MONTH_BG = '#E8E8E8';
const HAIRLINE = '#BCBBB9';
const HEAT = ['#FDF3B1', '#FCED87', '#FAE150', '#E1CB48', '#C3B03E'];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Two significant figures, floored, which is how the comp prints its cells:
 * 15,965,524 reads "15M" and 5,844,425 reads "5.8M". Flooring is the report's
 * rule for every displayed figure, so a short label can only ever understate
 * the count behind it.
 */
function cellLabel(value) {
  const step = (n, suffix) =>
    n >= 10 ? `${Math.floor(n)}${suffix}` : `${(Math.floor(n * 10) / 10).toFixed(1)}${suffix}`;
  if (value >= 1e6) return step(value / 1e6, 'M');
  if (value >= 1e3) return step(value / 1e3, 'K');
  return String(Math.floor(value));
}

/** Sunday-aligned week number. Epoch day 0 was a Thursday, hence the offset. */
const weekOf = (iso) => Math.floor((Date.parse(`${iso}T00:00:00Z`) / 86400000 + 4) / 7);

/**
 * The window split into month sections, each with the blank leading slots its
 * first day needs. A leading section that shares a week with the next one is
 * folded into it, which is what carries October 31 into November.
 */
function calendarSections(points) {
  const sections = [];
  points.forEach((point, index) => {
    const [year, month] = point.date.split('-').map(Number);
    const last = sections.at(-1);
    if (last && last.year === year && last.month === month) last.days.push({ point, index });
    else sections.push({ year, month, days: [{ point, index }] });
  });

  if (sections.length > 1) {
    const [first, second] = sections;
    if (weekOf(first.days.at(-1).point.date) === weekOf(second.days[0].point.date)) {
      second.days.unshift(...first.days);
      sections.shift();
    }
  }

  return sections.map((section) => ({
    ...section,
    label: `${MONTHS[section.month - 1]} ${section.year}`,
    leading: WEEKDAYS.indexOf(section.days[0].point.weekday),
  }));
}

/**
 * A size interpolated between the two comps and held flat outside them. The
 * anchors are the cell each comp draws: 40px on the phone, 65px at 600px.
 */
function between(value, [from, low], [to, high]) {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return low + (high - low) * t;
}

export default function NewContactsChart({ data }) {
  const seriesKeys = Object.keys(data.series);
  const [active, setActive] = useState(seriesKeys[0] ?? 'email');
  const series = data.series[active];
  const points = data.points;

  const sections = useMemo(() => calendarSections(points), [points]);
  const shade = useMemo(
    () => scaleThreshold().domain(series.thresholds).range(HEAT),
    [series.thresholds],
  );

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

  /*
   * The gutter between cells is the one measurement that is not proportional:
   * the phone comp closes it to almost nothing to keep the cells legible, and it
   * has opened to its full 11px by the time the card reaches the 448px column.
   * Everything else follows from the cell that leaves.
   */
  const gap = width > 0 ? between(width, [295, 2], [388, 11]) : 11;
  const cell = width > 0 ? (width - gap * 6) / 7 : 0;

  const dayFont = between(cell, [40, 11], [65, 14]);
  const valueFont = between(cell, [40, 13], [65, 16]);
  const weekdayFont = between(cell, [40, 15], [65, 16]);
  const cellPad = between(cell, [40, 5], [65, 8]);
  const cellRadius = between(cell, [40, 6], [65, 9]);

  // The day the tooltip is describing, and where its cell sits in the calendar.
  const [shown, setShown] = useState(null);
  const [anchor, setAnchor] = useState(null);

  const hide = () => {
    setShown(null);
    setAnchor(null);
  };

  /** Cell offsets are read off the DOM; the calendar is their offset parent. */
  const showCell = (index, el) => {
    setShown(index);
    setAnchor(el ? { left: el.offsetLeft + el.offsetWidth / 2, top: el.offsetTop } : null);
  };

  const select = (index) => {
    const clamped = Math.max(0, Math.min(points.length - 1, index));
    const el = containerRef.current?.querySelector(`[data-day="${clamped}"]`);
    showCell(clamped, el);
  };

  const grid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    columnGap: `${gap}px`,
  };

  return (
    <Box
      component="figure"
      sx={{
        m: 0,
        width: '100%',
        boxSizing: 'border-box',
        px: '20px',
        py: '20px',
        borderRadius: '26px',
        bgcolor: JASMINE,
        color: PEPPERCORN,
        fontFamily: FONT_STACK,
        display: 'flex',
        flexDirection: 'column',
        '@media (min-width: 768px)': { px: '30px', py: '24px' },
        '@media (min-width: 1024px)': {
          /* Interpolated the way ReportBand's own margins are, so the cell size
             carries straight through the breakpoint instead of stepping down. */
          px: 'clamp(30px, calc(30px + (100vw - 1024px) * 0.024038), 40px)',
        },
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
        {/* The comp wraps the toggle under the subtitle in both the 448px column
            and on the phone, and holds the top-right corner at 600px. A 300px
            basis is where that flip lands. */}
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
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
            hide();
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
        sx={{ mt: '20px', width: '100%', position: 'relative', flexShrink: 0 }}
      >
        <Box
          sx={{
            ...grid,
            /* The comp draws this rule only in the 600px column, where the
               header has the room for it. */
            '@media (min-width: 1024px)': {
              pb: '10px',
              borderBottom: `1px solid ${HAIRLINE}`,
            },
          }}
        >
          {WEEKDAYS.map((weekday) => (
            <Box
              key={weekday}
              aria-hidden="true"
              sx={{
                textAlign: 'center',
                fontSize: `${weekdayFont}px`,
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              {weekday}
            </Box>
          ))}
        </Box>

        {/*
         * One focus stop for the whole calendar, the way OrderRatesChart puts
         * one plate over its plot: 62 tab stops is not a keyboard affordance,
         * it is an obstacle. Left and right walk a day, up and down a week.
         */}
        <Box
          tabIndex={0}
          role="slider"
          aria-label={`${series.label} ${series.unit} by day. Use the arrow keys to read each day.`}
          aria-valuemin={0}
          aria-valuemax={points.length - 1}
          aria-valuenow={shown ?? 0}
          aria-valuetext={
            shown === null
              ? undefined
              : `${longDate(points[shown].date)}, ${withCommas(points[shown][active])} ${series.unit}`
          }
          onFocus={() => select(shown ?? 0)}
          onBlur={hide}
          onKeyDown={(event) => {
            const current = shown ?? 0;
            if (event.key === 'ArrowRight') select(current + 1);
            else if (event.key === 'ArrowLeft') select(current - 1);
            else if (event.key === 'ArrowDown') select(current + 7);
            else if (event.key === 'ArrowUp') select(current - 7);
            else if (event.key === 'Home') select(0);
            else if (event.key === 'End') select(points.length - 1);
            else return;
            event.preventDefault();
          }}
          onPointerLeave={hide}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            // Between month sections, not between cells: the heading needs a
            // clear break above it or it reads as another calendar row.
            gap: '18px',
            mt: '10px',
            '&:focus': { outline: 'none' },
            '&:focus-visible': { outline: `2px solid ${PEPPERCORN}`, outlineOffset: '4px' },
          }}
        >
          {sections.map((section) => (
            <Box key={section.label}>
              {/* The slider speaks the whole calendar, and its value text names
                  the month, so the headings stay out of the reading. */}
              <Box
                aria-hidden="true"
                sx={{
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  px: '16px',
                  borderRadius: '8px',
                  bgcolor: MONTH_BG,
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                {section.label}
              </Box>

              <Box sx={{ ...grid, rowGap: `${gap}px`, mt: '14px' }}>
                {Array.from({ length: section.leading }, (_, i) => (
                  <Box key={`blank-${i}`} aria-hidden="true" />
                ))}
                {section.days.map(({ point, index }) => (
                  <Box
                    key={point.date}
                    data-day={index}
                    aria-hidden="true"
                    onPointerEnter={(event) => showCell(index, event.currentTarget)}
                    sx={{
                      aspectRatio: '1 / 1',
                      boxSizing: 'border-box',
                      p: `${cellPad}px`,
                      borderRadius: `${cellRadius}px`,
                      bgcolor: shade(point[active]),
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'default',
                      // Toggling channel reshades every cell at once; a short
                      // cross-fade reads as one change rather than 62.
                      transition: 'background-color 200ms ease',
                      outline: shown === index ? `2px solid ${PEPPERCORN}` : 'none',
                      outlineOffset: '1px',
                      '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                    }}
                  >
                    <Box sx={{ fontSize: `${dayFont}px`, fontWeight: 400, lineHeight: 1.2 }}>
                      {Number(point.date.slice(-2))}
                    </Box>
                    <Box sx={{ fontSize: `${valueFont}px`, fontWeight: 500, lineHeight: 1.2 }}>
                      {cellLabel(point[active])}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        {shown !== null && anchor ? (
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
            }}
            style={{
              // Held inside the card: a cell in the Sunday or Saturday column
              // would otherwise hang the tooltip off the edge.
              left: Math.min(Math.max(anchor.left, 90), Math.max(90, width - 90)),
              top: anchor.top - 8,
            }}
          >
            <strong style={{ fontWeight: 500 }}>{withCommas(points[shown][active])}</strong>{' '}
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
