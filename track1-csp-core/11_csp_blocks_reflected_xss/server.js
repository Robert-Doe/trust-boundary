// Module 11 — CSP Blocks Reflected XSS
//
// BOTH routes below have the EXACT SAME underlying bug: the `q` query
// parameter is written into the HTML response completely unescaped. That
// bug is never fixed anywhere in this module — see DECISIONS.md for why
// that's the point, not an oversight. The only difference between the two
// routes is whether a Content-Security-Policy header is attached.
//
//   GET /vulnerable?q=<payload>   — no CSP at all (Module 1's baseline shape)
//   GET /protected?q=<payload>    — script-src 'self' 'nonce-<fresh>'

const http = require('http');
const crypto = require('crypto');

const PORT = 6600;

function page(q, csp) {
  const nonce = csp ? crypto.randomBytes(16).toString('base64') : null;
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Search Results</title>
${csp ? `<script nonce="${nonce}">window.__violations = []; document.addEventListener('securitypolicyviolation', e => { window.__violations.push({blockedURI: e.blockedURI, violatedDirective: e.violatedDirective}); const el = document.getElementById('violation-log'); if (el) el.textContent = JSON.stringify(window.__violations); });</script>` : ''}
</head>
<body>
<h1>Search Results</h1>
<p>You searched for: ${q}</p>
<div id="violation-log">(no violations)</div>
</body>
</html>`;
  const policy = csp ? `script-src 'self' 'nonce-${nonce}'` : null;
  return { html, policy };
}

http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://localhost:${PORT}`);
  const q = parsed.searchParams.get('q') || '(nothing — try ?q=your search term)';

  let route;
  if (parsed.pathname === '/vulnerable') route = page(q, false);
  else if (parsed.pathname === '/protected') route = page(q, true);
  else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<!doctype html><html><body style="font-family:system-ui;background:#0d1117;color:#c9d1d9;max-width:640px;margin:3rem auto">
      <h1>Module 11 — CSP Blocks Reflected XSS</h1>
      <p>Both routes below share the IDENTICAL unescaped-reflection bug.</p>
      <p><a style="color:#ff7b72" href="/vulnerable?q=%3Cscript%3Edocument.title%3D%27XSS-EXECUTED%27%3B%3C%2Fscript%3E">Try the exploit against /vulnerable (no CSP)</a></p>
      <p><a style="color:#3fb950" href="/protected?q=%3Cscript%3Edocument.title%3D%27XSS-EXECUTED%27%3B%3C%2Fscript%3E">Try the SAME exploit against /protected (CSP with nonce)</a></p>
      </body></html>`);
  }

  const headers = { 'Content-Type': 'text/html; charset=utf-8' };
  if (route.policy) headers['Content-Security-Policy'] = route.policy;
  res.writeHead(200, headers);
  res.end(route.html);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}`);
});
