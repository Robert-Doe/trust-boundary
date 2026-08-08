# Module 18 — HTML Sink Guard: Decisions

### The policy's `createHTML` rule returns its input completely unchanged, no transform this time

**(c) Our own convention**, and a deliberate contrast with Modules 16-17's
uppercase/prefix transforms. This module isn't testing whether a rule
executes (already proven) — it's testing whether the SINK cares about the
value's TYPE, independent of content. Removing the transform keeps that the
only variable under test.

### Three different HTML sinks tested — `innerHTML`, `outerHTML`, `insertAdjacentHTML` — not just `innerHTML` again

**(c) Our own convention**, chosen to verify a claim rather than assume it
generalizes: "the HTML sink family" is a category this course has used
loosely since the prerequisites page. Testing three real, different sinks
— including one, `insertAdjacentHTML`, where the guarded value is a METHOD
ARGUMENT rather than a property assignment — confirms the guard is applied
consistently across the category, not verified for one member and assumed
for the rest.

### Proof D uses a plain object with a `toString()` method; Proof E uses a real, boxed `String` object — two different "almost right" shapes, not one

**(c) Our own convention**, chosen because they fail for informative,
slightly different reasons a reader might otherwise conflate. Proof D
tests whether STRING COERCION (what `${value}` or `String(value)` would
produce) is what the guard checks — it isn't. Proof E tests something
stricter: even a genuine, real JS `String` object (not a plain string
primitive, not a fake — an actual instance of the built-in `String`
constructor) is rejected, because `instanceof String` is exactly as
irrelevant to the guard as any other type that isn't specifically
`TrustedHTML`. Real captured evidence: both throw the IDENTICAL error text
as a plain string would.

### Neither fake value (Proof D or E) is passed through `policy.createHTML` at all

**(c) Our own convention**, and the point: these values are meant to
simulate an attacker or a confused developer handing something
"string-like" directly to the sink, bypassing the policy entirely — exactly
the shape of mistake the guard exists to catch.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| No content transform in this module's rule | (c) convention | Isolates TYPE-checking as the only variable under test |
| Three different HTML sinks tested | (c) convention | Verifies the guard generalizes across the category, doesn't assume it |
| Duck-typed object AND boxed String, tested separately | (c) convention | Two different "almost right" failure modes, informative individually |
| Neither fake goes through the policy | (c) convention | Simulates bypassing the policy entirely, the realistic mistake shape |

## What We Proved

Real policy, real sinks, real fakes, real captured results:
```
Proof A (innerHTML):           SUCCEEDED — real TrustedHTML, via innerHTML
Proof B (outerHTML):           SUCCEEDED — real TrustedHTML, via outerHTML
Proof C (insertAdjacentHTML):  SUCCEEDED — real TrustedHTML, via insertAdjacentHTML

Proof D (duck-typed fake):     THREW: TypeError: ... This document requires
                                'TrustedHTML' assignment.
Proof E (boxed String):        THREW: TypeError: ... This document requires
                                'TrustedHTML' assignment.
                                ← IDENTICAL error text to Proof D
```
This confirms two things at once: the HTML sink guard is enforced
uniformly across the whole family of HTML-writing sinks, not just
`innerHTML` specifically — and it checks the VALUE'S ACTUAL TYPE, not
whether the value merely stringifies to the right-looking text or happens
to be *some* String-related object. Only a value that genuinely passed
through a real policy's `createHTML` method qualifies, no matter how
convincingly something else might imitate the right appearance.
