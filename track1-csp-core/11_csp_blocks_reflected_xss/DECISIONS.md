# Module 11 — CSP Blocks Reflected XSS: Decisions

### `/vulnerable` and `/protected` share the exact same unescaped-reflection code — the bug is never fixed

**(c) Our own convention, and the single most important decision in this
module.** It would be easy — and wrong — to "fix" `/protected` by escaping
`q` properly and let CSP take credit for stopping the exploit. We
deliberately left the real bug in place on both routes so that what's
actually being measured is CSP's effect in isolation, not a second,
unrelated fix. This is the honest shape of what CSP really is: a mitigation
layered on top of a still-present vulnerability, not a substitute for fixing
it. See the Brain Exercise for why that distinction has real consequences.

### The exploit payload is `<script>document.title='XSS-EXECUTED';</script>`, verified by reading the actual browser tab title

**(c) Our own convention**, chosen so success/failure is machine-checkable
from outside the page, with no cooperation from page script required (unlike,
say, writing to a DOM element, which itself requires JS to execute — using
the tab title sidesteps any doubt about whether our *detection* mechanism
was itself blocked). We ran this for real and captured the actual browser
tab title changing to `"XSS-EXECUTED"` against `/vulnerable`, and staying
`"Search Results"` against `/protected` — not a description of expected
behavior, the literal captured title string both times.

### `/protected`'s nonce is generated exactly the way Module 5's was — fresh, per response, via `crypto.randomBytes`

**(b) Forced by an external contract**, inherited directly from Module 5's
reasoning: a predictable or reused nonce here would defeat the entire
demonstration, for the same reasons Module 5's Proof D existed.

### This module doesn't try to defend against an attacker who can read the current response before crafting their payload

**(c) Our own convention**, and worth being explicit about, because Module
5's Brain Exercise raised exactly this scenario. A classic reflected-XSS
attack is a link crafted *in advance* and sent to a victim — the attacker
never sees the nonce that will be generated for the victim's specific
future response, because that value doesn't exist yet when the malicious
link is created. That's precisely the case this module tests, and precisely
the case nonce-based CSP defends well against. Module 5's exercise
describes a different, narrower scenario (an attacker who can adaptively
read the current page's own markup through some other channel) — worth
re-reading now that you've seen both sides for real.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| Same injection bug on both routes, never fixed | (c) convention | Isolates CSP's effect from an unrelated escaping fix |
| Tab-title-based exploit detection | (c) convention | Externally verifiable, doesn't depend on page script cooperating |
| Fresh per-response nonce | (b) inherited from Module 5 | A reused/predictable nonce would defeat the whole point |
| Attacker doesn't know the nonce in advance | (c) convention | Matches the real shape of a classic reflected-XSS attack |

## What We Proved

Real server, real unescaped reflection, real exploit URL, real browser —
the exact same payload, two different outcomes:

```
GET /vulnerable?q=<script>document.title='XSS-EXECUTED';</script>
  → tab title becomes: "XSS-EXECUTED"   ← exploit RAN

GET /protected?q=<script>document.title='XSS-EXECUTED';</script>
  → tab title stays:   "Search Results" ← exploit BLOCKED
  → violation log:     [{"blockedURI":"inline","violatedDirective":"script-src-elem"}]
  → real console message: "Executing inline script violates the following
    Content Security Policy directive 'script-src 'self' 'nonce-GYSuun...''.
    ... The action has been blocked."
```

This is Track 1's central claim, finally demonstrated end-to-end rather than
piecemeal: a real, working XSS vulnerability — the same one, byte-for-byte —
executes freely without CSP and is completely neutralized with it, using
nothing more exotic than the nonce mechanism Module 5 already built.
