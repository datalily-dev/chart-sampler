/**
 * Client-rendered entry point: mounts both interactive cards (sends-per-day
 * line chart via React + D3, peak stats via React + MUI) into an empty div.
 */

import { createRoot } from 'react-dom/client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import SendsPerDayChart from './SendsPerDayChart.jsx';
import PeakStatsCard from './PeakStatsCard.jsx';

import dailySends from '../../src/data/daily-sends.json';
import peakStats from '../../src/data/peak-season-stats.json';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <Box>
        <Typography
          sx={{
            m: '0 0 12px',
            fontFamily:
              '"Graphik Mailchimp App", "Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: 14,
            fontWeight: 500,
            color: '#231E15',
          }}
        >
          Cream option
        </Typography>
        <SendsPerDayChart data={dailySends} palette="cream" />
      </Box>
      <Box>
        <Typography
          sx={{
            m: '0 0 12px',
            fontFamily:
              '"Graphik Mailchimp App", "Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: 14,
            fontWeight: 500,
            color: '#231E15',
          }}
        >
          Pink option
        </Typography>
        <SendsPerDayChart data={dailySends} palette="pink" />
      </Box>
      <PeakStatsCard stats={peakStats} />
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
