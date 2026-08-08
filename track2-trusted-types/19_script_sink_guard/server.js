// Module 19 — Script Sink Guard
//
// Same discipline as Module 18, applied to the OTHER sink family:
// TrustedScript (eval, Function, script.text) and TrustedScriptURL
// (script.src). We test each sink individually rather than assuming they
// all behave like eval.

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = 7600;
const childJS = fs.readFileSync(path.join(__dirname, 'public', 'child.js'), 'utf8');

http.createServer((req, res) => {
  if (req.url === '/child.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    return res.end(childJS);
  }

  const nonce = crypto.randomBytes(8).toString('base64');
  const policy = `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'; require-trusted-types-for 'script'`;
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': policy,
  });
  res.end(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Module 19 — Script Sink Guard</title>
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
  <h1>Module 19 — Script Sink Guard</h1>
  <p>Policy: <code>${policy}</code></p>
  <p>('unsafe-eval' is present so any block on eval/Function is unambiguously Trusted Types, not Track 1's script-src — same isolation technique as Module 15.)</p>

  <div class="proof"><b>Proof A — TrustedScript → eval()</b><p id="result-a" class="result">(pending)</p></div>
  <div class="proof"><b>Proof B — TrustedScript → new Function(...) (is the Function constructor Trusted-Types-aware at all?)</b><p id="result-b" class="result">(pending)</p></div>
  <div class="proof"><b>Proof C — TrustedScriptURL → script.src</b><p id="result-c" class="result">(pending)</p></div>
  <div class="proof"><b>Proof D — TrustedScript → script.text (does the ASSIGNMENT succeed? separately: does the script then EXECUTE?)</b><p id="result-d" class="result">(pending)</p></div>
  <div class="proof"><b>Proof E — FAKE (duck-typed toString) → script.src (predict: rejected, like Proof F)</b><p id="result-e" class="result">(pending)</p></div>
  <div class="proof"><b>Proof F — raw string URL (not TrustedScriptURL) → script.src (predict: rejected)</b><p id="result-f" class="result">(pending)</p></div>

  <script nonce="${nonce}">
    const policy = trustedTypes.createPolicy('script-guard-demo', {
      createScript: (input) => input,
      createScriptURL: (input) => input,
    });

    function run(resultId, fn) {
      const el = document.getElementById(resultId);
      try {
        const r = fn();
        el.textContent = 'SUCCEEDED' + (r !== undefined ? (', result: ' + r) : '');
        el.className = 'result allowed';
      } catch (e) {
        el.textContent = 'THREW: ' + e.constructor.name + ': ' + e.message;
        el.className = 'result blocked';
      }
    }

    // Proof A
    run('result-a', () => eval(policy.createScript('40 + 2')));

    // Proof B
    run('result-b', () => {
      const f = new Function(policy.createScript('return 40 + 2'));
      return f();
    });

    // Proof C
    run('result-c', () => {
      const s = document.createElement('script');
      s.src = policy.createScriptURL('/child.js');
      document.body.appendChild(s);
      return '(script tag appended — watch for child.js text appended above)';
    });

    // Proof D
    run('result-d', () => {
      const s = document.createElement('script');
      s.text = policy.createScript('window.__scriptTextRan = true;');
      document.body.appendChild(s);
      return 'window.__scriptTextRan afterward: ' + window.__scriptTextRan;
    });

    // Proof E — fake, never touched the policy. (Note: eval() itself only
    // ever evaluates STRING arguments — per plain JS semantics, eval(x) for
    // non-string x just returns x unchanged, nothing to do with Trusted
    // Types. So this proof uses script.src instead, which we've confirmed
    // properly type-checks its input.)
    run('result-e', () => {
      const s = document.createElement('script');
      s.src = { toString: () => '/child.js' };
      document.body.appendChild(s);
      return '(should not get here)';
    });

    // Proof F — raw string, not created via createScriptURL
    run('result-f', () => {
      const s = document.createElement('script');
      s.src = '/child.js'; // plain string, NOT policy.createScriptURL(...)
      document.body.appendChild(s);
      return '(should not get here)';
    });
  </script>
</body>
</html>`);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}`);
});
