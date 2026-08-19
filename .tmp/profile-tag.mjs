/**
 * Scans a mockup PNG for the tag geometry: prints unique colours per row/column
 * run so the chip edges and the 1px rules can be read off directly.
 * Usage: node profile-tag.mjs <file> row <y> | col <x>
 */

import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

function decode(file) {
  const buf = readFileSync(file);
  let pos = 8;
  const idat = [];
  let width = 0;
  let height = 0;
  let depth = 0;
  let colorType = 0;

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') break;
    pos += 12 + len;
  }

  const channels = colorType === 6 ? 4 : 3;
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
      let value = src[i];
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += Math.floor((a + b) / 2);
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      row[i] = value & 0xff;
    }
  }

  return { width, height, channels, pixels: out };
}

const hex = (r, g, b) =>
  `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

const [file, mode, indexArg] = process.argv.slice(2);
const img = decode(file);
const at = (x, y) => {
  const i = (y * img.width + x) * img.channels;
  return hex(img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]);
};

const index = Number(indexArg);
const length = mode === 'row' ? img.width : img.height;
console.log(`${file}: ${img.width}x${img.height} ${mode} ${index}`);

let runStart = 0;
let runColor = mode === 'row' ? at(0, index) : at(index, 0);
for (let i = 1; i <= length; i += 1) {
  const color = i === length ? null : mode === 'row' ? at(i, index) : at(index, i);
  if (color !== runColor) {
    console.log(`  ${runStart}-${i - 1} (${i - runStart}px) ${runColor}`);
    runStart = i;
    runColor = color;
  }
}
