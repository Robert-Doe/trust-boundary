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

// Proof C: fetch this same URL twice, extract the sha256 hash source from
// each response's CSP header, and confirm they're IDENTICAL — the direct
// contrast to Module 5's nonce, which was different every time.
async function checkHashDeterminism() {
  const el = document.getElementById('determinism-proof');
  const extractHash = (headerValue) => {
    const match = /'sha256-([^']+)'/.exec(headerValue || '');
    return match ? match[1] : null;
  };
  const [r1, r2] = await Promise.all([fetch('/'), fetch('/')]);
  const h1 = extractHash(r1.headers.get('content-security-policy'));
  const h2 = extractHash(r2.headers.get('content-security-policy'));

  if (!h1 || !h2) {
    el.textContent = 'could not read hash from either response';
    el.className = 'result blocked';
    return;
  }
  if (h1 === h2) {
    el.textContent = `SAME hash both times: ${h1} (expected — content didn't change)`;
    el.className = 'result allowed';
  } else {
    el.textContent = `DIFFERENT hashes: ${h1} vs ${h2} (unexpected — would mean content changed between requests)`;
    el.className = 'result blocked';
  }
}
checkHashDeterminism();
