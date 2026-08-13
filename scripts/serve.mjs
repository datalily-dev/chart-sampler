/** A static file server for dist/, with no dependencies. */

import { createServer as createHttpServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, normalize } from 'node:path';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export function createServer(root = DIST) {
  return createHttpServer(async (request, response) => {
    try {
      const requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      // normalize() collapses any ../ before it can escape the served directory.
      const relative = normalize(requested === '/' ? 'index.html' : requested.slice(1));

      if (relative.startsWith('..')) {
        response.writeHead(403).end('Forbidden');
        return;
      }

      const file = join(root, relative);
      const info = await stat(file);
      if (!info.isFile()) throw new Error('not a file');
      response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      response.end(await readFile(file));
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });
}

/** Starts on an ephemeral port and resolves the base URL. */
export function listen(server, port = 0, host = '127.0.0.1') {
  return new Promise((resolve) => {
    server.listen(port, host, () => {
      const address = server.address();
      const boundHost = address.address === '::' || address.address === '0.0.0.0'
        ? '127.0.0.1'
        : address.address;
      resolve(`http://${boundHost}:${address.port}`);
    });
  });
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const server = createServer();
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT) || 4321;
  const url = await listen(server, port, host);
  console.log(`Serving dist/ at ${url}`);
  if (host === '0.0.0.0' || host === '::') {
    console.log(`LAN access: http://<your-lan-ip>:${port}`);
  }
}
