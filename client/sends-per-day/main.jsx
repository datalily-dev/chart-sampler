/**
 * Client-rendered entry point: mounts both interactive cards (sends-per-day
 * line chart via React + D3, peak stats via React + MUI) into an empty div.
 */

import { createRoot } from 'react-dom/client';
import Box from '@mui/material/Box';

import SendsPerDayChart from './SendsPerDayChart.jsx';
import PeakStatsCard from './PeakStatsCard.jsx';
import HolidayPerformanceChart from './HolidayPerformanceChart.jsx';
import ClickRatesChart from './ClickRatesChart.jsx';
import RevenuePerMessageChart from './RevenuePerMessageChart.jsx';
import OrderRatesChart from './OrderRatesChart.jsx';
import NewContactsChart from './NewContactsChart.jsx';

import dailySends from '../../src/data/daily-sends.json';
import peakStats from '../../src/data/peak-season-stats.json';
import holidayPerformance from '../../src/data/holiday-performance.json';
import clickRates from '../../src/data/click-rates.json';
import revenuePerMessage from '../../src/data/revenue-per-message.json';
import orderRates from '../../src/data/order-rates.json';
import newContacts from '../../src/data/new-contacts.json';

/**
 * A full-bleed band carrying the report's own side margins: 30px on a phone,
 * 44px from 768, then interpolating up to 80px at 1440 and holding there.
 *
 * The outer element escapes the demo page's centred column the same way
 * `.page > .tactics` does in demo.css, because those margins are a property of
 * the report layout rather than of the sampler chrome.
 */
function ReportBand({ children, sx }) {
  return (
    <Box sx={{ width: 'auto', marginInline: 'calc(50% - 50vw)' }}>
      <Box
        sx={{
          boxSizing: 'border-box',
          maxWidth: 1440,
          mx: 'auto',
          px: '30px',
          '@media (min-width: 768px)': { px: '44px' },
          '@media (min-width: 1024px)': {
            px: 'clamp(44px, calc(44px + (100vw - 1024px) * 0.086538), 80px)',
          },
          ...sx,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

/**
 * The report's two-column band: editorial copy on the left, chart on the right.
 *
 * The column widths are not set directly — they fall out of an even two-track
 * grid once the page margin and the gutter are right, which is what keeps the
 * brief's numbers exact at both anchors: 1440 wide gives 600px columns
 * (1440 − 160 − 80) / 2, and 1024 gives 448px (1024 − 88 − 40) / 2. Between
 * those the margin and gutter interpolate, so the columns scale smoothly
 * instead of snapping. Below 768 the grid collapses to one track.
 */
function ReportRow({ children }) {
  return (
    <ReportBand
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        '@media (min-width: 768px)': {
          px: '44px',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          columnGap: '40px',
        },
        '@media (min-width: 1024px)': {
          px: 'clamp(44px, calc(44px + (100vw - 1024px) * 0.086538), 80px)',
          columnGap: 'clamp(40px, calc(40px + (100vw - 1024px) * 0.096154), 80px)',
        },
      }}
    >
      {children}
    </ReportBand>
  );
}

/**
 * Left column of a report row: reserved for the section's copy and stat
 * callouts. Held out of the flow while it is empty so the stacked phone layout
 * does not open a gap above the chart.
 */
function ReservedColumn() {
  return (
    <Box
      aria-hidden="true"
      sx={{ display: 'none', '@media (min-width: 768px)': { display: 'block' } }}
    />
  );
}

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <ReportRow>
        <ReservedColumn />
        <HolidayPerformanceChart data={holidayPerformance} />
      </ReportRow>
      <ReportBand>
        <SendsPerDayChart data={dailySends} palette="cream" />
      </ReportBand>
      <ReportRow>
        <ReservedColumn />
        <ClickRatesChart data={clickRates} />
      </ReportRow>
      <ReportBand>
        <RevenuePerMessageChart data={revenuePerMessage} />
      </ReportBand>
      <ReportBand>
        <OrderRatesChart data={orderRates} />
      </ReportBand>
      <ReportRow>
        <ReservedColumn />
        <NewContactsChart data={newContacts} />
      </ReportRow>
      <ReportRow>
        <ReservedColumn />
        <PeakStatsCard stats={peakStats} />
      </ReportRow>
    </Box>
  );
}

function mount() {
  document.querySelectorAll('[data-sends-per-day-react]').forEach((node) => {
    if (node.dataset.sendsPerDayMounted) return;
    node.dataset.sendsPerDayMounted = 'true';
    createRoot(node).render(<App />);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
