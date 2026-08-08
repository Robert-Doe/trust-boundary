// Module 23 — Forged-Object Defense
//
// Four escalating forgery attempts, each testing a different attack
// surface Module 22 didn't cover:
//   A. Classic prototype pollution (Object.prototype itself)
//   B. Reassigning the global `TrustedHTML` identifier to a fake constructor
//   C. Object.setPrototypeOf instead of Object.create (rules out the
//      creation METHOD as what matters)
//   D. Stealing a real value's string content and reusing it as a plain
//      string (rules out "knowing the right content" as sufficient)

const http = require('http');
const crypto = require('crypto');

const PORT = 8200;

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
<title>Module 23 — Forged-Object Defense</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0d1117; color: #c9d1d9; max-width: 780px; margin: 3rem auto; padding: 0 1rem; }
  h1 { color: #fff; }
  .proof { border: 1px solid #30363d; border-radius: 8px; padding: 1rem; margin: 1rem 0; background: #161b22; }
  .proof b { color: #ffa657; }
  .result { font-family: monospace; white-space: pre-wrap; font-size: 0.82rem; }
</style>
</head>
<body>
  <h1>Module 23 — Forged-Object Defense</h1>
  <p>Policy: <code>${policy}</code></p>

  <div class="proof">
    <b>Attack A — classic prototype pollution: <code>Object.prototype.polluted = 'yes'</code>, then a PLAIN object → innerHTML</b>
    <p id="result-a" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Attack B — reassign the global <code>window.TrustedHTML</code> to a fake constructor entirely</b>
    <p id="result-b" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Attack C — <code>Object.setPrototypeOf</code> instead of <code>Object.create</code> (does the FORGING METHOD matter?)</b>
    <p id="result-c" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Attack D — steal a real value's STRING CONTENT via <code>String(real)</code>, reuse it as a plain string</b>
    <p id="result-d" class="result">(pending)</p>
  </div>

  <script nonce="${nonce}">
    const results = {};
    const policy = trustedTypes.createPolicy('forged-defense-demo', { createHTML: x => x });
    const real = policy.createHTML('<b>real, policy-produced value</b>');

    function tryInto(el, value) {
      try { el.innerHTML = value; return 'ACCEPTED'; }
      catch (e) { return 'REJECTED: ' + e.constructor.name + ': ' + e.message; }
    }

    // Attack A
    Object.prototype.polluted = 'yes';
    const pollutionWorked = ({}).polluted === 'yes';
    const plainObjResult = tryInto(document.createElement('div'), {});
    document.getElementById('result-a').textContent =
      'pollution actually took effect on plain objects: ' + pollutionWorked + '\\n' +
      'plain {} handed to innerHTML anyway: ' + plainObjResult;

    // Attack B
    const OriginalTrustedHTML = window.TrustedHTML;
    let reassignError = null;
    try { window.TrustedHTML = function FakeTrustedHTML(s) { this.value = s; }; }
    catch (e) { reassignError = e.message; }
    let fakeCtorResult = '(reassignment itself failed)';
    let realStillWorksResult = '(n/a)';
    if (!reassignError) {
      const fakeInstance = new window.TrustedHTML('<b>via fake reassigned constructor</b>');
      fakeCtorResult = tryInto(document.createElement('div'), fakeInstance);
      realStillWorksResult = tryInto(document.createElement('div'), real);
    }
    document.getElementById('result-b').textContent =
      'reassigning window.TrustedHTML itself: ' + (reassignError ? 'THREW: ' + reassignError : 'succeeded, no error') + '\\n' +
      'instance of the FAKE constructor → sink: ' + fakeCtorResult + '\\n' +
      'the ORIGINAL real value, tried AFTER reassignment → sink: ' + realStillWorksResult;

    // Attack C
    const viaSetProto = {};
    Object.setPrototypeOf(viaSetProto, OriginalTrustedHTML.prototype);
    const cInstanceof = viaSetProto instanceof OriginalTrustedHTML;
    const cSinkResult = tryInto(document.createElement('div'), viaSetProto);
    document.getElementById('result-c').textContent =
      'setPrototypeOf-forged instanceof TrustedHTML: ' + cInstanceof + '\\n' +
      'sink result: ' + cSinkResult + '\\n' +
      '(compare Module 22\\'s Object.create forgery — same result either way)';

    // Attack D
    const stolenText = String(real);
    const dSinkResult = tryInto(document.createElement('div'), stolenText);
    document.getElementById('result-d').textContent =
      'stolen text: "' + stolenText + '"\\n' +
      'reused as a plain string → sink: ' + dSinkResult;
  </script>
</body>
</html>`);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}`);
});
