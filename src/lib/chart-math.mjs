/**
 * Plot geometry for the sends-per-day chart.
 *
 * All coordinates live in the plot SVG's viewBox space, which is derived from
 * the Figma frame: the card is 1280 wide with 40px side padding, so the graph
 * area is 1200 across, and the y origin is shifted up by 60 to make room for
 * the Black Friday callout label that sits above the top gridline.
 *
 * There is no charting library here on purpose. One series of 19 points on a
 * linear scale with ticks the design already fixes needs about this much math,
 * and keeping it dependency-free means the output is portable to any CMS.
 */

export const PLOT = {
  viewBox: '0 -60 1200 500',
  /** Gridlines and the axis label column. */
  gridLeft: 58,
  gridRight: 1200,
  labelRight: 42,
  /** First and last data point, inset slightly from the gridlines as in the design. */
  plotLeft: 63.5,
  plotRight: 1176.5,
  /** Vertical span of the value axis. */
  topY: 8,
  zeroY: 388,
  /** Where the x-axis day labels sit. */
  axisLabelY: 412,
  /** The Black Friday to Cyber Monday highlight band, measured from Figma. */
  band: { x: 503, y: -56, width: 323, height: 520, labelX: 664, labelY: -24 },
  dotRadius: 5.5,
};

export function xFor(index, count) {
  const step = (PLOT.plotRight - PLOT.plotLeft) / (count - 1);
  return round(PLOT.plotLeft + index * step);
}

export function yFor(value, axisMax) {
  return PLOT.zeroY - (value / axisMax) * (PLOT.zeroY - PLOT.topY);
}

/** Builds the polyline path, rounded to a tenth of a unit to keep the markup small. */
export function linePath(values, axisMax) {
  return values
    .map((value, i) => {
      const x = round(xFor(i, values.length));
      const y = round(yFor(value, axisMax));
      return `${i === 0 ? 'M' : 'L'}${x} ${y}`;
    })
    .join(' ');
}

export function points(values, axisMax) {
  return values.map((value, i) => ({
    value,
    x: round(xFor(i, values.length)),
    y: round(yFor(value, axisMax)),
  }));
}

function round(n) {
  return Math.round(n * 10) / 10;
}
