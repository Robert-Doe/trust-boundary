// Module 8 — Multiple-Policy Intersection
//
// The main server sends TWO separate Content-Security-Policy header lines
// on the SAME response (Node's res.setHeader accepts an array to do this —
// see DECISIONS.md for why that's how you get two real header lines, not
// one header with a comma-joined value).
//
//   Policy 1: script-src 'self' 'unsafe-inline'; img-src http://localhost:6300
//   Policy 2: script-src 'self'
//
// A load must satisfy EVERY active policy simultaneously — this module
// proves that's really how Chrome combines them, not a merged/unioned
// source list.

const http = require('http');
const fs = require('fs');
const path = require('path');

const MAIN_PORT = 6200;
const ATTACK_PORT = 6300;

const POLICY_1 = `script-src 'self' 'unsafe-inline'; img-src http://localhost:${ATTACK_PORT}`;
const POLICY_2 = "script-src 'self'";

const template = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');

const staticFiles = {
  '/style.css': 'style.css',
  '/violation-listener.js': 'violation-listener.js',
  '/wiring.js': 'wiring.js',
};
const fileCache = {};
for (const [url, filename] of Object.entries(staticFiles)) {
  fileCache[url] = fs.readFileSync(path.join(__dirname, 'public', filename), 'utf8');
}

http.createServer((req, res) => {
  if (staticFiles[req.url]) {
    const ext = path.extname(staticFiles[req.url]);
    res.writeHead(200, { 'Content-Type': ext === '.css' ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8' });
    return res.end(fileCache[req.url]);
  }

  // Two separate header lines, same name. This is NOT the same as sending
  // one header with a comma-joined value — see DECISIONS.md.
  res.setHeader('Content-Security-Policy', [POLICY_1, POLICY_2]);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.writeHead(200);
  res.end(template);
}).listen(MAIN_PORT, () => {
  console.log(`[main]     http://localhost:${MAIN_PORT}`);
  console.log(`           Policy 1: ${POLICY_1}`);
  console.log(`           Policy 2: ${POLICY_2}`);
});

http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'attacker-site', decodeURIComponent(req.url));
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(data);
  });
}).listen(ATTACK_PORT, () => {
  console.log(`[attacker] http://localhost:${ATTACK_PORT}`);
});
