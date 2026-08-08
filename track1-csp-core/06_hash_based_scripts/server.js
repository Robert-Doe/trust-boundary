// Module 6 — Hash-Based Scripts
//
// Unlike Module 5's nonce (a per-response secret), a hash source allowlists
// an inline script by the SHA-256 hash of its own exact byte content. No
// server-side randomness, no per-request state — the same script content
// always produces the same hash. See DECISIONS.md for why exactness is the
// entire mechanism, not an implementation detail.

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = 5800;

// This is the EXACT string that will sit between <script> and </script> in
// the HTML. Not one character can differ, or the hash won't match — that's
// not a bug to work around, it's the entire point of Proof B below.
const ALLOWED_SCRIPT =
  "document.getElementById('correct-hash-proof').textContent = 'ran — this exact byte content was hashed and allowlisted'; document.getElementById('correct-hash-proof').className = 'result allowed';";

const hash = crypto.createHash('sha256').update(ALLOWED_SCRIPT, 'utf8').digest('base64');

const template = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
const styleCSS = fs.readFileSync(path.join(__dirname, 'public', 'style.css'), 'utf8');
const wiringJS = fs.readFileSync(path.join(__dirname, 'public', 'wiring.js'), 'utf8');
const violationListenerJS = fs.readFileSync(path.join(__dirname, 'public', 'violation-listener.js'), 'utf8');

http.createServer((req, res) => {
  if (req.url === '/style.css') {
    res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
    return res.end(styleCSS);
  }
  if (req.url === '/wiring.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    return res.end(wiringJS);
  }
  if (req.url === '/violation-listener.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    return res.end(violationListenerJS);
  }

  const html = template
    .replaceAll('{{ALLOWED_SCRIPT}}', ALLOWED_SCRIPT)
    .replaceAll('{{HASH}}', hash);

  const policy = `script-src 'self' 'sha256-${hash}'`;

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': policy,
  });
  res.end(html);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}  (sha256-${hash})`);
});
