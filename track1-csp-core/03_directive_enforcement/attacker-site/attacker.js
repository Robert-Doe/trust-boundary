// Served from http://localhost:5400 — cross-origin relative to the page at
// http://localhost:5300. Under this module's policy (script-src 'self'),
// the browser should refuse to even fetch/execute this file. If you ever
// see this text on the page, the policy failed to block it.
document.getElementById('remote-script-proof').textContent =
  'ran (should NOT happen under this policy)';
document.getElementById('remote-script-proof').className = 'result allowed';
