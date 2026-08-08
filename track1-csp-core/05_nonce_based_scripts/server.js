// Module 5 — Nonce-Based Scripts
//
// Every request gets a FRESH random nonce (crypto.randomBytes), injected
// into both the CSP header AND the one inline <script> tag that's supposed
// to be allowed to run. Everything else in this module exists to prove two
// properties of that one shared value — see DECISIONS.md.

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = 5700;
const template = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
const styleCSS = fs.readFileSync(path.join(__dirname, 'public', 'style.css'), 'utf8');
const wiringJS = fs.readFileSync(path.join(__dirname, 'public', 'wiring.js'), 'utf8');

http.createServer((req, res) => {
  if (req.url === '/style.css') {
    res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
    return res.end(styleCSS);
  }
  if (req.url === '/wiring.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    return res.end(wiringJS);
  }

  // A fresh, unpredictable nonce for THIS response only.
  const nonce = crypto.randomBytes(16).toString('base64');

  const html = template.replaceAll('{{NONCE}}', nonce);
  const policy = `script-src 'self' 'nonce-${nonce}'`;

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': policy,
  });
  res.end(html);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}  (fresh nonce generated per request)`);
});
