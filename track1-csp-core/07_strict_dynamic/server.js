// Module 7 — strict-dynamic Propagation
//
// Policy: script-src 'self' 'nonce-<fresh>' 'strict-dynamic'
//
// Three things this module verifies empirically, not from documentation:
//   A) the nonced root script itself runs (same mechanism as Module 5)
//   B) a script THAT ROOT SCRIPT dynamically inserts via createElement +
//      appendChild, with NO nonce of its own, also runs — trust propagates
//   C) a script written directly in the static HTML with no nonce is
//      BLOCKED even though 'self' is also in the policy — because
//      'strict-dynamic' makes the browser ignore host/scheme expressions
//      like 'self' entirely once it's present.

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = 5900;
const template = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');

const staticFiles = {
  '/style.css': ['text/css; charset=utf-8', 'style.css'],
  '/violation-listener.js': ['text/javascript; charset=utf-8', 'violation-listener.js'],
  '/dynamic-child.js': ['text/javascript; charset=utf-8', 'dynamic-child.js'],
  '/static-child.js': ['text/javascript; charset=utf-8', 'static-child.js'],
  '/wiring.js': ['text/javascript; charset=utf-8', 'wiring.js'],
};
const fileCache = {};
for (const [url, [, filename]] of Object.entries(staticFiles)) {
  fileCache[url] = fs.readFileSync(path.join(__dirname, 'public', filename), 'utf8');
}

http.createServer((req, res) => {
  if (staticFiles[req.url]) {
    res.writeHead(200, { 'Content-Type': staticFiles[req.url][0] });
    return res.end(fileCache[req.url]);
  }

  const nonce = crypto.randomBytes(16).toString('base64');
  const html = template.replaceAll('{{NONCE}}', nonce);
  const policy = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': policy,
  });
  res.end(html);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}  (script-src 'self' 'nonce-...' 'strict-dynamic')`);
});
