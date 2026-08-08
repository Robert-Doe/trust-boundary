# Module 16 — Policy Factory: Decisions

### The policy's `createHTML` rule uppercases the input, rather than sanitizing it

**(c) Our own convention.** A real sanitizing rule (stripping dangerous
tags/attributes) is Module 24's job, and using one here would blur what
this module is actually testing. Uppercasing is deliberately trivial and
visually obvious — if `String(trustedValue)` and the final rendered DOM
both read `"HELLO WORLD"`, that's direct, unambiguous proof the rule
function really executed and its output is what traveled all the way to
the sink, not just that *some* object got created.

### `policy.createScript` is checked by CALLING it, not just by `typeof`

**(a) Forced by the platform — discovered empirically, and the most
interesting finding in this module.** Our first draft checked
`typeof policy.createScript` and found `"function"` even though we never
supplied a `createScript` rule — which could easily be misread as "it works
anyway." Actually calling it revealed the real behavior: it throws a
precise, real error —
`TypeError: Failed to execute 'createScript' on 'TrustedTypePolicy': Policy
module16-demo's TrustedTypePolicyOptions did not specify a 'createScript'
member.` **A `TrustedTypePolicy` object always exposes all three creator
methods as callable functions, regardless of which rules you provided —
the missing-rule case is a runtime error at call time, not a missing
property.** This is a real, spec-defined shape decision (b) we only
discovered by testing past the first, misleading signal (`typeof`).

### Proof D creates a completely separate, throwaway `<div>` rather than reusing Proof C's element

**(c) Our own convention.** Keeps the two proofs' DOM state independent —
Proof C's element ends up holding real, successfully-rendered content;
reusing it for Proof D's expected-to-fail assignment would either
overwrite that visible evidence or require extra bookkeeping to restore it.

### The policy is named `'module16-demo'`, an arbitrary, unrestricted string

**(c) Our own convention — for now.** Nothing in this module's policy
restricts which names `createPolicy` will accept; any string works. Module
20 is where that changes, once the `trusted-types` CSP directive is
introduced to allowlist policy names specifically.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| `createHTML` rule uppercases input | (c) convention | Trivial, visually obvious proof the rule really executed |
| `createScript` checked by calling it, not `typeof` | (a) platform, empirical | `typeof` alone gave a misleading "it works" signal |
| Proof D uses a separate throwaway element | (c) convention | Keeps Proof C's successful render visible and undisturbed |
| Arbitrary, unrestricted policy name | (c) convention (temporary) | Name allowlisting is Module 20's job, not yet introduced |

## What We Proved

Real policy, real rule function, real sink — captured, not asserted:
```
Proof A: typeof policy === 'object'; policy.createHTML and
         policy.createScript are BOTH typeof 'function', even though only
         createHTML had a rule defined. Calling the undefined one throws:
         "Policy module16-demo's TrustedTypePolicyOptions did not specify
         a 'createScript' member."

Proof B: ruleInvocationCount went from 0 to 1 — the rule function really
         ran. trustedValue is typeof 'object', instanceof TrustedHTML,
         NOT instanceof String. String(trustedValue) === "HELLO WORLD" —
         the rule's actual transform, not the original input.

Proof C: assigning that TrustedHTML value to innerHTML SUCCEEDED — real
         DOM rendered, reading "HELLO WORLD" (the transformed text).

Proof D: assigning a completely unrelated RAW STRING, elsewhere on the same
         page (with a policy already defined and in active use), still
         THREW the exact same error as Module 15 — proving a policy's
         existence doesn't loosen the sink's requirement globally. Only
         values that actually passed through a policy's `create*` method
         qualify.
```
This is the mechanism that makes Trusted Types usable, not just
restrictive: a policy is a deliberate, auditable transformation function,
invoked explicitly at each call site, producing a branded value the sink
recognizes — and nothing else, including plain strings sitting right next
to legitimate policy usage, gets a free pass.
