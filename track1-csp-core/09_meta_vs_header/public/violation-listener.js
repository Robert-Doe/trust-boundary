window.__cspViolations = [];
document.addEventListener('securitypolicyviolation', (e) => {
  window.__cspViolations.push({ blockedURI: e.blockedURI, violatedDirective: e.violatedDirective });
});
