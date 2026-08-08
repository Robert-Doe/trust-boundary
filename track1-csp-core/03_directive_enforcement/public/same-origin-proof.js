// Same-origin external file — Proof E. Loading and running THIS file at all
// is the proof: "script-src 'self'" allows same-origin scripts even while
// it blocks inline scripts and cross-origin scripts.
const el = document.getElementById('same-origin-proof');
el.textContent = 'ran — this same-origin external script executed normally';
el.className = 'result allowed';
