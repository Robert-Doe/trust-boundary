// Module 10 — Violation Reporting API
//
// This module tests BOTH real server-side reporting mechanisms at once,
// rather than assuming which one this browser actually delivers:
//   - the legacy `report-uri` CSP directive (POSTs a `application/csp-report`
//     body directly to a URL, no extra header needed)
//   - the modern `report-to` CSP directive + `Reporting-Endpoints` header
//     (POSTs a batched `application/reports+json` body, browser's own
//     Reporting API, decoupled from CSP specifically)
// A tiny in-memory collector logs whatever actually arrives, from either
// mechanism, so we can see empirically which one(s) this real browser uses.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 6500;
const receivedReports = [];

const POLICY = "default-src 'self'; script-src 'self'; report-uri /csp-report; report-to csp-endpoint";
const REPORTING_ENDPOINTS = 'csp-endpoint="http://localhost:6500/csp-report"';

const files = {
  '/': 'index.html',
  '/style.css': 'style.css',
  '/wiring.js': 'wiring.js',
};

http.createServer((req, res) => {
  if (req.url === '/csp-report' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch { parsed = body; }
      receivedReports.push({
        receivedAt: new Date().toISOString(),
        contentType: req.headers['content-type'],
        body: parsed,
      });
      console.log(`[collector] received a report, content-type=${req.headers['content-type']}`);
      res.writeHead(204);
      res.end();
    });
    return;
  }

  if (req.url === '/debug/reports') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(receivedReports, null, 2));
  }

  const filename = files[req.url === '/' ? '/' : req.url];
  if (!filename) { res.writeHead(404); return res.end('404'); }

  const ext = path.extname(filename);
  const type = ext === '.html' ? 'text/html; charset=utf-8'
             : ext === '.css'  ? 'text/css; charset=utf-8'
             : 'text/javascript; charset=utf-8';
  const data = fs.readFileSync(path.join(__dirname, 'public', filename));

  res.writeHead(200, {
    'Content-Type': type,
    'Content-Security-Policy': POLICY,
    'Reporting-Endpoints': REPORTING_ENDPOINTS,
  });
  res.end(data);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}`);
  console.log(`       CSP: ${POLICY}`);
  console.log(`       Reporting-Endpoints: ${REPORTING_ENDPOINTS}`);
});
