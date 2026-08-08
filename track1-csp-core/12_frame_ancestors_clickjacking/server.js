// Module 12 — frame-ancestors Clickjacking Defense
//
// VICTIM_PORT (6700) serves the same "sensitive action" page twice:
//   /open      — no CSP at all, framable by anyone
//   /protected — frame-ancestors 'none', should refuse to render when framed
// ATTACKER_PORT (6800) serves a page that iframes BOTH victim routes side
// by side, so the difference is directly comparable in one screenshot/DOM.

const http = require('http');

const VICTIM_PORT = 6700;
const ATTACKER_PORT = 6800;

function victimPage(label) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${label}</title>
  <style>body{font-family:system-ui;background:#fff;color:#111;margin:0;padding:1.5rem}
  button{background:#d32f2f;color:#fff;border:none;padding:0.75rem 1.5rem;font-size:1rem;border-radius:6px;font-weight:bold}</style>
  </head><body>
  <h2>Your Bank — Account Actions</h2>
  <p>Route: <code>${label}</code></p>
  <button>Transfer $1000 to Savings</button>
  </body></html>`;
}

http.createServer((req, res) => {
  if (req.url === '/open') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(victimPage('/open (no CSP)'));
  }
  if (req.url === '/protected') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "frame-ancestors 'none'",
    });
    return res.end(victimPage('/protected (frame-ancestors: none)'));
  }
  res.writeHead(404);
  res.end('404');
}).listen(VICTIM_PORT, () => {
  console.log(`[victim]   http://localhost:${VICTIM_PORT}/open and /protected`);
});

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><html><head><meta charset="utf-8"><title>Attacker Page</title>
  <style>body{font-family:system-ui;background:#0d1117;color:#c9d1d9;margin:2rem}
  .frame-box{border:2px solid #30363d;border-radius:8px;padding:0.5rem;margin-bottom:1.5rem}
  .frame-box h3{margin-top:0;font-family:monospace}
  iframe{width:100%;height:180px;border:1px dashed #666}
  .status{font-family:monospace;font-size:0.85rem;margin-top:0.5rem}
  </style></head><body>
  <h1>Attacker Page (http://localhost:${ATTACKER_PORT})</h1>
  <p>Both boxes below try to iframe a DIFFERENT origin's page (http://localhost:${VICTIM_PORT}).</p>

  <div class="frame-box">
    <h3>Framing /open (no CSP)</h3>
    <iframe id="frame-open" src="http://localhost:${VICTIM_PORT}/open"></iframe>
    <p id="status-open" class="status">(loading...)</p>
  </div>

  <div class="frame-box">
    <h3>Framing /protected (frame-ancestors: 'none')</h3>
    <iframe id="frame-protected" src="http://localhost:${VICTIM_PORT}/protected"></iframe>
    <p id="status-protected" class="status">(loading...)</p>
  </div>

  <script>
    function wire(id, statusId) {
      const frame = document.getElementById(id);
      const status = document.getElementById(statusId);
      frame.addEventListener('load', () => {
        // Cross-origin, so we can't read contentDocument directly (SOP) —
        // but a frame that was blocked by frame-ancestors renders as a
        // blank/empty document, while a successfully framed page renders
        // its real content. We can't inspect it via JS across origins,
        // but the 'load' event firing itself is not proof of success —
        // browsers fire 'load' even for a blocked/empty frame in some
        // cases. This status line reports what our OWN script can verify;
        // the real proof for this module comes from the browser's console
        // message and the visual/DOM difference documented in DECISIONS.md.
        status.textContent = "'load' event fired (see this module's DECISIONS.md for what this does and doesn't prove)";
      });
    }
    wire('frame-open', 'status-open');
    wire('frame-protected', 'status-protected');
  </script>
  </body></html>`);
}).listen(ATTACKER_PORT, () => {
  console.log(`[attacker] http://localhost:${ATTACKER_PORT}`);
});
