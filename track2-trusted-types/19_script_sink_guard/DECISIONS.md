# Module 19 — Script Sink Guard: Decisions

### Proof B tests `new Function(...)` expecting it to demonstrate the guard working — real testing found something else entirely

**(a) Forced by the platform — a genuine platform limitation, not a bug in
this module.** We expected a real `TrustedScript` value handed to `new
Function(...)` to succeed, mirroring `eval`. Instead it threw, and the
browser's own console explained why with a direct citation:
*"The JavaScript Function constructor does not accept TrustedString
arguments. See
https://github.com/w3c/webappsec-trusted-types/wiki/Trusted-Types-for-function-constructor
for more information."* **The `Function` constructor does not participate
in the Trusted Types spec at all yet, for real values or fake ones — under
`require-trusted-types-for 'script'`, `new Function(anything)` is
unconditionally broken**, not selectively guarded. We report this as a
real, current platform limitation, with the browser's own citation, rather
than silently reframing the module around a false "it works like eval"
narrative.

### Proof E was originally written as `eval({ toString: () => '...' })` — changed after testing revealed it doesn't test what we intended

**(a) Forced by the platform — a mistake in our own test design, caught
before publishing.** `eval(x)` for non-string `x` doesn't evaluate anything
at all — per plain JS semantics (nothing to do with Trusted Types),
`eval()` returns a non-string argument completely unchanged. Our first
version of this proof "succeeded" in a way that looked like a Trusted
Types bypass but was actually just ordinary `eval()` behavior we'd
overlooked. We moved the duck-typed-fake test to `script.src` instead,
which we'd already confirmed properly type-checks its input — a test that
actually exercises the guard, verified by producing the same rejection as
a plain string (Proof F).

### Proof D reports the ASSIGNMENT succeeding and the SCRIPT EXECUTING as two separate, independently-checked facts

**(a) Forced by the platform — another real, unexpected result.** A real
`TrustedScript` value assigned to `.text` on a `<script>` element does NOT
throw (confirmed: a plain string in the same position DOES throw,
isolating that Trusted Types is satisfied). But checking
`window.__scriptTextRan` immediately afterward showed the script never
actually ran — even after `appendChild`, even testing both
append-then-set-text and set-text-then-append orderings directly. This
turns out to be a general `HTMLScriptElement` behavior unrelated to
Trusted Types: setting `.text` (as opposed to having content present via
`.src`, or via the parser, or via cloning) doesn't reliably re-trigger the
"prepare the script element" execution algorithm. We report exactly what
we verified — the guard accepted the value; whether the resulting script
executes is a separate, general DOM-mechanics question this module does
not claim to answer definitively.

### Every proof still isolates `'unsafe-eval'` in `script-src`, inherited from Module 15's technique

**(b) Forced by an external contract**, same reasoning as Module 15:
without it, a blocked `eval`/`Function` call would be ambiguous between
Track 1's CSP mechanism and Trusted Types. With it present, every observed
block in this module is unambiguously attributable to Trusted Types.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| `Function()` reported as broken, not "guarded" | (a) platform, empirical | Real console message + W3C tracking link confirm it doesn't support TT at all |
| Proof E moved from `eval` to `script.src` | (a) platform, empirical | `eval()`'s own non-string passthrough semantics made the original test meaningless |
| Proof D separates "assignment succeeded" from "script executed" | (a) platform, empirical | Two genuinely different, independently-verified facts, not one |
| `'unsafe-eval'` isolation kept | (b) inherited from Module 15 | Removes ambiguity about which mechanism caused a given block |

## What We Proved

Real sinks, real fakes, real (sometimes surprising) results:
```
Proof A (eval):                    SUCCEEDED, result: 42
Proof B (new Function):            THREW — Function() doesn't support
                                     Trusted Types at all (real platform
                                     limitation, cited by the browser itself)
Proof C (script.src):              SUCCEEDED — child.js genuinely executed
Proof D (script.text):             assignment SUCCEEDED; script did NOT
                                     execute (separate, general DOM behavior)
Proof E (fake → script.src):       THREW: "This document requires
                                     'TrustedScriptURL' assignment."
Proof F (raw string → script.src): THREW — identical error to Proof E
```
This module's real value is in its corrections as much as its confirmations:
Trusted Types coverage across the Script/ScriptURL sink family is real but
uneven — `eval` and `script.src` are solidly guarded and usable; `Function`
is a documented gap in the current spec/implementation; and `.text`'s
relationship to actual execution is governed by DOM mechanics that predate
and are independent of Trusted Types entirely. Treating all four sinks as
interchangeable would have been a real mistake to teach.
