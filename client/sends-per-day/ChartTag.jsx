/**
 * The tag that names a shaded region, drawn in the plot's own coordinates as the
 * design has it: the shading's colour carried into a strip above the plot, a 1px
 * peppercorn rule closing each end, and the label centred between them.
 *
 * One geometry, two ways of sizing it. Over a single window — Black Friday to
 * Cyber Monday — the tag takes that band's exact x and width, so the strip reads
 * as the top edge of the shading it names. Where the shading repeats, as the
 * weekend columns do, no one band can carry the label, so the tag sizes itself
 * to the word and parks against the right edge of the plot instead.
 */

const PEPPERCORN = '#231E15';

/** The 0.64em per character the value and tick labels are measured with. */
const EM_PER_CHAR = 0.64;

/** Rule to text, on the tag that sizes itself to its label. */
const TEXT_PAD = 14;

/** Label room, on the tag that takes its width from the band. */
const MIN_GUTTER = 4;

/**
 * Tag height, its gap above the plot, and the label size, at the two widths the
 * cards distinguish. Read off the comps: the strip runs a little over one and a
 * half times the label's size and all but touches the top gridline.
 */
export function tagMetrics(narrow) {
  return {
    height: narrow ? 22 : 26,
    gap: narrow ? 4 : 5,
    fontSize: narrow ? 13 : 16,
  };
}

/** What a tag has to be to hold `label` at `fontSize` with the design's padding. */
export const tagWidth = (label, fontSize) =>
  Math.ceil(label.length * EM_PER_CHAR * fontSize) + TEXT_PAD * 2 + 2;

/**
 * A tag pinned to a band inherits that band's width, and four columns of a
 * 19-day window is not much on a phone, so the label takes the largest size that
 * still clears the rules rather than running over them.
 */
const fittedFont = (label, fontSize, width) => {
  const room = (width - 2 - MIN_GUTTER * 2) / (label.length * EM_PER_CHAR);
  return Math.max(9, Math.min(fontSize, Math.floor(room)));
};

export default function ChartTag({ x, width, bottom, height, label, fontSize, fill }) {
  if (!(width > 0)) return null;
  const top = bottom - height;
  /*
   * The rules are rects rather than stroked lines because `x` is a scale output
   * and lands between device pixels, where a 1px stroke renders as two grey
   * columns instead of one dark one; crispEdges snaps them back to a hard pixel.
   */
  const rule = (ruleX) => (
    <rect
      x={ruleX}
      y={top}
      width={1}
      height={height}
      fill={PEPPERCORN}
      shapeRendering="crispEdges"
    />
  );

  return (
    <>
      <rect x={x} y={top} width={width} height={height} fill={fill} />
      {rule(x)}
      {rule(x + width - 1)}
      <text
        x={x + width / 2}
        y={top + height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: fittedFont(label, fontSize, width),
          fontWeight: 500,
          fill: PEPPERCORN,
        }}
      >
        {label}
      </text>
    </>
  );
}
