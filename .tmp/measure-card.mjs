/**
 * Reports the card box, month bands, and weekday rule positions from a mockup,
 * so the component's paddings and gaps can be matched to the design.
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
const rgb = (x, y) => {
  const i = (y * img.width + x) * img.channels;
  return [img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]];
};
const near = (x, y, target, tol = 6) => {
  const [r, g, b] = rgb(x, y);
  return (
    Math.abs(r - target[0]) <= tol && Math.abs(g - target[1]) <= tol && Math.abs(b - target[2]) <= tol
  );
};

const CARD = [0xf5, 0xf5, 0xf5];
const BAND = [0xe8, 0xe8, 0xe8];

// Card box: rows/cols that are mostly card grey.
let minX = img.width;
let maxX = 0;
let minY = img.height;
let maxY = 0;
for (let y = 0; y < img.height; y += 1) {
  for (let x = 0; x < img.width; x += 1) {
    if (!near(x, y, CARD, 2)) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
}
console.log(`card grey extent: x ${minX}-${maxX} (${maxX - minX + 1})  y ${minY}-${maxY} (${maxY - minY + 1})`);

// Month bands: horizontal runs of band grey wider than half the card.
const midX = Math.round((minX + maxX) / 2);
const bandRows = [];
for (let y = 0; y < img.height; y += 1) {
  if (near(midX, y, BAND, 3)) bandRows.push(y);
}
const groups = [];
for (const y of bandRows) {
  const last = groups.at(-1);
  if (last && y - last.at(-1) <= 2) last.push(y);
  else groups.push([y]);
}
for (const group of groups) {
  const y = group[0];
  let left = midX;
  let right = midX;
  while (left > 0 && near(left - 1, y + 2, BAND, 3)) left -= 1;
  while (right < img.width - 1 && near(right + 1, y + 2, BAND, 3)) right += 1;
  console.log(
    `month band: y ${group[0]}-${group.at(-1)} (h ${group.length})  x ${left}-${right} (w ${
      right - left + 1
    })`,
  );
}

// The rule under the weekday names: a mid-grey run across the card.
for (let y = minY; y < minY + 260; y += 1) {
  const [r, g, b] = rgb(midX, y);
  if (r < 230 && r > 140 && Math.abs(r - g) < 8 && Math.abs(g - b) < 12) {
    let left = midX;
    let right = midX;
    const match = (x) => {
      const [rr, gg, bb] = rgb(x, y);
      return rr < 235 && rr > 130 && Math.abs(rr - gg) < 10 && Math.abs(gg - bb) < 14;
    };
    while (left > 0 && match(left - 1)) left -= 1;
    while (right < img.width - 1 && match(right + 1)) right += 1;
    if (right - left > 200) {
      console.log(`rule: y ${y}  x ${left}-${right} (w ${right - left + 1})  ${rgb(midX, y)}`);
    }
  }
}
