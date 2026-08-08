// Module 3 — Directive Enforcement
//
// Same two-origin shape as Module 1 (see prerequisites/01_http_headers_and_origins.html#origin-triple),
// but this time the main server sends a REAL Content-Security-Policy header:
//
//   default-src 'self'; script-src 'self'
//
// This module's entire point is to watch a real browser enforce that header
// against the same shape of proofs Module 1 ran with zero restriction.

const http = require('http');
const fs = require('fs');
const path = require('path');

const MAIN_PORT = 5300;
const ATTACK_PORT = 5400;

const POLICY = "default-src 'self'; script-src 'self'";

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.png':  'image/png',
};

function makeServer(rootDir, label, { sendCSP } = {}) {
  return http.createServer((req, res) => {
    const urlPath = req.url === '/' ? '/index.html' : req.url;
    const filePath = path.join(rootDir, decodeURIComponent(urlPath.split('?')[0]));

    if (!filePath.startsWith(path.resolve(rootDir))) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end(`404 Not Found: ${urlPath} (${label})`);
      }
      const ext = path.extname(filePath);
      const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
      if (sendCSP) headers['Content-Security-Policy'] = POLICY;
      res.writeHead(200, headers);
      res.end(data);
    });
  });
}

makeServer(path.join(__dirname, 'public'), 'main', { sendCSP: true }).listen(MAIN_PORT, () => {
  console.log(`[main]     http://localhost:${MAIN_PORT}  (CSP: ${POLICY})`);
});

makeServer(path.join(__dirname, 'attacker-site'), 'attacker').listen(ATTACK_PORT, () => {
  console.log(`[attacker] http://localhost:${ATTACK_PORT}  (no CSP, irrelevant — it's the victim page's policy that matters)`);
});
