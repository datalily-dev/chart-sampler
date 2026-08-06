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
        maxWidth: 600,
        minHeight: 466,
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
        {stats.rows.map((row) => (
          <Box
            key={row.label}
            className="stats__row"
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 2,
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
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
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
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Typography sx={{ m: 0, fontFamily: FONT_STACK, fontSize: 13, lineHeight: 1.3 }}>
          Source: {stats.source}
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
