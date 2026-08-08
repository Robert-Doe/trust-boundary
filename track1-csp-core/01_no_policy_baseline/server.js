// Module 1 — No-Policy Baseline
//
// Two plain Node HTTP servers, zero dependencies:
//   MAIN_PORT   (5100) — the "trusted" site. Serves ./public.
//   ATTACK_PORT (5200) — a *different origin* (same host, different port —
//                         see prerequisites/01_http_headers_and_origins.html
//                         #origin-triple). Serves ./attacker-site.
//
// Neither server sets a Content-Security-Policy header anywhere. That
// absence is the entire point of this module — see DECISIONS.md.

const http = require('http');
const fs = require('fs');
const path = require('path');

const MAIN_PORT = 5100;
const ATTACK_PORT = 5200;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

function makeServer(rootDir, label) {
  return http.createServer((req, res) => {
    const urlPath = req.url === '/' ? '/index.html' : req.url;
    const filePath = path.join(rootDir, decodeURIComponent(urlPath.split('?')[0]));

    // Prevent path traversal outside rootDir.
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
      // Deliberately: no Content-Security-Policy header is set anywhere
      // in this module. That is the baseline this module exists to prove.
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

makeServer(path.join(__dirname, 'public'), 'main').listen(MAIN_PORT, () => {
  console.log(`[main]     http://localhost:${MAIN_PORT}  (no CSP header set)`);
});

makeServer(path.join(__dirname, 'attacker-site'), 'attacker').listen(ATTACK_PORT, () => {
  console.log(`[attacker] http://localhost:${ATTACK_PORT}  (simulates a different origin)`);
});
