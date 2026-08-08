// Loaded FIRST, before any other <script> or proof markup in <body>, so it
// can catch violations that fire while the rest of the document is still
// being parsed (Proofs A, B, C all violate before wiring.js would ever get
// a chance to run). Events are buffered on window.__cspViolations; wiring.js
// drains the buffer once the page's DOM (and the log element) exists.
window.__cspViolations = [];
document.addEventListener('securitypolicyviolation', (e) => {
  window.__cspViolations.push({
    blockedURI: e.blockedURI,
    violatedDirective: e.violatedDirective,
    effectiveDirective: e.effectiveDirective,
    disposition: e.disposition, // "enforce" or "report" — this module's key new field
  });
});
