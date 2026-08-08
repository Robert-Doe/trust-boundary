# Module 22 — Brand Check via instanceof: Decisions

### Proof B forges via `Object.create(TrustedHTML.prototype)` — the EXACT construction from prerequisites/04_js_prototype_chain.html, not a new example

**(c) Our own convention**, and deliberately so: the prerequisites page
ended with a warning that this specific construction is exactly the kind
of thing that would need to be tested against a real sink, not just
against `instanceof`. This module is that promised test, using the
identical construction, not a fresh one — closing the loop the
prerequisites page opened.

### We tested the sink's real behavior rather than trusting `instanceof`'s answer

**(a) Forced by the platform — the central empirical result of this
module.** `forged instanceof TrustedHTML` really does return `true` — the
prototype-chain mechanics from the prerequisites page are exactly as
spoofable as advertised. But handing `forged` to `innerHTML` throws a
DIFFERENT error than every prior rejection in this course:
`TypeError: Failed to set the 'innerHTML' property on 'Element': Illegal
invocation` — not "This document requires 'TrustedHTML' assignment." A
different error message for a different code path is real, direct evidence
that the sink's actual check is NOT `instanceof TrustedHTML`. If it were,
the forged object — which genuinely passes that check — would have been
accepted.

### Proof C copies every own property from a real `TrustedHTML` onto the forgery, and finds there's nothing to copy

**(a) Forced by the platform — an unplanned, informative result.** We
expected `Object.getOwnPropertyNames(real)` to return at least something
(commonly, TrustedTypes wrapper implementations expose an internal string
via *some* enumerable property). It returned `[]` — a real
`TrustedHTML` value has zero own enumerable properties. This tells you
something concrete about the mechanism: the actual wrapped string data
isn't stored as an ordinary, copyable JS property at all — it lives in an
internal slot, invisible to `Object.getOwnPropertyNames`,
`Object.keys`, `JSON.stringify`, spread syntax, or any other ordinary
JS property-enumeration mechanism. There is nothing for a forgery to copy,
which is a stronger and more specific claim than "the forgery failed."

### Proof D tests whether the forged-object rejection fires a `securitypolicyviolation` event, reusing Module 21's exact pattern

**(a) Forced by the platform — verified, and the answer differs from
Module 21.** It does NOT fire — `window.__lastViolation` stayed `null`.
Module 21's rejections (missing policy, disallowed policy name) are real
CSP-directive violations and get reported through that pipeline. This
forgery's rejection is a different KIND of failure — an "Illegal
invocation" `TypeError`, the standard error browsers throw when a native
method/property setter is invoked on an object that lacks the internal
state ("brand") it requires — much closer to calling `Array.prototype.push`
on a plain object than to a policy violation. It's an ordinary JS type
error, not a security-reportable event, and we verified that distinction
directly rather than assuming reporting behavior is uniform.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| Reused the EXACT forgery from prerequisites/04 | (c) convention | Closes the loop that page explicitly opened |
| Tested the real sink, not just `instanceof` | (a) platform, empirical | `instanceof` alone would have given a false "it works" signal |
| Copied real value's own properties, found none | (a) platform, empirical | Concretely shows the wrapped data lives in an internal slot, not a JS property |
| Tested whether forgery rejection fires a violation event | (a) platform, empirical | Different failure category than Module 21's — verified, not assumed |

## What We Proved

Real forgery, real sink, real distinguishing evidence:
```
Proof A (real value):     instanceof TrustedHTML: true
                            Object.getPrototypeOf === TrustedHTML.prototype: true
                            sink accepted it: true

Proof B (forged via        forged instanceof TrustedHTML: true  ← spoofed successfully!
  Object.create):          sink result: REJECTED: TypeError: ... Illegal invocation
                            ← DIFFERENT error than "requires TrustedHTML assignment"

Proof C (forged +          own property names on a REAL TrustedHTML: []
  copied properties):      sink result: REJECTED — same "Illegal invocation" error
                            (nothing to copy; rejection identical either way)

Proof D (reporting):       securitypolicyviolation event: did NOT fire
                            (different failure category than Module 21's violations)
```
This is the mechanistic core of why Trusted Types resists prototype-based
forgery even though `instanceof` alone does not: the browser's real check
is not "does this object's prototype chain contain `TrustedHTML.prototype`"
— it's "does this object carry the specific internal state a genuine
`TrustedHTML` was constructed with." `Object.create` can forge the former;
it cannot forge the latter. Module 23 names this distinction precisely and
explains exactly why it holds even under further, more creative forgery
attempts.
