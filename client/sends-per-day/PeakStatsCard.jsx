/**
 * Peak season stats card (Figma 77:5), React + MUI.
 *
 * Values are already formatted in the JSON, so D3 is not needed here — the
 * Email/SMS toggle and layout mirror the server-rendered card.
 */

import { useState } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

const PEPPERCORN = '#231e15';
const FONT_STACK =
  '"Graphik Mailchimp App", "Helvetica Neue", Helvetica, Arial, sans-serif';

export default function PeakStatsCard({ stats }) {
  const seriesKeys = Object.keys(stats.series);
  const [active, setActive] = useState(seriesKeys[0] ?? 'email');

  return (
    <Box
      component="figure"
      sx={{
        m: 0,
        width: '100%',
        minHeight: 466,
        boxSizing: 'border-box',
        p: '24px 30px',
        borderRadius: '26px',
        bgcolor: '#f5f5f5',
        color: PEPPERCORN,
        fontFamily: FONT_STACK,
        display: 'flex',
        flexDirection: 'column',
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
        <Typography
          component="h3"
          sx={{
            m: 0,
            maxWidth: 340,
            fontFamily: FONT_STACK,
            fontSize: 21,
            fontWeight: 500,
            lineHeight: 1.35,
          }}
        >
          {stats.title}
        </Typography>

        <ToggleButtonGroup
          exclusive
          value={active}
          onChange={(_, next) => next && setActive(next)}
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
            <ToggleButton key={key} value={key} aria-label={stats.series[key].label}>
              {stats.series[key].label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box
        component="dl"
        sx={{
          m: '39px 0 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >
        {/* The figure takes its own line under the label until the card is wide
            enough to hold both, then moves up beside it and right-aligns. That
            switch is at 1024 rather than 768 because the two-column grid makes
            the card narrower at 768 (320px) than it is on a phone (330px).
            Both sides are nowrap, and the row can still wrap on its own, so a
            figure that outgrows its line drops rather than running off the card. */}
        {stats.rows.map((row) => (
          <Box
            key={row.label}
            className="stats__row"
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              columnGap: 2,
              pb: '8px',
              borderBottom: `1px solid ${PEPPERCORN}`,
            }}
          >
            <Typography
              component="dt"
              sx={{
                m: 0,
                fontFamily: FONT_STACK,
                fontSize: 21,
                fontWeight: 500,
                lineHeight: 1.35,
                whiteSpace: 'nowrap',
              }}
            >
              {row.label}
            </Typography>
            <Typography
              component="dd"
              sx={{
                m: 0,
                fontFamily: FONT_STACK,
                fontSize: 26,
                fontWeight: 400,
                lineHeight: 1.35,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
                flexBasis: '100%',
                textAlign: 'left',
                // Narrower than any design covers, and the narrowest the card
                // ever gets: gross revenue needs one size down to clear 260px.
                '@media (max-width: 359px)': { fontSize: 21 },
                '@media (min-width: 1024px)': { flexBasis: 'auto', textAlign: 'right' },
              }}
            >
              {row[active]}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box
        component="footer"
        sx={{
          mt: 'auto',
          pt: '38px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '6px',
        }}
      >
        <Typography sx={{ m: 0, fontFamily: FONT_STACK, fontSize: 13, lineHeight: 1.4 }}>
          Source: {stats.source}
        </Typography>
        {stats.note ? (
          <Typography sx={{ m: 0, fontFamily: FONT_STACK, fontSize: 13, lineHeight: 1.4 }}>
            {stats.note}
          </Typography>
        ) : null}
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
