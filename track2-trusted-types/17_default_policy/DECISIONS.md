# Module 17 — The "default" Policy: Decisions

### Two full, separate routes (`/no-default`, `/with-default`) instead of one page with a toggle

**(c) Our own convention**, same discipline as Module 11/12: isolating the
one variable (does a policy named `"default"` exist) by running genuinely
separate page loads, rather than trying to simulate the "before" state
within a single already-loaded page (which is awkward anyway, since
`createPolicy` calls can't meaningfully be un-done once made).

### The default policy's `createHTML` rule prepends a visible marker (`"[DEFAULT POLICY SANITIZED]: "`) instead of silently passing input through unchanged

**(c) Our own convention**, and load-bearing for the proof: if the rule
just returned its input unmodified, "legacy code's raw string succeeded"
would be ambiguous — did the default policy actually run, or did something
else let the raw string through untouched? The visible prefix, present in
the real rendered DOM, is direct evidence the string traveled through the
named policy's actual rule function.

### The "legacy" code that assigns the raw string never references `trustedTypes`, `createPolicy`, or any policy object — by design, not by accident

**(c) Our own convention**, and the entire point of this module. If that
code referenced the policy at all, it wouldn't be a legacy-code scenario —
it'd just be Module 16 again. The realistic case `"default"` exists to
solve is exactly this: a codebase where nobody rewrote the calling code,
and the interception happens entirely on the sink/policy side.

### The `"default"` policy deliberately does NOT define `createScript`, and we test `eval` against it specifically

**(c) Our own convention**, chosen to test a real, easy-to-get-wrong
assumption: does naming a policy `"default"` mean it automatically governs
EVERY sink type, or only the ones it actually implements a rule for? Real
captured result: `eval` still throws on `/with-default`, identically to
`/no-default`. `"default"` isn't a magic "allow everything" switch — it's
an ordinary policy that happens to be consulted automatically, and it's
just as capable of leaving a sink category completely unguarded (by simply
not implementing that `create*` method) as any other named policy from
Module 16.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| Two separate routes, not a toggle | (c) convention | Genuinely isolates the one variable across real separate loads |
| Visible prefix marker on the default rule's output | (c) convention | Makes "the default policy really ran" verifiable, not just plausible |
| Legacy code never references any policy | (c) convention | This IS the realistic scenario `"default"` exists to solve |
| `eval` tested against a default policy with no `createScript` rule | (c) convention | Tests whether "default" governs everything, or only what it implements |

## What We Proved

Real two-route comparison, real legacy-shaped code, real captured results:
```
/no-default:
  legacy innerHTML assignment:  THREW: TypeError: ... This document
                                  requires 'TrustedHTML' assignment.
  eval:                          THREW: EvalError: ... Trusted Type
                                  assignment requirements.

/with-default (policy named EXACTLY "default", createHTML rule only):
  legacy innerHTML assignment:  SUCCEEDED — rendered:
                                  "[DEFAULT POLICY SANITIZED]: a raw string,
                                  written by code with zero Trusted Types
                                  awareness"
  eval:                          STILL THREW — identical error to /no-default
```
This confirms `"default"` is real, working, automatic interception for
code that never opts in — the exact mechanism that makes Trusted Types
adoptable in a large existing codebase without rewriting every call site —
while also confirming it's not a blanket exemption: it only covers
whichever `create*` methods it actually implements, exactly like any other
named policy.
