document.getElementById('same-origin-proof').textContent = 'ran — same-origin external script executed normally';
document.getElementById('same-origin-proof').className = 'result allowed';

document.getElementById('remote-img').addEventListener('load', () => {
  document.getElementById('img-proof').textContent = 'loaded — image displayed';
  document.getElementById('img-proof').className = 'result allowed';
});
document.getElementById('remote-img').addEventListener('error', () => {
  document.getElementById('img-proof').textContent = 'FAILED to load';
  document.getElementById('img-proof').className = 'result blocked';
});

const log = document.getElementById('violation-log');
let count = 0;
function renderViolation(v) {
  count++;
  const line = `#${count} blockedURI=${v.blockedURI}  violatedDirective=${v.violatedDirective}\n     causedByPolicy="${v.originalPolicy}"`;
  log.textContent = (count === 1 ? '' : log.textContent + '\n') + line;
}
window.__cspViolations.forEach(renderViolation);
document.addEventListener('securitypolicyviolation', (e) =>
  renderViolation({ blockedURI: e.blockedURI, violatedDirective: e.violatedDirective, originalPolicy: e.originalPolicy })
);
