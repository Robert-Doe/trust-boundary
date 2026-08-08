# Module 23 — Forged-Object Defense: Decisions

### Four attacks, each isolating a DIFFERENT variable Module 22 left untested

**(c) Our own convention**, and deliberately structured as an escalating
series, each ruling out one specific hypothesis about what "the real
check" might be keying on:
- Attack A rules out "any object reachable through a polluted `Object.prototype`."
- Attack B rules out "whatever the current value of the global `TrustedHTML` identifier is."
- Attack C rules out "the specific forging METHOD (`Object.create` vs. `Object.setPrototypeOf`)."
- Attack D rules out "knowing/copying the right STRING CONTENT."

Each was tested directly rather than assumed to generalize from Module 22's
single `Object.create` result.

### Attack A confirms the pollution itself really worked, before checking the sink

**(c) Our own convention**, and necessary for the result to mean anything.
`({}).polluted === 'yes'` returning `true` confirms
`Object.prototype.polluted = 'yes'` genuinely affected every plain object's
prototype chain — a real, working prototype pollution, not a no-op. The
sink's rejection of a plain `{}` afterward is therefore a meaningful
negative result, not an artifact of the pollution attempt failing for some
unrelated reason.

### Attack B is the most structurally interesting result: reassigning `window.TrustedHTML` succeeds with NO error, and the sink's behavior is completely unaffected by it either way

**(a) Forced by the platform — verified, not assumed, and worth stating
precisely.** `window.TrustedHTML = function FakeTrustedHTML(...) {...}`
is just an ordinary global variable reassignment — nothing about
`require-trusted-types-for` prevents overwriting the identifier itself, and
it doesn't throw. But two things confirmed the sink doesn't consult that
mutable global at all: (1) an instance of the FAKE constructor is rejected
identically to every other forgery; (2) the ORIGINAL `real` value, created
*before* the reassignment, still works perfectly *after* it — meaning
whatever the sink checks was bound at the time `real` was created (or is
otherwise independent of the current global binding), not re-resolved
against `window.TrustedHTML` on every sink write.

### Attack C reuses `Object.setPrototypeOf` specifically to distinguish "forging method" from "forging result"

**(c) Our own convention.** `Object.create(X.prototype)` and
`Object.setPrototypeOf({}, X.prototype)` are two different JS operations
that arrive at the identical end state (an object whose prototype is
`X.prototype`). Getting the identical result (`instanceof` true, sink
rejects with "Illegal invocation") from both confirms the sink's check
depends on the object's actual internal state, not on which JS API
happened to establish its prototype link.

### Attack D is included even though its result is the "boring," fully-expected one

**(c) Our own convention.** Every OTHER attack in this module tries to make
a fake object PASS as trusted. Attack D tests something different and
arguably more intuitive to worry about: "if I've already SEEN the real
content once (via `String(real)`), can I replay it later without going
through the policy again?" Confirming "no" closes a different kind of
concern — the guarantee isn't just "you can't impersonate a trusted value,"
it's "possessing the right content is never sufficient on its own,
authorization has to come from the policy every time."

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| Four attacks, each isolating one variable | (c) convention | Rules out four distinct hypotheses individually, not one combined guess |
| Pollution effectiveness confirmed before checking the sink | (c) convention | Makes the sink's rejection a meaningful negative, not a false one |
| Reassignment tested for BOTH the fake instance AND the pre-existing real value | (a) platform, empirical | Confirms the sink's check is bound independently of the mutable global |
| `setPrototypeOf` used alongside `Object.create` | (c) convention | Distinguishes forging METHOD from forging RESULT |
| Attack D included despite the "boring" expected result | (c) convention | Closes a different, content-replay-shaped concern |

## What We Proved

Four real, independently-verified forgery attempts, all defeated, for
different underlying reasons made explicit:
```
Attack A (prototype pollution):     pollution genuinely worked on plain
                                      objects (verified) — sink STILL
                                      rejected a plain {} (never even
                                      reaches instanceof-passing territory)

Attack B (reassign window.TrustedHTML): reassignment succeeded, no error —
                                      fake-constructor instance: REJECTED
                                      pre-existing real value, tried AFTER
                                      reassignment: STILL ACCEPTED
                                      (sink's check is independent of the
                                      current global binding)

Attack C (setPrototypeOf):          instanceof: true (spoofed, same as
                                      Module 22) — sink: REJECTED, "Illegal
                                      invocation" (identical to Object.create)

Attack D (stolen string content):   REJECTED — content alone, without
                                      going through a policy, is never
                                      sufficient
```
Taken together with Module 22, this is the complete, verified answer to
"how does Trusted Types relate to prototypal inheritance": prototype-chain
manipulation — however it's achieved, at whatever scope, even reassigning
the brand-checking constructor's own global name — never succeeds in
forging a trusted value, because the platform's real check is bound to
internal state no JS-level prototype operation can create, copy, or
otherwise fake. Prototypal inheritance is a real, exploitable weak point
for `instanceof`-based logic written in ordinary JS; it is simply not the
mechanism the browser itself relies on here.
