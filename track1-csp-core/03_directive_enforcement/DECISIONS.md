# Module 3 — Directive Enforcement: Decisions

### The policy is `default-src 'self'; script-src 'self'`, not something looser or stricter

**(c) Our own convention**, chosen to exercise the fallback rule from
[prerequisites/03_csp_vocabulary.html#directive-inheritance](../../prerequisites/03_csp_vocabulary.html#directive-inheritance)
on purpose: `img-src` has no explicit entry, so it falls back to
`default-src 'self'` — meaning Proof C (image) is blocked by a directive we
never even wrote. That's a deliberate teaching choice, not an accident; the
real captured console message even says so: *"Note that 'img-src' was not
explicitly set, so 'default-src' is used as a fallback."*

### CSS was moved to an external same-origin `style.css` file instead of an inline `<style>` block

**(c) Our own convention — added only after running the module and seeing it fail.**
Our first draft had an inline `<style>` block and an inline `style="..."`
attribute. Running it for real (not just reasoning about it) produced two
*extra* violations neither Module 1 nor this module's stated goal was about:
```
Applying inline style violates ... 'default-src 'self''... The action has been blocked.
```
`style-src` isn't set explicitly either, so it also fell back to
`default-src 'self'`, which has no `'unsafe-inline'`. Rather than leave that
noise in the demo (or, worse, silently note it away), we fixed the actual
page to only use CSS in a way this policy permits — and now note it here as
a real lesson: **a `default-src`-only policy governs far more than scripts.**
This is exactly the kind of surprise that makes people over-scope
`'unsafe-inline'` in production; better to feel it here.

### The `securitypolicyviolation` listener lives in its own file, loaded first, before any other script or proof markup

**(a) Forced by the platform — discovered empirically, not assumed.**
Our first draft put the listener in `wiring.js`, loaded *after* the proof
markup. Running it for real showed the on-page violation log staying empty
even though Proofs A/B/C were genuinely blocked (confirmed via
`read_console_messages`). The reason: violations for inline-script,
cross-origin-script, and cross-origin-image all fire *while the HTML body is
still being parsed*, which is before a `<script src>` placed later in that
same body has even been requested, let alone executed. Event listeners can
only catch events that fire after they're attached — this is ordinary DOM
timing, not a CSP quirk, but CSP violations happen early enough in page load
that it bites here specifically. Fix: split out `violation-listener.js`,
load it as the very first thing in `<head>`, and have it buffer events on
`window.__cspViolations` for `wiring.js` to drain later.

### Proof D's `eval()` call runs automatically on page load, not only from a button click

**(a) Forced by the platform — discovered empirically.** Our first attempt
tested the click path using this course's own browser-automation tooling
(Chrome DevTools Protocol `Runtime.evaluate`, invoked as `element.click()`
inside a `javascript_exec` call). It reported `eval result: 2` — CSP did
**not** block it. Suspecting a testing artifact rather than a real gap, we
isolated the variable directly:
```js
// via CDP Runtime.evaluate against the SAME page, SAME policy:
eval('40+2')   // → "no throw: 42"
```
Real page script calling `eval()` under this exact policy throws; the
identical call made through DevTools/CDP does not. This is documented,
intentional Chromium behavior: script executed via the Inspector/DevTools
console (and by extension, automation tooling built on the same protocol
path) is treated as trusted operator input, not page script, and is exempt
from a page's own `script-src` restriction on `eval`. **Practical
consequence for this whole course:** any claim about CSP/Trusted Types
blocking something must be verified via genuine page-script execution (a
real click, or code that runs as part of normal page load) — never via this
course's own automation tooling calling into the page directly, because that
channel is CSP-exempt by design and would silently produce false "not
blocked" readings. We now run the eval probe automatically as part of
`wiring.js`'s normal load, so the documented result never depends on how
(or whether) a click event gets delivered.

### The violation log renders `blockedURI` / `violatedDirective` / `effectiveDirective`, not the full event object

**(c) Our own convention.** `SecurityPolicyViolationEvent` carries more
fields (`sourceFile`, `lineNumber`, `originalPolicy`, …). These three are the
ones that answer "what got blocked, by which rule" at a glance; the rest is
exactly what Module 10's dedicated Reporting-API module exists to show in
full.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| `default-src 'self'; script-src 'self'` policy | (c) convention | Exercises the fallback rule on `img-src`/`style-src` deliberately |
| CSS moved to external `style.css` | (c) convention, found empirically | Inline CSS was ALSO blocked — real result, not assumed |
| Violation listener loaded first, in its own file | (a) platform, found empirically | Violations fire during parse, before later scripts attach listeners |
| Eval probe auto-runs on load | (a) platform, found empirically | CDP/DevTools-triggered eval is CSP-exempt; only real page-script execution proves the block |
| Violation log shows 3 fields only | (c) convention | Matches this module's scope; full event detail is Module 10's job |

## What We Proved

Against a real server sending a real header (confirmed via `fetch().headers`
→ `"content-security-policy":"default-src 'self'; script-src 'self'"`), and
read back via genuine DOM/page state, not automation-tool eval:

```
Proof A — inline script:        BLOCKED  (text never changed from placeholder)
Proof B — cross-origin script:  BLOCKED  (text never changed from placeholder)
Proof C — cross-origin image:   BLOCKED  (img-src fallback from default-src)
Proof D — eval():                BLOCKED  ("EvalError: Evaluating a string as
                                  JavaScript violates the following Content
                                  Security Policy directive because
                                  'unsafe-eval' is not an allowed source of
                                  script: script-src 'self'".)
Proof E — same-origin script:    ALLOWED  ("ran — this same-origin external
                                  script executed normally")
```
Live violation log, captured from real `securitypolicyviolation` events:
```
#1 blockedURI=http://localhost:5400/pixel.png   violatedDirective=img-src         effectiveDirective=img-src
#2 blockedURI=inline                            violatedDirective=script-src-elem effectiveDirective=script-src-elem
#3 blockedURI=http://localhost:5400/attacker.js violatedDirective=script-src-elem effectiveDirective=script-src-elem
#4 blockedURI=eval                              violatedDirective=script-src      effectiveDirective=script-src
```
This is the first module where a CSP header actually changes browser
behavior, verified against Module 1's identical baseline shape — five
proofs, five different real outcomes, all captured, none assumed.
