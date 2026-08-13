/**
 * Dev-only. Production still ships the esbuild IIFE via `npm run build:client`
 * and the static HTML from `node build.mjs`.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, normalizePath } from 'vite';

const CLIENT = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(CLIENT, '..');
const PAGE = resolve(REPO, 'src/pages/embed-react-d3.mjs');
const HTML = resolve(REPO, 'src/lib/html.mjs');

function fsUrl(abs) {
  return `/@fs/${normalizePath(abs)}`;
}

function withViteEntry(pageHtml) {
  return pageHtml
    .replace(/\s*<link rel="stylesheet" href="(?:tokens|components|demo)\.css" \/>/g, '')
    .replace(
      '<script src="sends-per-day-react.js" defer></script>',
      '<script type="module" src="/sends-per-day/dev.jsx"></script>',
    );
}

function chartPage() {
  return {
    name: 'chart-page',
    transformIndexHtml: {
      order: 'pre',
      async handler(_html, ctx) {
        const load = async (abs) => {
          if (ctx.server) return ctx.server.ssrLoadModule(fsUrl(abs));
          return import(abs);
        };
        const [{ render }, { toString }] = await Promise.all([load(PAGE), load(HTML)]);
        return withViteEntry(toString(render()));
      },
    },
    handleHotUpdate({ file, server }) {
      const path = normalizePath(file);
      if (
        path.includes('/src/pages/') ||
        path.includes('/src/lib/') ||
        path.includes('/src/partials/')
      ) {
        server.ws.send({ type: 'full-reload', path: '/' });
        return [];
      }
      return undefined;
    },
  };
}

export default defineConfig({
  root: CLIENT,
  publicDir: resolve(REPO, 'static'),
  plugins: [react(), chartPage()],
  server: {
    port: 4321,
    strictPort: true,
    host: '127.0.0.1',
    fs: { allow: [REPO] },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      'd3-scale',
      'd3-shape',
    ],
  },
});
