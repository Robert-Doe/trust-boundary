const log = document.getElementById('violation-log');
let count = 0;
function renderViolation(v) {
  count++;
  const line = `#${count} blockedURI=${v.blockedURI}  violatedDirective=${v.violatedDirective}`;
  log.textContent = (count === 1 ? '' : log.textContent + '\n') + line;
}
window.__cspViolations.forEach(renderViolation);
document.addEventListener('securitypolicyviolation', (e) =>
  renderViolation({ blockedURI: e.blockedURI, violatedDirective: e.violatedDirective })
);
