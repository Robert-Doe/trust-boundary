# Module 6 — Hash-Based Scripts: Decisions

### The violation listener moved to its own external file, `violation-listener.js` — not folded into Proof A's script tag

**(b) Forced by an external contract**, and it's a sharper version of a rule
from Module 3/4: a hash source allowlists a `<script>` element by the hash of
its **entire** text content. Our first draft put the listener setup and
`ALLOWED_SCRIPT`'s logic in the same `<script>` tag; that inline element's
real content was therefore `<listener code> + ALLOWED_SCRIPT`, which does
**not** hash to the same value as `ALLOWED_SCRIPT` alone. We caught this
before ever running it, by re-reading what actually sits inside the tag —
worth stating plainly: **a hash source is not "contains the right code
somewhere," it's "the element's content is these exact bytes."** Fixing it
meant moving anything that isn't part of the hashed payload to an external,
`'self'`-allowed file instead.

### `ALLOWED_SCRIPT` is a single JS string constant in `server.js`, injected into the template rather than typed twice (once to hash, once to render)

**(c) Our own convention**, and load-bearing for correctness, not just
tidiness: hashing one string and then separately hand-typing "the same
thing" into the HTML template is exactly how real deployments produce
mismatched hashes — a single stray space added by an editor's
"trim trailing whitespace" setting in one copy and not the other breaks it
silently. Injecting the identical in-memory string via `{{ALLOWED_SCRIPT}}`
makes a mismatch structurally impossible here.

### Proof B's near-miss script is deliberately never run through the server's hashing step

**(c) Our own convention**, chosen so Proof B tests something real: an
inline script whose content was authored independently and simply never
matches any allowlisted hash — the common real-world case (a template change
that nobody re-hashed) rather than a contrived string-mutation exercise.

### Hash algorithm is SHA-256, written as `'sha256-...'`

**(b) Forced by an external contract.** The CSP spec defines exactly three
supported hash algorithms for this source-expression form: `sha256`,
`sha384`, `sha512`. We didn't have a reason to pick a stronger/slower one
over the weakest allowed option — SHA-256 is already collision-resistant far
beyond what this use case needs, and it's what most real-world CSP
generators default to.

### Proof C fetches the page twice to confirm the hash is identical, mirroring Module 5's Proof D structure exactly

**(c) Our own convention**, chosen specifically so the two modules read as a
matched pair: same test shape, opposite expected result (nonce: different
every time; hash: same every time), which is the clearest way to make the
underlying difference — secret-per-response vs. content-derived — visible
without just asserting it in prose.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| Violation listener in its own external file | (b) spec | Hash covers the WHOLE element's content, discovered before running |
| `ALLOWED_SCRIPT` injected as one shared string | (c) convention | Makes a hash mismatch from hand-duplication structurally impossible |
| Proof B never hashed | (c) convention | Tests the realistic "content changed, hash didn't" failure mode |
| SHA-256 specifically | (b) spec | One of exactly three algorithms CSP supports for this source form |
| Proof C mirrors Module 5's Proof D shape | (c) convention | Same test structure, opposite result, makes the contrast legible |

## What We Proved

Real server, real content hash, real browser enforcement:
```
Proof A — exact-content script:  ALLOWED  ("ran — this exact byte content
                                   was hashed and allowlisted")
Proof B — one-space-different:   BLOCKED  ("(has not run yet)" — never executed)
Proof C — determinism:            SAME hash both times:
                                   LFyfbULqKlvrys9c6HmEDiSiYGHye8Gsd44zW39iVgQ=
```
Violation log — the one real block, captured:
```
#1 blockedURI=inline  violatedDirective=script-src-elem
```
This proves the defining trade-off against Module 5's nonce: a hash needs no
server-side secret or per-request state, but it is brittle to any edit —
which is exactly why hashes suit static, unchanging inline scripts (a fixed
analytics snippet, a fixed inline bootstrap), while nonces suit inline
content that's templated fresh on every response.
