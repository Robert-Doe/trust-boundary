document.getElementById('remote-img').addEventListener('error', () => {
  document.getElementById('img-proof').textContent = 'FAILED to load';
  document.getElementById('img-proof').className = 'result blocked';
});
document.getElementById('remote-img').addEventListener('load', () => {
  document.getElementById('img-proof').textContent = 'loaded — image displayed, ' + document.getElementById('remote-img').naturalWidth + 'x' + document.getElementById('remote-img').naturalHeight + ' px';
  document.getElementById('img-proof').className = 'result allowed';
});

// Same auto-run-on-load pattern as Module 3, for the same reason documented
// there: the result must come from genuine page script, not automation
// tooling, to be trustworthy.
function runEvalProbe() {
  const el = document.getElementById('eval-proof');
  try {
    const result = eval('1 + 1');
    el.textContent = 'eval result: ' + result;
    el.className = 'result allowed';
  } catch (e) {
    el.textContent = 'BLOCKED: ' + e.name + ': ' + e.message;
    el.className = 'result blocked';
  }
}
document.getElementById('eval-btn').addEventListener('click', runEvalProbe);
runEvalProbe();

const log = document.getElementById('violation-log');
let count = 0;
function renderViolation(v) {
  count++;
  const line = `#${count} blockedURI=${v.blockedURI}  violatedDirective=${v.violatedDirective}  effectiveDirective=${v.effectiveDirective}  disposition=${v.disposition ?? '(n/a on buffered)'}`;
  log.textContent = (count === 1 ? '' : log.textContent + '\n') + line;
}
window.__cspViolations.forEach(renderViolation);
document.addEventListener('securitypolicyviolation', (e) => renderViolation(e));
