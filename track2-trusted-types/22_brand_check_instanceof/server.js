// Module 22 — Brand Check via instanceof
//
// The central question this module answers empirically: does the browser's
// REAL sink guard use plain instanceof (which prerequisites/04 already
// showed can be spoofed via Object.create) to decide whether a value is a
// genuine TrustedHTML — or something stronger?

const http = require('http');
const crypto = require('crypto');

const PORT = 8000;

http.createServer((req, res) => {
  const nonce = crypto.randomBytes(8).toString('base64');
  const policy = `script-src 'self' 'nonce-${nonce}'; require-trusted-types-for 'script'`;
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': policy,
  });
  res.end(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Module 22 — Brand Check via instanceof</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0d1117; color: #c9d1d9; max-width: 760px; margin: 3rem auto; padding: 0 1rem; }
  h1 { color: #fff; }
  .proof { border: 1px solid #30363d; border-radius: 8px; padding: 1rem; margin: 1rem 0; background: #161b22; }
  .proof b { color: #ffa657; }
  .result { font-family: monospace; white-space: pre-wrap; font-size: 0.85rem; }
  .blocked { color: #f85149; } .allowed { color: #3fb950; }
</style>
</head>
<body>
  <h1>Module 22 — Brand Check via instanceof</h1>
  <p>Policy: <code>${policy}</code></p>

  <div class="proof">
    <b>Proof A — a REAL TrustedHTML value: instanceof check AND sink acceptance</b>
    <p id="result-a" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Proof B — a FORGED object via <code>Object.create(TrustedHTML.prototype)</code>: does instanceof still say true? Does the SINK still accept it?</b>
    <p id="result-b" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Proof C — an EVEN MORE elaborate forgery: copy every own property from a real TrustedHTML onto the forged object too</b>
    <p id="result-c" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Proof D — does the forged object's sink rejection ALSO fire a securitypolicyviolation event, same as Module 21's failures?</b>
    <p id="result-d" class="result">(pending)</p>
  </div>

  <script nonce="${nonce}">
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__lastViolation = { blockedURI: e.blockedURI, violatedDirective: e.violatedDirective };
    });

    const policy = trustedTypes.createPolicy('brand-check-demo', { createHTML: x => x });
    const real = policy.createHTML('<b>real, policy-produced value</b>');

    // Proof A
    document.getElementById('result-a').textContent =
      'real instanceof TrustedHTML: ' + (real instanceof TrustedHTML) + '\\n' +
      'Object.getPrototypeOf(real) === TrustedHTML.prototype: ' + (Object.getPrototypeOf(real) === TrustedHTML.prototype) + '\\n' +
      (() => {
        try {
          document.createElement('div').innerHTML = real;
          return 'sink accepted it: true';
        } catch (e) { return 'sink accepted it: false (' + e.message + ')'; }
      })();

    // Proof B — the forgery from prerequisites/04_js_prototype_chain.html, applied for real
    const forged = Object.create(TrustedHTML.prototype);
    let forgedSinkResult;
    try {
      document.createElement('div').innerHTML = forged;
      forgedSinkResult = 'ACCEPTED (would be a real bypass)';
    } catch (e) {
      forgedSinkResult = 'REJECTED: ' + e.constructor.name + ': ' + e.message;
    }
    document.getElementById('result-b').textContent =
      'forged instanceof TrustedHTML: ' + (forged instanceof TrustedHTML) + '  ← passes the JS-level check!\\n' +
      'sink result: ' + forgedSinkResult;

    // Proof C — copy every own property from the real value too, not just the prototype
    const forged2 = Object.create(TrustedHTML.prototype);
    Object.getOwnPropertyNames(real).forEach((key) => {
      try {
        Object.defineProperty(forged2, key, Object.getOwnPropertyDescriptor(real, key));
      } catch (e) { /* some properties may not be copyable; ignore for this probe */ }
    });
    let forged2Result;
    try {
      document.createElement('div').innerHTML = forged2;
      forged2Result = 'ACCEPTED (would be a real bypass)';
    } catch (e) {
      forged2Result = 'REJECTED: ' + e.constructor.name + ': ' + e.message;
    }
    document.getElementById('result-c').textContent =
      'own property names copied: ' + JSON.stringify(Object.getOwnPropertyNames(real)) + '\\n' +
      'sink result: ' + forged2Result;

    // Proof D
    window.__lastViolation = null;
    try {
      document.createElement('div').innerHTML = forged;
    } catch (e) { /* expected */ }
    setTimeout(() => {
      document.getElementById('result-d').textContent =
        'securitypolicyviolation fired for the forged-object rejection: ' + JSON.stringify(window.__lastViolation);
    }, 200);
  </script>
</body>
</html>`);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}`);
});
