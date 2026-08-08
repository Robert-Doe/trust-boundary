// Module 2 test runner. Plain Node `assert`, no test framework dependency —
// run with: node test/run-tests.js
const assert = require('assert');
const { parseCSP } = require('../src/csp-parser');

let passed = 0;
function check(label, actual, expected) {
  assert.deepStrictEqual(actual, expected);
  passed++;
  console.log(`PASS  ${label}`);
}

check(
  'basic multi-directive parse',
  parseCSP("default-src 'self'; script-src 'self' https://cdn.example.com"),
  { 'default-src': ["'self'"], 'script-src': ["'self'", 'https://cdn.example.com'] }
);

check(
  'irregular whitespace is normalized',
  parseCSP("  default-src   'self'  ;   img-src  *  "),
  { 'default-src': ["'self'"], 'img-src': ['*'] }
);

check(
  'duplicate directive name: first occurrence wins, second is ignored',
  parseCSP("script-src 'self'; script-src *"),
  { 'script-src': ["'self'"] }
);

check(
  'empty directives from stray/doubled semicolons are skipped',
  parseCSP("default-src 'self';; img-src *;"),
  { 'default-src': ["'self'"], 'img-src': ['*'] }
);

check(
  'directive names are case-insensitive, normalized to lowercase',
  parseCSP("Script-Src 'self'"),
  { 'script-src': ["'self'"] }
);

check(
  'a directive with zero source expressions (e.g. sandbox with no args) parses to an empty array',
  parseCSP('sandbox'),
  { sandbox: [] }
);

console.log(`\n${passed}/${passed} tests passed`);
