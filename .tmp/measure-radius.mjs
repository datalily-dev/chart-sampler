/**
 * Estimates a rounded-rect corner radius by walking the top edge inward, and
 * samples text colours. Usage: node measure-radius.mjs <png>
 */

import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

function decode(file) {
  const buf = readFileSync(file);
  let pos = 8;
  const idat = [];
  let width = 0;
  let height = 0;
  let channels = 3;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      channels = data[9] === 6 ? 4 : 3;
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const row = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i += 1) {
      const a = i >= channels ? row[i - channels] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= channels ? prev[i - channels] : 0;
      let v = src[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += Math.floor((a + b) / 2);
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      row[i] = v & 0xff;
    }
  }
  return { width, height, channels, pixels: out };
}

const img = decode(process.argv[2]);
const hex = (x, y) => {
  const i = (y * img.width + x) * img.channels;
  return `#${[img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();
};

/** How far in from the left the fill starts, per row, over a corner. */
function cornerProfile(label, x0, y0, target, span = 16) {
  const rows = [];
  for (let dy = 0; dy < span; dy += 1) {
    let inset = null;
    for (let dx = 0; dx < span; dx += 1) {
      if (hex(x0 + dx, y0 + dy) === target) {
        inset = dx;
        break;
      }
    }
    rows.push(inset);
  }
  console.log(`${label} inset by row: ${rows.join(',')}`);
}

console.log('-- cell corner (Nov 2 cell, top-left at 525,225) --');
cornerProfile('cell', 525, 225, '#FDF3B1');

console.log('-- month band corner (top-left at 526,146) --');
cornerProfile('band', 524, 146, '#E8E8E8');

console.log('-- card corner (top-left near 499,48) --');
cornerProfile('card', 497, 46, '#F5F5F5', 40);

console.log('-- sampled colours --');
const samples = {
  'weekday label': [545, 125],
  'month label': [536, 156],
  rule: [700, 139],
  'day number (light cell)': [531, 232],
  'value (light cell)': [531, 252],
  'footnote': [530, 773],
  'card bg': [880, 300],
};
for (const [label, [x, y]] of Object.entries(samples)) {
  console.log(`  ${label}: ${hex(x, y)}`);
}

// Darkest ink in the weekday row and in the footnote, which is what the eye reads.
function darkest(x0, x1, y0, y1) {
  let best = null;
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const i = (y * img.width + x) * img.channels;
      const l = img.pixels[i] + img.pixels[i + 1] + img.pixels[i + 2];
      if (!best || l < best.l) best = { l, hex: hex(x, y), x, y };
    }
  }
  return best;
}
console.log(`  weekday darkest: ${JSON.stringify(darkest(530, 870, 118, 132))}`);
console.log(`  month label darkest: ${JSON.stringify(darkest(530, 700, 148, 166))}`);
console.log(`  footnote darkest: ${JSON.stringify(darkest(520, 800, 768, 800))}`);
console.log(`  day number darkest: ${JSON.stringify(darkest(528, 545, 228, 240))}`);
