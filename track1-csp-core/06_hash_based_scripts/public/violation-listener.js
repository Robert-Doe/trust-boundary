// Loaded first, before any proof markup — see Module 3/4's DECISIONS.md for
// why early registration matters (violations fire during initial parse).
window.__cspViolations = [];
document.addEventListener('securitypolicyviolation', (e) => {
  window.__cspViolations.push({ blockedURI: e.blockedURI, violatedDirective: e.violatedDirective });
});
