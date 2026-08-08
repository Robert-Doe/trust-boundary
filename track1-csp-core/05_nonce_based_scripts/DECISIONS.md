# Module 5 — Nonce-Based Scripts: Decisions

### The nonce is generated with `crypto.randomBytes(16)`, not `Math.random()`

**(b) Forced by an external contract** — sort of, and worth being precise
about. The CSP spec doesn't mandate a specific RNG, but it does require the
nonce to be unpredictable, and the entire security value of a nonce (Proof D
in this module) depends on an attacker not being able to guess or predict
it. `Math.random()` is not cryptographically secure and has been
successfully predicted from observed output in real research; using
`crypto.randomBytes` is the only responsible choice once you understand what
the nonce is actually defending — so we're treating this as (b), forced by
the *security contract* the feature implies, even though nothing would stop
you from writing insecure code that still technically satisfies the spec's
letter.

### A fresh nonce is generated per request, inside the request handler — not once at server startup

**(b) Forced by an external contract.** A nonce reused across responses
stops being a nonce in any meaningful sense — if an attacker can observe one
legitimate response (trivial: just requesting the page themselves), a
server-wide constant nonce would let them nonce-stamp their own injected
script too. Proof D exists specifically to verify this empirically rather
than trust our own claim about it.

### The HTML is a template with a `{{NONCE}}` placeholder, filled in with `String.replaceAll`, not a templating library

**(c) Our own convention.** A real app would use whatever templating system
it already has; we used the simplest possible substitution because
introducing a templating dependency would be teaching that library, not CSP.

### Proof B (no nonce) and Proof C (wrong nonce) are two separate proofs, not one

**(c) Our own convention.** They test two different failure modes that are
easy to conflate: "nonce attribute absent" vs. "nonce attribute present but
wrong." Verified separately, both blocked identically — see Run It — which
also rules out the case where the browser might treat "has *a* nonce
attribute at all" as sufficient without checking its value. It doesn't; it
checks the value.

### The violation log's `sample` field came back empty (`""`) even though we requested it

**(a) Forced by the platform — discovered empirically, not assumed.** We
initially expected `event.sample` to show a snippet of the blocked inline
script's source. Running it for real showed empty strings for both blocked
proofs. The reason: browsers only populate `sample` when the policy
explicitly includes the `'report-sample'` keyword in the relevant directive
— ours doesn't, so the browser correctly declines to include potentially
sensitive inline script content in every violation report by default. We
kept the field in our log (rather than removing it) specifically so this
empty-string result is visible and explained, instead of quietly dropped.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| `crypto.randomBytes`, not `Math.random` | (b) security contract | Predictable nonces have no security value |
| Nonce generated fresh per-request | (b) spec/security contract | A reused nonce isn't a nonce |
| Plain string template, no templating lib | (c) convention | Avoid teaching an unrelated library |
| Proof B and C kept separate | (c) convention | "absent" and "wrong" are different failure modes worth distinguishing |
| Empty `sample` field kept visible, not hidden | (c) convention | Documents a real platform default (`'report-sample'` required) instead of hiding it |

## What We Proved

Real server, real per-request nonce, real browser enforcement:
```
Proof A — correct nonce:  ALLOWED  ("ran — this script had the correct nonce")
Proof B — no nonce:       BLOCKED  ("(has not run yet)" — never executed)
Proof C — wrong nonce:    BLOCKED  ("(has not run yet)" — never executed)
Proof D — uniqueness:     DIFFERENT nonces confirmed across two concurrent
                           fetches of the same URL (real values captured,
                           e.g. JiRrzhn3O/9znA87Ri0GMw== vs SaaLrn8Il7zobloHMGrFEQ==)
```
Violation log — both real blocks captured, `sample` empty because
`'report-sample'` wasn't declared:
```
#1 blockedURI=inline  violatedDirective=script-src-elem  sample=""
#2 blockedURI=inline  violatedDirective=script-src-elem  sample=""
```
Together these prove nonce-based allowlisting does exactly what
`'unsafe-inline'` cannot: let one specific inline script run while blocking
every other inline script, including a maliciously-guessed or copy-pasted
nonce value, with the allowlist itself changing on every single response.
