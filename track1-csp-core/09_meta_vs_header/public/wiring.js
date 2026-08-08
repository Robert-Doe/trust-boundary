const log = document.getElementById('violation-log');
let count = 0;
function renderViolation(v) {
  count++;
  log.textContent = (count === 1 ? '' : log.textContent + '\n') + `#${count} blockedURI=${v.blockedURI}  violatedDirective=${v.violatedDirective}`;
}
window.__cspViolations.forEach(renderViolation);
document.addEventListener('securitypolicyviolation', (e) =>
  renderViolation({ blockedURI: e.blockedURI, violatedDirective: e.violatedDirective })
);
