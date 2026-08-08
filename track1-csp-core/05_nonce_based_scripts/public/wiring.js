// Render whatever violations Proof A's inline script (which runs first and
// sets up the listener/buffer) already caught.
const log = document.getElementById('violation-log');
let count = 0;
function renderViolation(v) {
  count++;
  const line = `#${count} blockedURI=${v.blockedURI}  violatedDirective=${v.violatedDirective}  sample="${v.sample}"`;
  log.textContent = (count === 1 ? '' : log.textContent + '\n') + line;
}
window.__cspViolations.forEach(renderViolation);
document.addEventListener('securitypolicyviolation', (e) =>
  renderViolation({ blockedURI: e.blockedURI, violatedDirective: e.violatedDirective, sample: (e.sample || '').slice(0, 40) })
);

// Proof D: fetch this exact page twice and compare the nonce each response
// carries in its own Content-Security-Policy header. Two GETs, two
// independent server-side crypto.randomBytes() calls.
async function checkNonceUniqueness() {
  const el = document.getElementById('uniqueness-proof');
  const extractNonce = (headerValue) => {
    const match = /'nonce-([^']+)'/.exec(headerValue || '');
    return match ? match[1] : null;
  };

  const [r1, r2] = await Promise.all([fetch('/'), fetch('/')]);
  const n1 = extractNonce(r1.headers.get('content-security-policy'));
  const n2 = extractNonce(r2.headers.get('content-security-policy'));

  if (!n1 || !n2) {
    el.textContent = 'could not read nonce from either response';
    el.className = 'result blocked';
    return;
  }
  if (n1 === n2) {
    el.textContent = `SAME nonce both times: ${n1} (would be a real bug — nonces must not repeat)`;
    el.className = 'result blocked';
  } else {
    el.textContent = `DIFFERENT nonces confirmed — request 1: ${n1}  |  request 2: ${n2}`;
    el.className = 'result allowed';
  }
}
checkNonceUniqueness();
