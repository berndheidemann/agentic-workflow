#!/usr/bin/env node
/**
 * Lightweight static file server for local site testing (sandbox mode).
 * Serves built sites under their respective subpaths on port 8080.
 *
 * Usage: node scripts/serve-sites.mjs
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const PORT = 8080;

// Map subpath → dist directory
const SITE_ROUTES = {
  '/ap1/': join(PROJECT_ROOT, 'sites/AP1-Trainer/dist'),
  '/pandas/': join(PROJECT_ROOT, 'sites/pandas-lernen/dist'),
  // Add more sites here as they get built:
  '/zuul/': join(PROJECT_ROOT, 'sites/zuul/dist'),
  // '/numpy/': join(PROJECT_ROOT, 'sites/numpy-lernsituation/dist'),
  // '/rest/': join(PROJECT_ROOT, 'sites/rest_noSQL_datenformate/dist'),
  // '/uml/': join(PROJECT_ROOT, 'sites/uml-site/dist'),
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
};

function getMimeType(filePath) {
  return MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

async function tryServeFile(filePath, res) {
  try {
    const s = await stat(filePath);
    if (s.isFile()) {
      const content = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
      res.end(content);
      return true;
    }
  } catch {
    // file not found
  }
  return false;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);

  // Find matching site route
  for (const [prefix, distDir] of Object.entries(SITE_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      const relativePath = pathname.slice(prefix.length) || '';
      const filePath = join(distDir, relativePath);

      // Try exact file
      if (await tryServeFile(filePath, res)) return;

      // Try with index.html (directory)
      if (await tryServeFile(join(filePath, 'index.html'), res)) return;

      // SPA/Starlight fallback: serve the site's index.html
      if (await tryServeFile(join(distDir, 'index.html'), res)) return;

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
  }

  // Root or unmatched path
  if (pathname === '/') {
    const siteList = Object.keys(SITE_ROUTES).map(p => `<li><a href="${p}">${p}</a></li>`).join('');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>Lernplattform — Sites</h1><ul>${siteList}</ul>`);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Sites server running on http://0.0.0.0:${PORT}`);
  for (const [prefix, dir] of Object.entries(SITE_ROUTES)) {
    console.log(`  ${prefix} → ${dir}`);
  }
});
