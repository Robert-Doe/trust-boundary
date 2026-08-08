# Module 4 — Report-Only Mode: Decisions

### Reusing the exact same policy string as Module 3, changing only the header name

**(c) Our own convention**, and the entire experimental design of this
module: holding the policy value constant means any behavioral difference we
observe is attributable to one variable — `Content-Security-Policy` vs.
`Content-Security-Policy-Report-Only` — not to a different set of directives.

### `violation-listener.js` now also records `e.disposition`

**(b) Forced by an external contract.** `SecurityPolicyViolationEvent`
defines a `disposition` field with exactly two possible values, `"enforce"`
or `"report"`, telling you which mode produced this specific event. We
didn't know before running this module whether Report-Only would even fire
the DOM event at all (some browser reporting mechanisms are header/network
-only, with no DOM-visible signal) — capturing `disposition` was how we
verified, rather than assumed, that it does, and that the field correctly
reads `"report"` here versus `"enforce"` in Module 3's identical log format.

### Proof D's eval probe no longer wraps a try/catch around a "should not happen" comment — the success path is just the plain result

**(c) Our own convention.** In Module 3, `eval` succeeding would have been a
bug (or a testing artifact, as DECISIONS.md there explains). Here, `eval`
succeeding is the *expected*, *correct* outcome — report-only must not
block anything — so the code and copy no longer frame success as suspicious.

### Proof E (same-origin script) still doesn't appear in the violation log

**(a) Forced by the platform**, and worth stating explicitly: Report-Only
still only reports things that would have violated the policy. A same-origin
script was never going to violate `script-src 'self'` in either mode, so it
correctly produces zero violation events under Report-Only too — Report-Only
changes what happens *on* a violation, not what counts as one.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| Same policy string as Module 3 | (c) convention | Isolates the header-name variable as the only difference |
| Capture `e.disposition` | (b) spec | The one field that distinguishes report-only events from enforce events |
| Success framed as expected, not suspicious, in Proof D copy | (c) convention | Module 3's "should not happen" framing would be actively wrong here |
| Proof E still produces no log entry | (a) platform | Report-only reports violations, not merely "restricted" categories |

## What We Proved

Same server, same client-side code shape as Module 3, one header name
changed — verified via a real captured response
(`content-security-policy-report-only: default-src 'self'; script-src 'self'`,
no plain `content-security-policy` key at all) and real page state:

```
Proof A — inline script:        ALLOWED  ("ran — inline script executed")
Proof B — cross-origin script:  ALLOWED  ("ran — cross-origin script executed")
Proof C — cross-origin image:   ALLOWED  ("loaded — image displayed, 1x1 px")
Proof D — eval():                ALLOWED  ("eval result: 2")
Proof E — same-origin script:    ALLOWED  ("ran — same-origin external script executed normally")
```
Violation log — same four violations as Module 3, same directive names,
but every entry now carries `disposition=report` instead of blocking:
```
#1 blockedURI=http://localhost:5600/pixel.png   violatedDirective=img-src         disposition=report
#2 blockedURI=inline                            violatedDirective=script-src-elem disposition=report
#3 blockedURI=http://localhost:5600/attacker.js violatedDirective=script-src-elem disposition=report
#4 blockedURI=eval                              violatedDirective=script-src      disposition=report
```
This confirms, empirically rather than from documentation alone, the two
claims that make Report-Only useful in real deployments: (1) it produces the
identical violation signal as enforcement mode, so you can validate a policy
against real traffic before it can break anything, and (2) it genuinely
blocks nothing — every one of Module 3's five blocked/allowed outcomes
inverts to "allowed" here except Proof E, which was always allowed.
