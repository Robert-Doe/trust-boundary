// Served from http://localhost:5200 — a DIFFERENT origin than the page
// that loads it (http://localhost:5100). This file is loaded via a plain
// <script src="http://localhost:5200/attacker.js"> tag with no CSP in
// effect, so the browser fetches it and executes it inside the port-5100
// page's own document — it can touch that page's DOM directly.
document.getElementById('remote-script-proof').textContent =
  'ran — this text was set by a script fetched from http://localhost:5200';
