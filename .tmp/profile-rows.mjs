/**
 * Row profile of dark ink inside a region, to read type sizes and vertical
 * rhythm off a mockup. Usage: node profile-rows.mjs <png> <x0> <x1> <y0> <y1>
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

const [file, ...nums] = process.argv.slice(2);
const [x0, x1, y0, y1] = nums.map(Number);
const img = decode(file);
const lum = (x, y) => {
  const i = (y * img.width + x) * img.channels;
  return 0.299 * img.pixels[i] + 0.587 * img.pixels[i + 1] + 0.114 * img.pixels[i + 2];
};

const runs = [];
for (let y = y0; y <= y1; y += 1) {
  let ink = 0;
  let left = null;
  let right = null;
  for (let x = x0; x <= x1; x += 1) {
    if (lum(x, y) < 140) {
      ink += 1;
      if (left === null) left = x;
      right = x;
    }
  }
  const last = runs.at(-1);
  if (ink > 0) {
    if (last && last.end === y - 1) {
      last.end = y;
      last.left = Math.min(last.left, left);
      last.right = Math.max(last.right, right);
      last.maxInk = Math.max(last.maxInk, ink);
    } else runs.push({ start: y, end: y, left, right, maxInk: ink });
  }
}

const SCALE = Number(process.env.SCALE ?? 1);
for (const run of runs) {
  const h = run.end - run.start + 1;
  console.log(
    `ink y ${run.start}-${run.end} (h ${h}${SCALE !== 1 ? ` -> ${(h / SCALE).toFixed(1)}` : ''})  x ${
      run.left
    }-${run.right}  ink ${run.maxInk}`,
  );
}
