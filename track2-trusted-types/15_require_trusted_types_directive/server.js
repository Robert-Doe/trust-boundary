// Module 15 — require-trusted-types-for Directive
//
// Exact same two payloads as Module 14, PLUS an eval probe. Only ONE thing
// is different: the policy now also includes
// `require-trusted-types-for 'script'`. No trustedTypes.createPolicy() call
// exists ANYWHERE in this module yet — that's Module 16's job. We're
// testing what this single directive does completely on its own, with no
// policy defined to authorize anything.

const http = require('http');
const crypto = require('crypto');

const PORT = 7200;

http.createServer((req, res) => {
  const nonce = crypto.randomBytes(8).toString('base64');
  const policy = `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'; require-trusted-types-for 'script'`;
  // Note: 'unsafe-eval' IS included so that if eval is blocked, we know
  // for certain it's Trusted Types doing it, not script-src's separate
  // eval restriction from Track 1 — isolating the variable.
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': policy,
  });
  res.end(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Module 15 — require-trusted-types-for</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0d1117; color: #c9d1d9; max-width: 720px; margin: 3rem auto; padding: 0 1rem; }
  h1 { color: #fff; }
  .proof { border: 1px solid #30363d; border-radius: 8px; padding: 1rem; margin: 1rem 0; background: #161b22; }
  .proof b { color: #f778ba; }
  .result { font-family: monospace; white-space: pre-wrap; }
  .blocked { color: #f85149; } .allowed { color: #3fb950; }
</style>
</head>
<body>
  <h1>Module 15 — require-trusted-types-for Directive</h1>
  <p>Policy: <code>${policy}</code></p>
  <p>Same two payloads as Module 14. No <code>trustedTypes.createPolicy()</code>
     call exists anywhere on this page — zero policies defined.</p>

  <div class="proof">
    <b>Proof A — executable-handler payload → innerHTML (Module 14: sink accepted it; handler alone got blocked)</b>
    <div id="target-a"></div>
    <p id="result-a" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Proof B — PURE HTML, zero executable content → innerHTML (Module 14: sink accepted it completely, unchecked)</b>
    <div id="target-b"></div>
    <p id="result-b" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Proof C — eval('1+1'), with 'unsafe-eval' present in script-src (isolating: is THIS blocked by Trusted Types specifically?)</b>
    <p id="result-c" class="result">(pending)</p>
  </div>

  <script nonce="${nonce}">
    function tryAssign(id, resultId, html) {
      const el = document.getElementById(resultId);
      try {
        document.getElementById(id).innerHTML = html;
        el.textContent = 'innerHTML assignment SUCCEEDED (should NOT happen)';
        el.className = 'result allowed';
      } catch (e) {
        el.textContent = 'THREW: ' + e.constructor.name + ': ' + e.message;
        el.className = 'result blocked';
      }
    }

    tryAssign('target-a', 'result-a',
      '<img src="x" onerror="window.__never=1">');

    tryAssign('target-b', 'result-b',
      '<div class="fake-alert"><strong>⚠ Account Suspended</strong><p>Click <a href="http://localhost:7101/phish">here</a>.</p></div>');

    try {
      const r = eval('1+1');
      document.getElementById('result-c').textContent = 'eval SUCCEEDED, result: ' + r + ' (should NOT happen if TT blocks it)';
      document.getElementById('result-c').className = 'result allowed';
    } catch (e) {
      document.getElementById('result-c').textContent = 'THREW: ' + e.constructor.name + ': ' + e.message;
      document.getElementById('result-c').className = 'result blocked';
    }
  </script>
</body>
</html>`);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}`);
});
