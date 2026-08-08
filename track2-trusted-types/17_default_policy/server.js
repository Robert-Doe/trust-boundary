// Module 17 — The "default" Policy
//
// Two routes, same locked-down CSP, one crucial difference:
//   /no-default   — no policy named "default" exists (Module 15's baseline)
//   /with-default — a policy is created with the EXACT name "default"
// On BOTH routes, "legacy" code assigns a raw string directly to innerHTML
// — code that never calls trustedTypes.createPolicy or references any
// policy object at all. Does naming a policy "default" change what THAT
// unmodified legacy code does?

const http = require('http');
const crypto = require('crypto');

const PORT = 7400;

function page(withDefault) {
  return { withDefault, html: (nonce) => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${withDefault ? 'with-default' : 'no-default'}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0d1117; color: #c9d1d9; max-width: 700px; margin: 3rem auto; padding: 0 1rem; }
  h1 { color: #fff; }
  .proof { border: 1px solid #30363d; border-radius: 8px; padding: 1rem; margin: 1rem 0; background: #161b22; }
  .proof b { color: #db61a2; }
  .result { font-family: monospace; white-space: pre-wrap; }
  .blocked { color: #f85149; } .allowed { color: #3fb950; }
</style>
</head>
<body>
  <h1>${withDefault ? '/with-default' : '/no-default'}</h1>
  <p>Policy: <code>__POLICY__</code></p>
  <p>${withDefault
      ? 'A policy named EXACTLY "default" is created below.'
      : 'NO policy named "default" exists on this page (control).'}</p>

  <div id="legacy-target"></div>
  <p id="result-legacy" class="result">(pending)</p>

  <p id="result-eval" class="result">(pending)</p>

  <script nonce="${nonce}">
    ${withDefault ? `
    trustedTypes.createPolicy('default', {
      createHTML: (input) => '[DEFAULT POLICY SANITIZED]: ' + input,
      // deliberately NOT defining createScript on this policy
    });
    ` : ''}

    // "Legacy" code: assigns a raw string directly. This line NEVER
    // references trustedTypes, createPolicy, or any policy object.
    try {
      document.getElementById('legacy-target').innerHTML =
        '<em>a raw string, written by code with zero Trusted Types awareness</em>';
      document.getElementById('result-legacy').textContent =
        'SUCCEEDED — legacy code\\'s raw string was accepted';
      document.getElementById('result-legacy').className = 'result allowed';
    } catch (e) {
      document.getElementById('result-legacy').textContent =
        'THREW: ' + e.constructor.name + ': ' + e.message;
      document.getElementById('result-legacy').className = 'result blocked';
    }

    // Legacy eval — the "default" policy above (if it exists) never
    // defined createScript, so this tests whether "default" auto-covers
    // EVERY sink type or only the ones it actually implements.
    try {
      const r = eval('1+1');
      document.getElementById('result-eval').textContent =
        'eval SUCCEEDED, result: ' + r;
      document.getElementById('result-eval').className = 'result allowed';
    } catch (e) {
      document.getElementById('result-eval').textContent =
        'eval THREW: ' + e.constructor.name + ': ' + e.message;
      document.getElementById('result-eval').className = 'result blocked';
    }
  </script>
</body>
</html>` };
}

http.createServer((req, res) => {
  const nonce = crypto.randomBytes(8).toString('base64');
  const withDefault = req.url === '/with-default';
  const policy = `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'; require-trusted-types-for 'script'`;
  const route = page(withDefault);

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': policy,
  });
  res.end(route.html(nonce).replace('__POLICY__', policy));
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}/no-default and /with-default`);
});
