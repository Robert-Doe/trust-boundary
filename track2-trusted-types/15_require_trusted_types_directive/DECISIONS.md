# Module 15 — require-trusted-types-for Directive: Decisions

### `'unsafe-eval'` is deliberately included in `script-src`, even though this module is about BLOCKING eval

**(c) Our own convention**, and the specific reason is precision: Track 1
already proved `script-src` without `'unsafe-eval'` blocks `eval` on its
own. If we omitted `'unsafe-eval'` here, Proof C's blocked `eval` would be
ambiguous — is it Trusted Types stopping it, or the same plain CSP
mechanism from Module 3? Including `'unsafe-eval'` removes that mechanism
entirely, so ANY block we observe on `eval` must be attributable to
`require-trusted-types-for 'script'` alone. Real captured evidence
confirms this isolation worked: the error is `EvalError: ... violates this
document's Trusted Type assignment requirements` — a distinctly different
message from Track 1's `'unsafe-eval' is not an allowed source of script`.

### No `trustedTypes.createPolicy()` call anywhere in this module — verified as a deliberate absence, not an oversight

**(c) Our own convention**, and the entire point of this module: we wanted
to see what the CSP directive does completely alone, with nothing else in
place, before Module 16 introduces the first policy. Confirmed: even Proof
B's completely harmless, non-executing HTML throws the exact same error as
Proof A's dangerous one — direct, real evidence that the block happens
**before** the browser has any opinion about the string's content, purely
because no policy exists to authorize the assignment at all.

### Proof A and Proof B are checked for IDENTICAL error text, not just "both threw"

**(c) Our own convention**, and this is the module's central finding, made
precise rather than left as a vague impression. Both produced, verbatim:
`TypeError: Failed to set the 'innerHTML' property on 'Element': This
document requires 'TrustedHTML' assignment.` Same error class, same
message, same everything — because the browser never got far enough to
distinguish them. This is the mechanistic proof that Trusted Types
intercepts at assignment, not at content-inspection time, closing exactly
the gap Module 14 identified and verified.

### `try/catch` wraps each proof independently, rather than letting one uncaught error stop the whole script

**(c) Our own convention.** In a real application, an uncaught
`TypeError` from a Trusted-Types-guarded sink would halt whatever script
was running — which is realistic and important to know, but would have
prevented this module from running all three proofs on one page. Catching
each individually lets us observe and report all three real error messages
in one run.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| `'unsafe-eval'` deliberately included | (c) convention | Isolates Trusted Types' block on `eval` from Track 1's separate CSP mechanism |
| Zero `createPolicy()` calls | (c) convention | Tests the directive completely alone, establishing the true baseline |
| Compared exact error text, A vs. B | (c) convention | Proves categorical rejection, not just "both got blocked" |
| Each proof independently try/caught | (c) convention | Lets all three real results surface on one page run |

## What We Proved

Real policy, real sinks, real thrown errors, captured verbatim:
```
Proof A (dangerous content):  THREW: TypeError: Failed to set the 'innerHTML'
                                property on 'Element': This document requires
                                'TrustedHTML' assignment.

Proof B (harmless content):   THREW: TypeError: Failed to set the 'innerHTML'
                                property on 'Element': This document requires
                                'TrustedHTML' assignment.
                                ← IDENTICAL to Proof A's error

Proof C (eval, with           THREW: EvalError: Evaluating a string as
  'unsafe-eval' present):      JavaScript violates this document's Trusted
                                Type assignment requirements.
                                ← different message, confirms Trusted Types
                                (not script-src) is what blocked this
```
This is the mechanism Module 14 was missing, now real: a single CSP
directive, `require-trusted-types-for 'script'`, makes every guarded sink
(`innerHTML` and friends for HTML, `eval`/`Function`/script `src`/`text`
for script) refuse ANY raw string unconditionally — Module 14's Proof B,
which sailed through completely unchecked before, now fails identically to
its dangerous counterpart. Nothing useful can happen yet, though — with
zero policies defined, these sinks are now simply unusable. Module 16 fixes
that.
