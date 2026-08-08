// Module 24 — Real-World Sanitizer Capstone
//
// A real, unmodified DOMPurify 3.4.13 (vendored, see DECISIONS.md), backing
// a real Trusted Types policy, tested against a corpus of real XSS payload
// shapes AND real legitimate rich-text content — the shippable pattern
// every prior Track 2 module has been building toward.

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = 8300;
const dompurifyJS = fs.readFileSync(path.join(__dirname, 'public', 'dompurify.min.js'), 'utf8');

http.createServer((req, res) => {
  if (req.url === '/dompurify.min.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    return res.end(dompurifyJS);
  }

  const nonce = crypto.randomBytes(8).toString('base64');
  // NOTE: 'dompurify' (no suffix) must ALSO be allowlisted — DOMPurify
  // auto-detects Trusted Types support and tries to create its OWN
  // internal policy literally named "dompurify" for its internal DOM
  // operations, separate from the "dompurify-policy" we create ourselves
  // below. Discovered empirically — see DECISIONS.md.
  const policy = `script-src 'self' 'nonce-${nonce}'; require-trusted-types-for 'script'; trusted-types dompurify dompurify-policy`;
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': policy,
  });
  res.end(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Module 24 — Real-World Sanitizer Capstone</title>
<script src="/dompurify.min.js"></script>
<style>
  body { font-family: system-ui, sans-serif; background: #0d1117; color: #c9d1d9; max-width: 800px; margin: 3rem auto; padding: 0 1rem; }
  h1 { color: #fff; }
  .proof { border: 1px solid #30363d; border-radius: 8px; padding: 1rem; margin: 1rem 0; background: #161b22; }
  .proof b { color: #7ee787; }
  .result { font-family: monospace; font-size: 0.82rem; white-space: pre-wrap; }
  .rendered { border: 1px dashed #30363d; border-radius: 6px; padding: 0.75rem; margin-top: 0.5rem; background: #0d1117; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  th, td { border: 1px solid #30363d; padding: 0.4rem 0.6rem; text-align: left; vertical-align: top; }
  th { background: #161b22; }
  .safe { color: #3fb950; } .danger { color: #f85149; }
</style>
</head>
<body>
  <h1>Module 24 — Real-World Sanitizer Capstone</h1>
  <p>Policy: <code>${policy}</code></p>
  <p>DOMPurify version in use: <code id="dp-version"></code> (vendored, real, unmodified library)</p>

  <div class="proof">
    <b>Corpus results — real payload shapes, run through the DOMPurify-backed policy</b>
    <div id="corpus-results"></div>
  </div>

  <div class="proof">
    <b>Did ANY payload actually execute? (global marker, checked after all payloads processed)</b>
    <p id="marker-result" class="result">(pending)</p>
  </div>

  <div class="proof">
    <b>Legitimate rich text — does real formatting survive?</b>
    <div id="legit-target" class="rendered"></div>
    <p id="legit-result" class="result">(pending)</p>
  </div>

  <script nonce="${nonce}">
    document.getElementById('dp-version').textContent = DOMPurify.version;

    window.__xssFired = false;
    window.__markXSS = () => { window.__xssFired = true; };

    const policy = trustedTypes.createPolicy('dompurify-policy', {
      createHTML: (input) => DOMPurify.sanitize(input, { RETURN_TRUSTED_TYPE: false }),
    });

    const corpus = [
      { label: 'script tag', payload: '<script>window.__markXSS()<\\/script>' },
      { label: 'img onerror', payload: '<img src="x" onerror="window.__markXSS()">' },
      { label: 'svg onload', payload: '<svg onload="window.__markXSS()"></svg>' },
      { label: 'anchor javascript: URL', payload: '<a href="javascript:window.__markXSS()">click me</a>' },
      { label: 'iframe javascript: URL', payload: '<iframe src="javascript:window.__markXSS()"></iframe>' },
      { label: 'body onload (fragment)', payload: '<body onload="window.__markXSS()">text</body>' },
      { label: 'CSS javascript: URL', payload: '<div style="background:url(javascript:window.__markXSS())">styled</div>' },
      { label: 'encoded script re-injection', payload: '"><script>window.__markXSS()<\\/script>' },
    ];

    // Every payload is processed inside its OWN try/catch — a single
    // failure must not abort the rest of the corpus or the proofs after
    // it, same defensive pattern every module since 15 has used.
    const rows = corpus.map(({ label, payload }) => {
      try {
        const trusted = policy.createHTML(payload);
        const container = document.createElement('div');
        container.innerHTML = trusted; // guaranteed accepted — it's a real TrustedHTML
        return { label, original: payload, sanitized: String(trusted), error: null };
      } catch (e) {
        return { label, original: payload, sanitized: '', error: e.constructor.name + ': ' + e.message };
      }
    });

    // Built via safe DOM APIs (createElement/textContent), NOT innerHTML —
    // this table's own markup is OUR trusted UI chrome, never untrusted
    // data, so it doesn't need to go through the sanitizing policy at all.
    // But require-trusted-types-for 'script' guards innerHTML UNIVERSALLY,
    // for every element, including our own — a raw-string innerHTML
    // assignment here would throw exactly like Module 15's Proof B, which
    // is the real mistake our first draft of this module made. See
    // DECISIONS.md.
    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    ['Payload', 'Original', 'After DOMPurify'].forEach((text) => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      const tdLabel = document.createElement('td'); tdLabel.textContent = r.label;
      const tdOriginal = document.createElement('td');
      const codeOriginal = document.createElement('code'); codeOriginal.textContent = r.original; tdOriginal.appendChild(codeOriginal);
      const tdSanitized = document.createElement('td');
      const codeSanitized = document.createElement('code');
      codeSanitized.textContent = r.error ? 'ERROR: ' + r.error : (r.sanitized || '(empty)');
      tdSanitized.appendChild(codeSanitized);
      tr.appendChild(tdLabel); tr.appendChild(tdOriginal); tr.appendChild(tdSanitized);
      table.appendChild(tr);
    });
    document.getElementById('corpus-results').appendChild(table);

    setTimeout(() => {
      document.getElementById('marker-result').textContent =
        'window.__xssFired: ' + window.__xssFired + (window.__xssFired ? ' — A PAYLOAD EXECUTED (failure)' : ' — none executed (success)');
      document.getElementById('marker-result').className = 'result ' + (window.__xssFired ? 'danger' : 'safe');
    }, 300);

    // Legitimate content
    try {
      const legit = '<p>This is <b>bold</b>, <i>italic</i>, and a <a href="https://example.com">real link</a>.</p><ul><li>Item one</li><li>Item two</li></ul>';
      const legitTrusted = policy.createHTML(legit);
      document.getElementById('legit-target').innerHTML = legitTrusted;
      document.getElementById('legit-result').textContent =
        'Sanitized output === original (formatting fully preserved): ' + (String(legitTrusted) === legit);
    } catch (e) {
      document.getElementById('legit-result').textContent = 'ERROR: ' + e.constructor.name + ': ' + e.message;
    }
  </script>
</body>
</html>`);
}).listen(PORT, () => {
  console.log(`[main] http://localhost:${PORT}`);
});
