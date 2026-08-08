# Module 14 — DOM-XSS Sink Baseline: Decisions

### The policy is the strictest reasonable `script-src` — `'self' 'nonce-<fresh>'`, no `'unsafe-inline'`, no `'unsafe-eval'`

**(c) Our own convention**, and the module's central premise depends on it:
if we tested against a weaker policy, a critic could reasonably say "of
course it wasn't blocked, you didn't even try hard." Using Track 1's
strongest, most defensible configuration makes the finding below land with
its full weight.

### Proof A and Proof B differ only in the CONTENT of the string handed to `innerHTML` — the sink call itself is identical

**(c) Our own convention**, and the whole point of the comparison. Before
building this module, we did NOT assume CSP script-src leaves inline
event-handler injection unblocked — we tested it directly (see below) and
found the opposite: Chrome's CSP3 implementation blocks
`onerror`/`onload`/`javascript:` URLs injected via `innerHTML` at
execution time, not just ones written directly in the original HTML. That
finding changed this module's entire design. What we verified CSP does
**not** touch, no matter how strict: a payload that renders real DOM
structure and a real cross-origin link, without any script or handler at
all — Proof B.

### We tested four executable-payload shapes before writing this module's real code, and discarded the plan that assumed CSP couldn't stop them

**(a) Forced by the platform — the single most consequential empirical
check in this course so far.** Our working assumption going into Track 2
was that CSP's `script-src` leaves `innerHTML`-injected inline handlers and
`javascript:` URLs completely unblocked, and that THAT gap alone would
motivate Trusted Types. Direct testing (four separate payload shapes: `img
onerror`, `svg onload`, an anchor `javascript:` URL via a simulated click,
and an `iframe src="javascript:..."`) showed all four blocked, with real
captured console messages naming `script-src-attr` specifically. Building
Module 14 around the false premise would have taught something untrue.
The real, verified gap — CSP has no jurisdiction over non-executing HTML
structure — is narrower than what we originally assumed, and more
precisely correct.

### Proof B's payload is a fake "Account Suspended" banner with a REAL link to a second server, not just static filler text

**(c) Our own convention**, chosen so "CSP doesn't block this" isn't an
abstract claim — the link is genuinely live, genuinely points to a
different origin standing in for an attacker's phishing page, and
genuinely renders as clickable, real content. We built the second server
(port 7101) specifically so this isn't a decorative prop.

### The violation log only shows ONE entry, from Proof A — not two

**(c) Our own convention**, and worth confirming rather than assuming: it
means Proof B genuinely triggered zero CSP machinery of any kind, not just
"an ignored violation." The single logged entry (`script-src-attr`,
`blockedURI: inline`) is entirely attributable to Proof A's blocked
`onerror` handler.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| Strictest reasonable script-src used | (c) convention | Makes the finding maximally defensible, not a strawman |
| Proof A/B differ only in string content | (c) convention | Isolates exactly what CSP does and doesn't govern |
| Four executable payloads tested BEFORE writing this module | (a) platform, empirical | Original assumption was wrong; real testing changed the module's design |
| Proof B's link is genuinely live, to a real second server | (c) convention | Makes "CSP doesn't block this" concrete, not asserted |
| Confirmed only 1 violation log entry, not 2 | (c) convention | Verifies Proof B triggered zero CSP machinery, not just an ignored one |

## What We Proved

Real strict CSP, real `innerHTML` calls, real captured browser behavior:
```
Proof A (executable handler):  sink ACCEPTED the string; CSP BLOCKED the
                                 handler when it tried to fire — real console:
                                 "Executing inline event handler violates
                                 the following Content Security Policy
                                 directive 'script-src ... '. ... blocked."
Proof B (pure HTML, no code):  sink ACCEPTED the string; content RENDERED
                                 completely, real link to a different
                                 origin, LIVE and clickable — zero CSP
                                 involvement, zero violations logged.
```
This is Track 2's actual motivating gap, verified rather than assumed:
`innerHTML` (and every sink like it) accepts ANY string unconditionally —
CSP's script-src can block certain DANGEROUS CONSEQUENCES of what ends up
inside that string (execution), but it has no mechanism at all for
governing the ASSIGNMENT itself, or for content whose danger isn't
"executes code." Module 15 introduces the mechanism that changes exactly
that: making the sink itself refuse a raw string, unconditionally,
regardless of what's inside it.
