// Module 18 — HTML Sink Guard
//
// Two questions this module answers empirically:
//   1. Does the guard apply uniformly across the WHOLE family of HTML
//      sinks (innerHTML, outerHTML, insertAdjacentHTML), or just innerHTML?
//   2. Does the guard check the VALUE'S TYPE, or can something that merely
//      LOOKS like the right string (via toString(), or a boxed String
//      object) sneak through?

const http = require('http');
const crypto = require('crypto');

const PORT = 7500;

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
<title>Module 18 — HTML Sink Guard</title>
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
  <h1>Module 18 — HTML Sink Guard</h1>
  <p>Policy: <code>${policy}</code></p>

  <div class="proof">
    <b>Proof A — real TrustedHTML → innerHTML</b>
    <div id="target-a"></div>
    <p id="result-a" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Proof B — real TrustedHTML → outerHTML (a DIFFERENT sink, same family)</b>
    <div id="target-b">(will be replaced)</div>
    <p id="result-b" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Proof C — real TrustedHTML → insertAdjacentHTML (a METHOD argument, not a property assignment)</b>
    <div id="target-c">existing content, </div>
    <p id="result-c" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Proof D — a DUCK-TYPED FAKE: <code>{ toString: () => '&lt;b&gt;fake&lt;/b&gt;' }</code> → innerHTML (predict: rejected — type matters, not stringified appearance)</b>
    <p id="result-d" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Proof E — a BOXED STRING: <code>new String('&lt;b&gt;boxed&lt;/b&gt;')</code> → innerHTML (predict: rejected — a real String object still isn't a TrustedHTML)</b>
    <p id="result-e" class="result">(pending)</p>
  </div>

  <script nonce="${nonce}">
    const policy = trustedTypes.createPolicy('sink-guard-demo', {
      createHTML: (input) => input, // no transform — this module is about TYPE, not content
    });

    function run(id, resultId, fn) {
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

    // Proof A
    run('target-a', 'result-a', () => {
      document.getElementById('target-a').innerHTML = policy.createHTML('<b>real TrustedHTML, via innerHTML</b>');
    });

    // Proof B
    run('target-b', 'result-b', () => {
      document.getElementById('target-b').outerHTML = policy.createHTML('<div id="target-b-replaced"><b>real TrustedHTML, via outerHTML</b></div>');
    });

    // Proof C
    run('target-c', 'result-c', () => {
      document.getElementById('target-c').insertAdjacentHTML('beforeend', policy.createHTML('<b>real TrustedHTML, via insertAdjacentHTML</b>'));
    });

    // Proof D
    run('dummy-d', 'result-d', () => {
      const fake = { toString: () => '<b>fake</b>' };
      const el = document.createElement('div');
      el.innerHTML = fake; // NOT created via any policy — just LOOKS right when stringified
    });

    // Proof E
    run('dummy-e', 'result-e', () => {
      const boxed = new String('<b>boxed</b>'); // a REAL String object, still not TrustedHTML
      const el = document.createElement('div');
      el.innerHTML = boxed;
    });
  </script>
</body>
</html>`);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}`);
});
