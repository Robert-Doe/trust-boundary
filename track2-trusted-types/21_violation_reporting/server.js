// Module 21 — Trusted Types Violation Reporting
//
// Two DIFFERENT kinds of Trusted Types failure — do BOTH surface through
// the same securitypolicyviolation event / ReportingObserver pipeline
// Track 1's Module 10 already verified for ordinary CSP violations?
//   1. A blocked SINK ASSIGNMENT (raw string, no policy) — a JS exception
//      is thrown (we've seen this since Module 15). Does it ALSO fire a
//      separate reporting signal, or is the thrown error the only signal?
//   2. A blocked POLICY CREATION (disallowed name, Module 20) — also
//      throws. Same question.

const http = require('http');
const crypto = require('crypto');

const PORT = 7800;

http.createServer((req, res) => {
  const nonce = crypto.randomBytes(8).toString('base64');
  const policy = `script-src 'self' 'nonce-${nonce}'; require-trusted-types-for 'script'; trusted-types approved-policy`;
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': policy,
  });
  res.end(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Module 21 — Trusted Types Violation Reporting</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0d1117; color: #c9d1d9; max-width: 760px; margin: 3rem auto; padding: 0 1rem; }
  h1 { color: #fff; }
  .proof { border: 1px solid #30363d; border-radius: 8px; padding: 1rem; margin: 1rem 0; background: #161b22; }
  .proof b { color: #db61a2; }
  .result { font-family: monospace; white-space: pre-wrap; font-size: 0.85rem; }
</style>
</head>
<body>
  <h1>Module 21 — Trusted Types Violation Reporting</h1>
  <p>Policy: <code>${policy}</code></p>

  <div class="proof"><b>DOM event log (securitypolicyviolation)</b><div id="dom-log" class="result">(none yet)</div></div>
  <div class="proof"><b>ReportingObserver log (browser-internal report objects)</b><div id="ro-log" class="result">(none yet)</div></div>

  <div class="proof"><b>Trigger 1 — blocked sink assignment (raw string, no policy covers it)</b><p id="result-1" class="result">(pending)</p></div>
  <div class="proof"><b>Trigger 2 — blocked policy creation (disallowed name)</b><p id="result-2" class="result">(pending)</p></div>

  <script nonce="${nonce}">
    const domEvents = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      domEvents.push({ blockedURI: e.blockedURI, violatedDirective: e.violatedDirective, sample: e.sample });
      document.getElementById('dom-log').textContent = JSON.stringify(domEvents, null, 2);
    });

    const roEvents = [];
    if (typeof ReportingObserver === 'function') {
      const ro = new ReportingObserver((reports) => {
        reports.forEach(r => roEvents.push({ type: r.type, body: r.body }));
        document.getElementById('ro-log').textContent = JSON.stringify(roEvents, null, 2);
      }, { buffered: true });
      ro.observe();
    }

    function run(id, fn) {
      const el = document.getElementById(id);
      try {
        fn();
        el.textContent = 'SUCCEEDED (unexpected)';
      } catch (e) {
        el.textContent = 'THREW (as expected): ' + e.constructor.name + ': ' + e.message;
      }
    }

    // Trigger 1: blocked sink assignment
    run('result-1', () => {
      document.createElement('div').innerHTML = 'a raw string, no policy';
    });

    // Trigger 2: blocked policy creation
    run('result-2', () => {
      trustedTypes.createPolicy('rogue-policy', { createHTML: x => x });
    });

    // Give both reporting channels a moment to catch up, then note if
    // either stayed empty.
    setTimeout(() => {
      if (domEvents.length === 0) document.getElementById('dom-log').textContent = '(still empty after 500ms)';
      if (roEvents.length === 0) document.getElementById('ro-log').textContent = '(still empty after 500ms)';
    }, 500);
  </script>
</body>
</html>`);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}`);
});
