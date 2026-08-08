// Module 16 — Policy Factory
//
// Same locked-down policy as Module 15 (require-trusted-types-for 'script',
// no unsafe-inline/unsafe-eval), but this page ALSO calls
// trustedTypes.createPolicy() for the first time in this course. We test:
//   - what createPolicy() actually returns
//   - whether the rule function we pass in really executes (observably)
//   - whether the object it returns is accepted by a guarded sink
//   - whether a RAW STRING is still rejected, even with a policy defined
//     elsewhere on the page — proving policies are opt-in per call site,
//     not a global switch that reopens the sink for everyone.

const http = require('http');
const crypto = require('crypto');

const PORT = 7300;

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
<title>Module 16 — Policy Factory</title>
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
  <h1>Module 16 — Policy Factory</h1>
  <p>Policy: <code>${policy}</code></p>

  <div class="proof">
    <b>Proof A — what does createPolicy() return? What TYPE is its output?</b>
    <p id="result-a" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Proof B — did the rule function we passed in actually run? (rule: uppercase the input)</b>
    <p id="result-b" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Proof C — does the sink accept the policy's output? (visually rendered below)</b>
    <div id="target-c"></div>
    <p id="result-c" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Proof D — a RAW STRING, even with a policy defined elsewhere on this page, still rejected? (predict: yes — policies are opt-in per call, not global)</b>
    <p id="result-d" class="result">(pending)</p>
  </div>

  <script nonce="${nonce}">
    let ruleInvocationCount = 0;

    const policy = trustedTypes.createPolicy('module16-demo', {
      createHTML: (input) => {
        ruleInvocationCount++;
        return input.toUpperCase(); // trivial, OBSERVABLE transform
      },
      // deliberately NOT defining createScript or createScriptURL —
      // Proof A checks what that omission means for the returned object.
    });

    // Proof A
    let createScriptOutcome;
    try {
      policy.createScript('1+1'); // we never gave this policy a createScript rule
      createScriptOutcome = 'succeeded (unexpected)';
    } catch (e) {
      createScriptOutcome = 'THREW: ' + e.constructor.name + ': ' + e.message;
    }
    document.getElementById('result-a').textContent =
      'typeof policy: ' + typeof policy + '\\n' +
      'typeof policy.createHTML: ' + typeof policy.createHTML + '\\n' +
      'typeof policy.createScript (never defined a rule for it): ' + typeof policy.createScript + '\\n' +
      '  → but CALLING it: ' + createScriptOutcome + '\\n' +
      'policy.name: ' + policy.name;

    // Proof B
    const trustedValue = policy.createHTML('hello world');
    document.getElementById('result-b').textContent =
      'ruleInvocationCount: ' + ruleInvocationCount + '\\n' +
      'typeof trustedValue: ' + typeof trustedValue + '\\n' +
      'trustedValue instanceof TrustedHTML: ' + (trustedValue instanceof TrustedHTML) + '\\n' +
      'trustedValue instanceof String: ' + (trustedValue instanceof String) + '\\n' +
      'String(trustedValue): "' + String(trustedValue) + '"';

    // Proof C
    try {
      document.getElementById('target-c').innerHTML = trustedValue;
      document.getElementById('result-c').textContent = 'innerHTML assignment SUCCEEDED — see rendered text above (should read "HELLO WORLD")';
      document.getElementById('result-c').className = 'result allowed';
    } catch (e) {
      document.getElementById('result-c').textContent = 'THREW: ' + e.message;
      document.getElementById('result-c').className = 'result blocked';
    }

    // Proof D
    try {
      document.getElementById('result-d').textContent = 'assigning a raw string...';
      const dummy = document.createElement('div');
      dummy.innerHTML = 'a plain string, not created via any policy';
      document.getElementById('result-d').textContent = 'SUCCEEDED (should NOT happen)';
      document.getElementById('result-d').className = 'result allowed';
    } catch (e) {
      document.getElementById('result-d').textContent = 'THREW: ' + e.constructor.name + ': ' + e.message;
      document.getElementById('result-d').className = 'result blocked';
    }
  </script>
</body>
</html>`);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}`);
});
