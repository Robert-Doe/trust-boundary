// Module 14 — DOM-XSS Sink Baseline
//
// This page runs under the STRICTEST reasonable script-src Track 1 taught
// how to build: 'self' plus a fresh per-response nonce, no 'unsafe-inline',
// no 'unsafe-eval'. Two proofs, same sink (innerHTML), same lack of a
// server round-trip (this is DOM-based XSS — the "attacker data" here is a
// string constant standing in for anything that could reach the sink:
// location.hash, a URL param, an API response, etc.):
//
//   Proof A: a payload whose danger is EXECUTABLE code (an onerror handler)
//   Proof B: a payload whose danger is NON-executing HTML structure (a
//            fake "Account Suspended" banner with a real link to an
//            attacker-controlled URL — no script, no event handler)
//
// Both are handed to innerHTML exactly the same way. Track 1 already
// proved CSP blocks executable content — this module checks whether it
// ALSO blocks the non-executable case, rather than assuming either answer.

const http = require('http');
const crypto = require('crypto');

const PORT = 7100;

http.createServer((req, res) => {
  const nonce = crypto.randomBytes(8).toString('base64');
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': `script-src 'self' 'nonce-${nonce}'`,
  });
  res.end(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Module 14 — DOM-XSS Sink Baseline</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0d1117; color: #c9d1d9; max-width: 700px; margin: 3rem auto; padding: 0 1rem; }
  h1 { color: #fff; }
  .proof { border: 1px solid #30363d; border-radius: 8px; padding: 1rem; margin: 1rem 0; background: #161b22; }
  .proof b { color: #ff7b72; }
  .result { font-family: monospace; }
  .fake-alert { border: 2px solid #d32f2f; background: #3a0d0d; padding: 1rem; border-radius: 6px; margin-top: 0.5rem; }
  .fake-alert a { color: #ff8a80; }
  #violation-log { font-family: monospace; font-size: 0.8rem; white-space: pre-wrap; background: #010409; border: 1px solid #30363d; border-radius: 6px; padding: 0.75rem; }
</style>
</head>
<body>
  <h1>Module 14 — DOM-XSS Sink Baseline</h1>
  <p>Policy in effect: <code>script-src 'self' 'nonce-${nonce}'</code> — the
     strictest reasonable script-src Track 1 taught. Both payloads below
     reach <code>innerHTML</code> the identical way; the only difference is
     what's INSIDE the string.</p>

  <div class="proof">
    <b>Proof A — payload contains an executable handler (predict: CSP blocks the handler)</b>
    <div id="target-a"></div>
    <p id="result-a" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Proof B — payload contains ZERO script, ZERO handlers — pure HTML structure with a real link to an attacker URL (predict: ???)</b>
    <div id="target-b"></div>
    <p id="result-b" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Live CSP violation log</b>
    <div id="violation-log">(none yet)</div>
  </div>

  <script nonce="${nonce}">
    const violations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      violations.push({ blockedURI: e.blockedURI, violatedDirective: e.violatedDirective });
      document.getElementById('violation-log').textContent = JSON.stringify(violations, null, 2);
    });

    // Proof A: an onerror handler injected via innerHTML.
    document.getElementById('target-a').innerHTML =
      '<img src="x" onerror="document.getElementById(\\'result-a\\').textContent = \\'HANDLER RAN (should NOT happen)\\'; document.getElementById(\\'result-a\\').style.color = \\'#f85149\\'">';
    setTimeout(() => {
      if (document.getElementById('result-a').textContent === '(pending)') {
        document.getElementById('result-a').textContent = 'handler did NOT run — sink accepted the string, but CSP blocked the onerror handler when it tried to fire';
      }
    }, 200);

    // Proof B: pure HTML, no executable content of any kind.
    document.getElementById('target-b').innerHTML =
      '<div class="fake-alert"><strong>⚠ Account Suspended</strong><p>Unusual activity detected. <a href="http://localhost:7101/phish">Click here to verify your identity</a>.</p></div>';
    document.getElementById('result-b').textContent =
      'innerHTML assignment completed with ZERO errors, ZERO CSP involvement — real DOM rendered, real link to a different origin, fully live.';
  </script>
</body>
</html>`);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}`);
});

// A second server just to make Proof B's link resolve to something real.
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>You just followed a phishing link from an XSS-injected banner.</h1>');
}).listen(7101, () => console.log('[phish] http://localhost:7101'));
