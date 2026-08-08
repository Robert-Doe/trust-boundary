// Module 9 — Meta Tag vs. Header
//
// This server sends NO Content-Security-Policy HEADER at all — every policy
// in this module comes from a <meta http-equiv="Content-Security-Policy">
// tag instead, so any restriction you observe is coming purely from the
// meta mechanism, isolating it from everything Modules 3-8 already proved
// about the header.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 6400;

const files = {
  '/': 'index.html',
  '/report-only-attempt.html': 'report-only-attempt.html',
  '/style.css': 'style.css',
  '/violation-listener.js': 'violation-listener.js',
  '/wiring.js': 'wiring.js',
};

http.createServer((req, res) => {
  const key = req.url === '/' ? '/' : req.url;
  const filename = files[key];
  if (!filename) { res.writeHead(404); return res.end('404'); }

  const ext = path.extname(filename);
  const type = ext === '.html' ? 'text/html; charset=utf-8'
             : ext === '.css'  ? 'text/css; charset=utf-8'
             : 'text/javascript; charset=utf-8';

  const data = fs.readFileSync(path.join(__dirname, 'public', filename));
  // Deliberately: NO Content-Security-Policy header, on any route.
  res.writeHead(200, { 'Content-Type': type });
  res.end(data);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}  (no header CSP anywhere — meta tags only)`);
});
