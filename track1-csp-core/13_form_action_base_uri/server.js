// Module 13 — form-action + base-uri Lockdown
//
// Two independent proofs, four victim routes:
//   /form-open, /form-protected   — does a real <form> auto-submit to a
//                                    different origin, or does form-action
//                                    'self' stop it?
//   /base-open, /base-protected   — does an injected <base href="..."> tag
//                                    hijack a later relative <img src>, or
//                                    does base-uri 'self' stop it?

const http = require('http');
const fs = require('fs');
const path = require('path');

const VICTIM_PORT = 6900;
const ATTACK_PORT = 6901;

const pixel = fs.readFileSync(path.join(__dirname, 'attacker-pixel.png'));

function formPage(protectedRoute) {
  const csp = protectedRoute ? "form-action 'self'" : null;
  return { csp, html: `<!doctype html><html><head><meta charset="utf-8"><title>${protectedRoute ? 'form-protected' : 'form-open'}</title>
  <style>body{font-family:system-ui;background:#0d1117;color:#c9d1d9;max-width:640px;margin:3rem auto;padding:0 1rem}
  .result{font-family:monospace}.blocked{color:#f85149}.allowed{color:#3fb950}</style>
  </head><body>
  <h1>${protectedRoute ? '/form-protected' : '/form-open'}</h1>
  <p>CSP: <code>${csp || '(none)'}</code></p>
  <form id="xfer-form" action="http://localhost:${ATTACK_PORT}/receive" method="GET">
    <input type="hidden" name="amount" value="1000">
  </form>
  <p id="status" class="result">(submitting...)</p>
  <script>
    document.addEventListener('securitypolicyviolation', (e) => {
      if (e.violatedDirective.includes('form-action')) {
        document.getElementById('status').textContent = 'BLOCKED: ' + e.violatedDirective;
        document.getElementById('status').className = 'result blocked';
      }
    });
    document.getElementById('xfer-form').requestSubmit();
  </script>
  </body></html>` };
}

function basePage(protectedRoute) {
  const csp = protectedRoute ? "base-uri 'self'" : null;
  return { csp, html: `<!doctype html><html><head><meta charset="utf-8"><title>${protectedRoute ? 'base-protected' : 'base-open'}</title>
  <!-- Simulates an attacker-injected <base> tag redefining ALL relative URLs on this page -->
  <base href="http://localhost:${ATTACK_PORT}/">
  <style>body{font-family:system-ui;background:#0d1117;color:#c9d1d9;max-width:640px;margin:3rem auto;padding:0 1rem}
  .result{font-family:monospace}</style>
  </head><body>
  <h1>${protectedRoute ? '/base-protected' : '/base-open'}</h1>
  <p>CSP: <code>${csp || '(none)'}</code></p>
  <p>Injected: <code>&lt;base href="http://localhost:${ATTACK_PORT}/"&gt;</code></p>
  <p>Now loading a RELATIVE image, <code>pixel.png</code> — check the network
     tab / console to see which origin actually received the request.</p>
  <img id="px" src="pixel.png" width="64" height="64">
  <p id="status" class="result">resolved href: <span id="resolved"></span></p>
  <script>
    // document.baseURI reflects whatever base is ACTUALLY in effect after
    // the browser resolves/ignores the <base> tag per this response's CSP.
    document.getElementById('resolved').textContent = document.baseURI;
  </script>
  </body></html>` };
}

http.createServer((req, res) => {
  let route;
  if (req.url === '/form-open') route = formPage(false);
  else if (req.url === '/form-protected') route = formPage(true);
  else if (req.url === '/base-open') route = basePage(false);
  else if (req.url === '/base-protected') route = basePage(true);
  else if (req.url === '/pixel.png') {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    return res.end(pixel);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<!doctype html><body style="font-family:system-ui;background:#0d1117;color:#c9d1d9">
      <h1>Module 13</h1>
      <p><a href="/form-open" style="color:#ff7b72">/form-open</a> · <a href="/form-protected" style="color:#3fb950">/form-protected</a></p>
      <p><a href="/base-open" style="color:#ff7b72">/base-open</a> · <a href="/base-protected" style="color:#3fb950">/base-protected</a></p>
      </body>`);
  }

  const headers = { 'Content-Type': 'text/html; charset=utf-8' };
  if (route.csp) headers['Content-Security-Policy'] = route.csp;
  res.writeHead(200, headers);
  res.end(route.html);
}).listen(VICTIM_PORT, () => {
  console.log(`[victim]   http://localhost:${VICTIM_PORT}`);
});

http.createServer((req, res) => {
  if (req.url === '/pixel.png') {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    return res.end(pixel);
  }
  console.log(`[attacker] received request: ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><body style="font-family:system-ui;background:#3a0d0d;color:#fff">
    <h1>Attacker received your submission</h1>
    <p>Query string: <code>${req.url}</code></p>
    </body>`);
}).listen(ATTACK_PORT, () => {
  console.log(`[attacker] http://localhost:${ATTACK_PORT}`);
});
