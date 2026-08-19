/**
 * Column and row extents of the yellow calendar cells, tolerant enough for the
 * JPEG mockups. Usage: node measure-grid.mjs <png> <scanY> <scanX>
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

const [file, scanYs, scanXs] = process.argv.slice(2);
const img = decode(file);
const yellow = (x, y) => {
  const i = (y * img.width + x) * img.channels;
  const [r, g, b] = [img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]];
  return r > 180 && g > 165 && b < 205 && r - b > 40;
};

const runs = (probe, limit) => {
  const out = [];
  let start = null;
  for (let i = 0; i < limit; i += 1) {
    if (probe(i)) {
      if (start === null) start = i;
    } else if (start !== null) {
      if (i - start > 6) out.push([start, i - 1, i - start]);
      start = null;
    }
  }
  if (start !== null) out.push([start, limit - 1, limit - start]);
  return out;
};

const scanY = Number(scanYs);
const cols = runs((x) => yellow(x, scanY), img.width);
console.log(`columns at y=${scanY}:`);
cols.forEach(([a, b, w], i) => {
  const pitch = i > 0 ? a - cols[i - 1][0] : null;
  console.log(`  x ${a}-${b} w ${w}${pitch ? `  pitch ${pitch} gap ${a - cols[i - 1][1] - 1}` : ''}`);
});

const scanX = Number(scanXs);
const rows = runs((y) => yellow(scanX, y), img.height);
console.log(`rows at x=${scanX}:`);
rows.forEach(([a, b, h], i) => {
  const pitch = i > 0 ? a - rows[i - 1][0] : null;
  console.log(`  y ${a}-${b} h ${h}${pitch ? `  pitch ${pitch} gap ${a - rows[i - 1][1] - 1}` : ''}`);
});
