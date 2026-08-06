/**
 * A tagged template that escapes interpolated values by default.
 *
 * Values wrapped in `raw()` pass through untouched, which is how nested
 * partials compose. Arrays are joined with no separator so `.map()` results
 * can be dropped straight into a template.
 */

const RAW = Symbol('raw');

const ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function raw(value) {
  return { [RAW]: String(value) };
}

function render(value) {
  if (value === null || value === undefined || value === false) return '';
  if (Array.isArray(value)) return value.map(render).join('');
  if (typeof value === 'object' && RAW in value) return value[RAW];
  return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i += 1) {
    out += render(values[i]) + strings[i + 1];
  }
  return raw(out);
}

/** Flattens a template result down to a plain string, for writing to disk. */
export function toString(value) {
  return render(value);
}
