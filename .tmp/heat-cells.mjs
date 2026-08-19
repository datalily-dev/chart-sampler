/**
 * Finds the calendar cells in the desktop mockup and reports each cell's fill,
 * so the value -> colour bucketing can be read back off the design.
 */

import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const HEAT = ['#FDF3B1', '#FCED87', '#FAE150', '#E1CB48', '#C3B03E'];

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

const mask = new Uint8Array(img.width * img.height);
for (let y = 0; y < img.height; y += 1) {
  for (let x = 0; x < img.width; x += 1) {
    if (HEAT.includes(hex(x, y))) mask[y * img.width + x] = 1;
  }
}

// Flood fill each blob of heat colour; a cell is one blob.
const seen = new Uint8Array(mask.length);
const cells = [];
for (let y = 0; y < img.height; y += 1) {
  for (let x = 0; x < img.width; x += 1) {
    const start = y * img.width + x;
    if (!mask[start] || seen[start]) continue;
    const stack = [start];
    seen[start] = 1;
    let minX = x;
    let maxX = x;
    let minY = y;
    let maxY = y;
    let count = 0;
    while (stack.length) {
      const idx = stack.pop();
      const cx = idx % img.width;
      const cy = (idx - cx) / img.width;
      count += 1;
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= img.width || ny >= img.height) continue;
        const n = ny * img.width + nx;
        if (mask[n] && !seen[n]) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    if (count < 400) continue;
    cells.push({ minX, maxX, minY, maxY, count, fill: hex(minX + 4, maxY - 4) });
  }
}

cells.sort((a, b) => a.minY - b.minY || a.minX - b.minX);
console.log(`cells: ${cells.length}`);
for (const cell of cells) {
  console.log(
    `  x ${cell.minX}-${cell.maxX} (${cell.maxX - cell.minX + 1})  y ${cell.minY}-${cell.maxY} (${
      cell.maxY - cell.minY + 1
    })  ${cell.fill}`,
  );
}
