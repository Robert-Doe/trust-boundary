// Module 2 — CSP Header Parser
//
// Turns a raw Content-Security-Policy header VALUE (the string after the
// "Content-Security-Policy:" header name) into a plain object mapping
// directive name -> array of source-expression strings.
//
// Parsing rules implemented here are taken directly from the CSP spec
// (an external contract, not our choice) — see DECISIONS.md for citations
// on each one:
//   1. Directives are split on ';'.
//   2. Each directive is split on ASCII whitespace; token 0 is the name,
//      the rest are source expressions.
//   3. Directive names are matched case-insensitively and normalized to
//      lowercase.
//   4. Empty directives (from stray/doubled ';' or trailing ';') are skipped.
//   5. If the same directive name appears more than once in one policy,
//      every occurrence after the first is IGNORED — the first wins.

function parseCSP(headerValue) {
  const policy = {};

  const rawDirectives = String(headerValue).split(';');

  for (const raw of rawDirectives) {
    const trimmed = raw.trim();
    if (trimmed === '') continue; // rule 4

    const tokens = trimmed.split(/\s+/); // rule 2
    const name = tokens[0].toLowerCase(); // rule 3
    const sources = tokens.slice(1);

    if (Object.prototype.hasOwnProperty.call(policy, name)) continue; // rule 5

    policy[name] = sources;
  }

  return policy;
}

module.exports = { parseCSP };
