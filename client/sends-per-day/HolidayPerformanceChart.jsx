/**
 * Holiday performance bar chart (the peak-season holidays card), React + MUI.
 *
 * Two switches, not one: the Email/SMS pill toggle picks the channel, and the
 * underlined tabs beneath the title pick the metric. Every combination is a
 * different order of magnitude — 1.39B emails against 5.43M texts, 2.4% clicks
 * against 0.23% conversions — so each channel/metric pair carries its own
 * axisMax in the JSON rather than sharing one scale.
 *
 * Bars are DOM elements, not SVG, which is the one real departure from
 * SendsPerDayChart. A horizontal bar list is a list: the holiday names have to
 * wrap to two lines on a phone and push their own row taller, and letting the
 * browser reflow text does that for free where SVG would need measuring.
 */

import { useState } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { shortDate, withCommas } from './format.js';

const PEPPERCORN = '#231E15';
const WHITE = '#ffffff';
const FONT_STACK =
  '"Graphik Mailchimp App", "Helvetica Neue", Helvetica, Arial, sans-serif';

/*
 * Mirrors the `cream` entry in SendsPerDayChart.jsx so the two cards read as one
 * family; `track` is the extra this chart needs, sitting between that palette's
 * grid and band so an empty track stays visible against the card.
 */
const CREAM = {
  bar: '#D79637',
  cardBg: '#FCF8F0',
  track: '#F1E5CC',
  rule: '#EADDBF',
};

const MUTED = 'rgba(35, 30, 21, 0.55)';

/**
 * Three significant figures, rounded down, trailing zeros kept: 910M, 1.01B,
 * 1.30B, 5.43M, 506K. Deliberately not format.js's `compact`, which drops to one
 * decimal and would print Cyber Monday's 1,300,247,595 as "1.3B" — at these
 * magnitudes that hides the gap between it and Black Friday.
 */
function compactPrecise(value) {
  if (!Number.isFinite(value)) return '—';
  const [divisor, suffix] =
    value >= 1e9 ? [1e9, 'B'] : value >= 1e6 ? [1e6, 'M'] : value >= 1e3 ? [1e3, 'K'] : [1, ''];
  const scaled = value / divisor;
  const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  const step = 10 ** decimals;
  return `${(Math.floor(scaled * step + 1e-9) / step).toFixed(decimals)}${suffix}`;
}

/** Percentages keep the precision the source tables published them at. */
function formatValue(value, config) {
  if (config.format === 'percent') return `${value.toFixed(config.decimals ?? 1)}%`;
  return compactPrecise(value);
}

/** Long form for the row's screen-reader label, where "910M" is unhelpful. */
function spokenValue(value, config) {
  if (config.format === 'percent') return `${value.toFixed(config.decimals ?? 1)} percent`;
  return withCommas(value);
}

export default function HolidayPerformanceChart({ data }) {
  const seriesKeys = Object.keys(data.series);
  const metricKeys = Object.keys(data.metrics);

  const [channel, setChannel] = useState(seriesKeys[0] ?? 'email');
  const [metric, setMetric] = useState(metricKeys[0] ?? 'sent');

  const config = data.series[channel].metrics[metric];
  const { axisMax } = config;

  return (
    <Box
      component="figure"
      sx={{
        m: 0,
        width: '100%',
        boxSizing: 'border-box',
        p: { xs: '24px 20px', sm: '30px 30px 24px' },
        borderRadius: '26px',
        bgcolor: CREAM.cardBg,
        color: PEPPERCORN,
        fontFamily: FONT_STACK,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <Typography
          component="h3"
          /*
           * Takes whatever the toggle leaves rather than a fixed measure, so the
           * title uses the full width available to it in whichever font actually
           * loads. The 300px basis is the hinge, the same one NewContactsChart
           * uses: above it the toggle still fits alongside and sits top-right,
           * below it the toggle wraps underneath, which is the phone and
           * small-tablet layout the rest of the cards share.
           */
          sx={{
            m: 0,
            flex: '1 1 300px',
            minWidth: 0,
            fontFamily: FONT_STACK,
            fontSize: 21,
            fontWeight: 500,
            lineHeight: 1.3,
          }}
        >
          {data.title}
        </Typography>

        <ToggleButtonGroup
          exclusive
          value={channel}
          onChange={(_, next) => next && setChannel(next)}
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

      <Tabs
        value={metric}
        onChange={(_, next) => setMetric(next)}
        aria-label="Choose a metric"
        sx={{
          mt: '26px',
          minHeight: 0,
          borderBottom: `1px solid ${CREAM.rule}`,
          '& .MuiTabs-indicator': { height: 2, bgcolor: PEPPERCORN },
          '& .MuiTabs-flexContainer, & .MuiTabs-list': {
            gap: { xs: '18px', sm: '28px' },
            alignItems: 'flex-end',
          },
          '& .MuiTab-root': {
            minHeight: 0,
            minWidth: 0,
            p: '0 0 10px',
            alignItems: 'flex-start',
            textAlign: 'left',
            // Deliberately not scrollable: a phone wraps "Conversion rate" onto
            // a second line so all three metrics stay visible at once.
            flexShrink: 1,
            whiteSpace: 'normal',
            fontFamily: FONT_STACK,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.3,
            // MUI's button typography adds tracking; the report's tabs don't.
            letterSpacing: 0,
            textTransform: 'none',
            color: MUTED,
            '&.Mui-selected': { color: PEPPERCORN },
          },
        }}
      >
        {metricKeys.map((key) => (
          <Tab key={key} value={key} label={data.metrics[key].label} />
        ))}
      </Tabs>

      <Box
        component="ul"
        sx={{
          m: '24px 0 0',
          p: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {data.holidays.map((holiday) => {
          const value = holiday[channel][metric];
          return (
            <Box component="li" key={holiday.date}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                {/*
                 * Two columns rather than one run of text: on a phone the long
                 * names wrap, and in a single run the second line would start
                 * back under the date. The date takes what it needs and the name
                 * wraps inside its own column, so "Singles Day" sits under
                 * "Veteran's Day/" and the date centres against both lines.
                 */}
                <Typography
                  component="span"
                  sx={{
                    m: 0,
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    columnGap: '7px',
                    alignItems: 'center',
                    minWidth: 0,
                    fontFamily: FONT_STACK,
                    fontSize: 15,
                    fontWeight: 400,
                    lineHeight: 1.3,
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      letterSpacing: '0.03em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {shortDate(holiday.date).toUpperCase()}
                  </Box>
                  <Box component="span">
                    {/* Leading real space, which collapses at the start of the
                        line but keeps copied text and screen readers reading
                        "OCT 31 Halloween". */}
                    {' '}
                    {holiday.label}
                  </Box>
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    m: 0,
                    flexShrink: 0,
                    fontFamily: FONT_STACK,
                    fontSize: 17,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatValue(value, config)}
                </Typography>
              </Box>

              <Box
                role="img"
                aria-label={`${holiday.label}: ${spokenValue(value, config)} ${config.unit}`}
                sx={{ mt: '9px', height: 8, bgcolor: CREAM.track, overflow: 'hidden' }}
              >
                <Box
                  sx={{
                    height: '100%',
                    bgcolor: CREAM.bar,
                    transition: 'width 420ms cubic-bezier(0.22, 0.7, 0.25, 1)',
                    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                  }}
                  style={{ width: `${Math.min(100, (value / axisMax) * 100)}%` }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box
        component="footer"
        sx={{
          mt: '28px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
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
