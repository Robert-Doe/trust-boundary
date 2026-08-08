// Same-origin external file — allowed to load and run under
// "script-src 'self'". Its job: wire the eval button, AND listen for real
// CSP violation events so the page can show them live.

document.getElementById('remote-img').addEventListener('error', () => {
  document.getElementById('img-proof').textContent = 'FAILED to load (blocked)';
  document.getElementById('img-proof').className = 'result blocked';
});
document.getElementById('remote-img').addEventListener('load', () => {
  document.getElementById('img-proof').textContent = 'loaded (should NOT happen under this policy)';
  document.getElementById('img-proof').className = 'result allowed';
});

// The button is here for you to click by hand — but the proof this module
// documents does NOT depend on a click arriving: runEvalProbe() below runs
// automatically as soon as this file loads, as ordinary page script. That
// matters because eval run through devtools/automation tooling is exempt
// from a page's own script-src restriction (browsers treat devtools-console
// and CDP-injected evaluation as trusted operator input, not page script) —
// so the only trustworthy way to prove eval is really blocked is to have
// the PAGE's OWN script call it during normal execution, no external
// trigger involved.
function runEvalProbe() {
  const el = document.getElementById('eval-proof');
  try {
    const result = eval('1 + 1');
    el.textContent = 'eval result: ' + result + ' (should NOT happen under this policy)';
    el.className = 'result allowed';
  } catch (e) {
    el.textContent = 'BLOCKED: ' + e.name + ': ' + e.message;
    el.className = 'result blocked';
  }
}
document.getElementById('eval-btn').addEventListener('click', runEvalProbe);
runEvalProbe(); // auto-run once on load — this is the run the tutorial documents

// Render whatever violation-listener.js already buffered (it ran before
// this file, before any of Proofs A/B/C's violations fired), then keep
// rendering live as new ones come in (e.g. Proof D's eval violation, which
// only fires later when the button is clicked).
const log = document.getElementById('violation-log');
let count = 0;
function renderViolation(v) {
  count++;
  const line = `#${count} blockedURI=${v.blockedURI}  violatedDirective=${v.violatedDirective}  effectiveDirective=${v.effectiveDirective}`;
  log.textContent = (count === 1 ? '' : log.textContent + '\n') + line;
}
window.__cspViolations.forEach(renderViolation);
document.addEventListener('securitypolicyviolation', (e) => renderViolation(e));
