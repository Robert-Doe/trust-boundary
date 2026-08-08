# Module 21 — Trusted Types Violation Reporting: Decisions

### Both a `securitypolicyviolation` DOM listener AND a `ReportingObserver` are wired up, reusing both mechanisms Track 1's Module 10 built

**(c) Our own convention**, and it let us verify the claim from two
independent angles at once, exactly as Module 10 did for ordinary CSP
violations. We did not assume Trusted Types failures use the same pipeline
— we checked, on both channels, and both caught both trigger types with
full detail.

### Two triggers, deliberately different failure categories — a blocked sink assignment vs. a blocked policy creation

**(c) Our own convention.** These are conceptually different kinds of
"Trusted Types failure" — one is a runtime data-flow violation (Modules 15,
18-19's territory), the other is a setup-time configuration violation
(Module 20's territory). Testing both, rather than just one, verifies the
reporting pipeline generalizes across the whole feature, not just the sink
half of it.

### We did not assume a thrown `TypeError` implies a separate reporting signal also fires — we checked

**(a) Forced by the platform — verified, not assumed.** A thrown JS
exception and a fired DOM event are two independent mechanisms; a language
feature throwing an error carries no automatic guarantee that a browser
security feature also emits a monitoring signal. Real captured evidence
confirms both DO happen together here — for each trigger, the code catches
a real `TypeError` AND a real `securitypolicyviolation` event fires AND a
real `ReportingObserver` report is generated, all three, independently
confirmed.

### The two triggers produce different `blockedURI` sentinel values (`"trusted-types-sink"` vs. `"trusted-types-policy"`), captured and compared directly

**(b) Forced by an external contract.** These aren't values this course
chose — they're the browser's own vocabulary for identifying which kind of
Trusted Types failure a given report describes, discovered by reading the
real captured event data rather than guessing at plausible-sounding names.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| Both DOM event AND ReportingObserver wired up | (c) convention | Reuses and re-verifies both of Module 10's channels |
| Two deliberately different trigger categories | (c) convention | Confirms the pipeline generalizes across sink AND policy-creation failures |
| Checked whether reporting fires at all, not assumed | (a) platform, empirical | Thrown exceptions don't automatically imply a separate reporting signal |
| Real `blockedURI` sentinel values captured, not guessed | (b) platform vocabulary | Discovered by reading real data, not invented for the demo |

## What We Proved

Real triggers, real thrown exceptions, real reporting events — captured on
both channels simultaneously:
```
Trigger 1 (blocked sink assignment):
  threw:            TypeError: ... This document requires 'TrustedHTML' assignment.
  DOM event:         blockedURI="trusted-types-sink"
                      violatedDirective="require-trusted-types-for"
                      sample="Element innerHTML|a raw string, no policy"
  ReportingObserver:  full report body, effectiveDirective="require-trusted-types-for",
                      disposition="enforce", same sample text

Trigger 2 (blocked policy creation):
  threw:            TypeError: ... Policy "rogue-policy" disallowed.
  DOM event:         blockedURI="trusted-types-policy"
                      violatedDirective="trusted-types"
                      sample="rogue-policy"
  ReportingObserver:  full report body, effectiveDirective="trusted-types",
                      disposition="enforce", sample="rogue-policy"
```
This confirms Trusted Types failures are first-class citizens of the exact
same CSP violation-reporting infrastructure Track 1's Module 10 verified —
not a separate, bolted-on mechanism. A production monitoring setup built
for ordinary CSP violations (a `report-to` endpoint, a `ReportingObserver`)
needs no additional code to also catch Trusted Types violations; it already
does, distinguishable by `blockedURI`/`effectiveDirective` alone.
