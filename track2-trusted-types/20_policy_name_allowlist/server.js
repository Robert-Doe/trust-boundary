// Module 20 — Policy-Name Allowlist
//
// The `trusted-types` CSP directive restricts WHICH policy names
// createPolicy() will accept, independent of require-trusted-types-for.
//
//   /allowlist        — trusted-types approved-policy
//   /allow-duplicates — trusted-types approved-policy 'allow-duplicates'

const http = require('http');
const crypto = require('crypto');

const PORT = 7700;

function body(mode) {
  const allowDup = mode === 'allow-duplicates';
  return `
  <div class="proof"><b>Proof A — create policy named "approved-policy" (on the allowlist)</b><p id="result-a" class="result">(pending)</p></div>
  <div class="proof"><b>Proof B — create policy named "rogue-policy" (NOT on the allowlist)</b><p id="result-b" class="result">(pending)</p></div>
  <div class="proof"><b>Proof C — create "approved-policy" a SECOND time (predict: ${allowDup ? "succeeds — 'allow-duplicates' present" : 'throws — duplicate name, no allow-duplicates'})</b><p id="result-c" class="result">(pending)</p></div>

  <script nonce="__NONCE__">
    function run(resultId, fn) {
      const el = document.getElementById(resultId);
      try {
        fn();
        el.textContent = 'SUCCEEDED';
        el.className = 'result allowed';
      } catch (e) {
        el.textContent = 'THREW: ' + e.constructor.name + ': ' + e.message;
        el.className = 'result blocked';
      }
    }

    run('result-a', () => trustedTypes.createPolicy('approved-policy', { createHTML: x => x }));
    run('result-b', () => trustedTypes.createPolicy('rogue-policy', { createHTML: x => x }));
    run('result-c', () => trustedTypes.createPolicy('approved-policy', { createHTML: x => x }));
  </script>`;
}

http.createServer((req, res) => {
  const nonce = crypto.randomBytes(8).toString('base64');
  const mode = req.url === '/allow-duplicates' ? 'allow-duplicates' : 'allowlist';
  const trustedTypesValue = mode === 'allow-duplicates'
    ? "trusted-types approved-policy 'allow-duplicates'"
    : 'trusted-types approved-policy';
  const policy = `script-src 'self' 'nonce-${nonce}'; require-trusted-types-for 'script'; ${trustedTypesValue}`;

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': policy,
  });
  res.end(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Module 20 — Policy-Name Allowlist</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0d1117; color: #c9d1d9; max-width: 720px; margin: 3rem auto; padding: 0 1rem; }
  h1 { color: #fff; }
  .proof { border: 1px solid #30363d; border-radius: 8px; padding: 1rem; margin: 1rem 0; background: #161b22; }
  .proof b { color: #db61a2; }
  .result { font-family: monospace; white-space: pre-wrap; }
  .blocked { color: #f85149; } .allowed { color: #3fb950; }
</style>
</head>
<body>
  <h1>Module 20 — Policy-Name Allowlist (${mode})</h1>
  <p>Policy: <code>${policy}</code></p>
  ${body(mode).replace('__NONCE__', nonce)}
  <p><a href="/allowlist" style="color:#79c0ff">/allowlist</a> · <a href="/allow-duplicates" style="color:#79c0ff">/allow-duplicates</a></p>
</body>
</html>`);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}/allowlist and /allow-duplicates`);
});
