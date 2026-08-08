// Module 4 — Report-Only Mode
//
// Identical shape to Module 3, but the header name changes from
// "Content-Security-Policy" to "Content-Security-Policy-Report-Only", with
// the EXACT SAME policy value. That single word is this module's entire
// point — see DECISIONS.md for what we verified actually differs.

const http = require('http');
const fs = require('fs');
const path = require('path');

const MAIN_PORT = 5500;
const ATTACK_PORT = 5600;

const POLICY = "default-src 'self'; script-src 'self'";

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.png':  'image/png',
};

function makeServer(rootDir, label, { headerName } = {}) {
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
      if (headerName) headers[headerName] = POLICY;
      res.writeHead(200, headers);
      res.end(data);
    });
  });
}

makeServer(path.join(__dirname, 'public'), 'main', { headerName: 'Content-Security-Policy-Report-Only' }).listen(MAIN_PORT, () => {
  console.log(`[main]     http://localhost:${MAIN_PORT}  (Content-Security-Policy-Report-Only: ${POLICY})`);
});

makeServer(path.join(__dirname, 'attacker-site'), 'attacker').listen(ATTACK_PORT, () => {
  console.log(`[attacker] http://localhost:${ATTACK_PORT}`);
});
