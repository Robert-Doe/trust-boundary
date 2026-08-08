# Module 8 — Multiple-Policy Intersection: Decisions

### Two policies sent via `res.setHeader('Content-Security-Policy', [POLICY_1, POLICY_2])`, not one comma-joined string

**(b) Forced by an external contract**, and worth being precise about why.
HTTP allows a header name to appear multiple times as distinct lines; Node's
`http` module represents that by accepting an array as a header value and
serializing it as repeated lines. This is a completely different wire
format from joining two policies with a comma into one
`Content-Security-Policy: policyA, policyB` line — CSP's grammar (Module 2)
has no comma-separated-policy-list concept; a comma inside one policy value
would just be a malformed/ignored token. Two real, independent header lines
is the only way to send two policies at all.

### Policy 1 grants `'unsafe-inline'` and an explicit `img-src`; Policy 2 is a bare `script-src 'self'` with nothing else

**(c) Our own convention**, deliberately asymmetric so the two proofs test
different things: Proof A needs one policy to permit something the other
forbids (to prove AND-combination on the *same* directive); Proof C needs
one policy to explicitly allow something while the other simply never
mentions that resource category at all (to prove a directive missing from
one policy, with no `default-src` fallback in that policy either, imposes
no constraint from that policy specifically — it isn't the same as that
policy silently forbidding it).

### The violation listener records `event.originalPolicy`, not just which directive was violated

**(b) Forced by an external contract**, and the single most useful addition
this module makes to the logging pattern from Modules 3–7.
`SecurityPolicyViolationEvent.originalPolicy` reports the *exact policy
string that caused this specific violation* — with two active policies, this
is the only way to determine, from the event itself, which one did the
blocking, rather than assuming. Our captured result shows it directly:
`causedByPolicy="script-src 'self'"` — that's Policy 2, confirmed, not
guessed.

### Proof B (same-origin external script) is included even though it seems redundant with Module 3

**(c) Our own convention.** It's a control: if this had failed too, it
would mean something more sweeping was broken (e.g., both policies somehow
became stricter than intended) rather than the specific intersection
behavior. A test suite with only "things that should fail" can't distinguish
"the interesting thing broke" from "everything broke."

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| Array value → two real header lines | (b) HTTP/CSP grammar | The only valid way to send two independent policies |
| Asymmetric policies (1 has extras, 2 is minimal) | (c) convention | Lets Proof A and Proof C each isolate a different combination rule |
| Capture `event.originalPolicy` | (b) spec | Only field that identifies WHICH policy caused a given block |
| Proof B kept as a control | (c) convention | Rules out "everything broke" as an alternate explanation |

## What We Proved

Real server, two real header lines (confirmed via captured response),
real browser combining them:
```
Proof A — inline script:            BLOCKED  (Policy 1 alone would allow it
                                     via 'unsafe-inline'; Policy 2 doesn't
                                     have 'unsafe-inline' — must satisfy BOTH)
Proof B — same-origin script:       ALLOWED  (both policies permit 'self')
Proof C — cross-origin image:       ALLOWED  (Policy 1 explicitly allows it;
                                     Policy 2 has no img-src/default-src at
                                     all, so it imposes no constraint here)
```
Violation log — one real block, with the field that proves WHICH policy did it:
```
#1 blockedURI=inline  violatedDirective=script-src-elem
     causedByPolicy="script-src 'self'"
```
That `causedByPolicy` value is Policy 2's exact string — direct, captured
confirmation that Policy 2 (not Policy 1, which would have allowed this
specific inline script) is what actually blocked Proof A. This is the
concrete mechanism behind the informal rule "multiple CSP policies combine
by intersection, most restrictive wins": each active policy is evaluated
completely independently, and a load is only permitted if every single one
of them, individually, would have allowed it.
