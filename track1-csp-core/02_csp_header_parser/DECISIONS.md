# Module 2 — CSP Header Parser: Decisions

### Splitting on `;` for directives, then whitespace for tokens

**(b) Forced by an external contract** — the CSP spec (§ Parse a serialized
CSP) defines a policy's grammar exactly this way: directives separated by
`;`, each directive's own tokens separated by ASCII whitespace. We didn't
choose this grammar; we're implementing it.

### Directive names lowercased before use as object keys

**(b) Forced by an external contract.** The spec defines directive-name
matching as ASCII-case-insensitive. Normalizing to lowercase on the way in
means every later module can write `policy['script-src']` without also
handling `Script-Src`/`SCRIPT-SRC` — one normalization point instead of
scattering `.toLowerCase()` calls at every read site.

### First occurrence of a duplicate directive name wins; later ones are dropped silently (no error, no warning)

**(b) Forced by an external contract.** The spec is explicit here: "If
policy's directive set contains a directive whose name is a case-insensitive
match for directive's name, ignore this instance of the directive." This is
counter-intuitive enough that Module 3 will independently verify it holds in
a real browser, not just in our parser — see that module's DECISIONS.md.

### Empty directives (from `;;` or a trailing `;`) are silently skipped rather than throwing

**(c) Our own convention.** The spec's algorithm naturally produces this
result (an empty token list has no directive name to key on), but we made it
an explicit early-`continue` with a comment rather than letting it happen as
an accidental side effect — a parser that silently drops malformed input
should say so in the code, even when the spec doesn't require an error.

### A directive with no source expressions (e.g. bare `sandbox`) parses to `[]`, not `undefined` or omitted

**(c) Our own convention**, chosen so every caller can always safely call
`.includes(...)` or `.length` on a directive's value without an existence
check first. The spec doesn't mandate a particular in-memory shape — only
Module 3, which consumes this shape, cares that it's consistent.

### Returned as a plain object (`{directiveName: [...]}`), not a `Map`

**(c) Our own convention.** A `Map` would be the more "correct" choice for
string keys with no prototype-pollution risk, but a plain object lets
Module 3's code stay readable (`policy['img-src']` vs `policy.get('img-src')`)
for a data structure that, in every module in this course, is built once
and then only read.

### No validation that directive names are "real" CSP directives

**(c) Our own convention.** `parseCSP("banana-src 'self'")` happily returns
`{"banana-src": ["'self'"]}` — this parser's job is shape, not semantics.
Browsers themselves work this way too: an unrecognized directive name is
simply inert, not a parse error. Teaching that distinction (parse vs.
enforce) is part of the point of splitting Modules 2 and 3 apart.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| Split on `;` then whitespace | (b) spec | CSP grammar, not our choice |
| Lowercase directive names | (b) spec | Case-insensitive matching is spec-mandated |
| First duplicate wins, rest dropped | (b) spec | Explicit spec algorithm step |
| Empty directives skipped, with a comment | (c) convention | Make an implicit outcome explicit in the code |
| No-source directive → `[]` | (c) convention | Uniform shape for every caller |
| Plain object, not `Map` | (c) convention | Readability for a build-once/read-many structure |
| No directive-name validation | (c) convention | Mirrors real browser behavior: parsing ≠ enforcing |

## What We Proved

Ran `node test/run-tests.js` against 6 real cases and captured actual
stdout — not asserted behavior:
```
PASS  basic multi-directive parse
PASS  irregular whitespace is normalized
PASS  duplicate directive name: first occurrence wins, second is ignored
PASS  empty directives from stray/doubled semicolons are skipped
PASS  directive names are case-insensitive, normalized to lowercase
PASS  a directive with zero source expressions (e.g. sandbox with no args) parses to an empty array

6/6 tests passed
```
This gives Module 3 a trustworthy `parseCSP()` to build real enforcement on
top of — and gives us a concrete artifact to point at when Module 3 asks
"does a real browser actually follow the same duplicate-directive rule?"
