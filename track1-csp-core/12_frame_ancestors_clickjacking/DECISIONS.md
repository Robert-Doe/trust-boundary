# Module 12 — frame-ancestors Clickjacking Defense: Decisions

### Two victim routes serving byte-identical content, differing only in the CSP header — same pattern as Module 11

**(c) Our own convention**, reused deliberately: isolating one variable
(presence/absence of `frame-ancestors 'none'`) is the same experimental
discipline Module 11 used for the reflected-XSS demo, applied to a
completely different attack shape.

### We did not try to read the framed page's content via `iframe.contentDocument`

**(a) Forced by the platform.** The victim is on a different origin
(different port) than the attacker page — the Same-Origin Policy
([prerequisites/01_http_headers_and_origins.html#same-origin-policy](../../prerequisites/01_http_headers_and_origins.html#same-origin-policy))
blocks that kind of cross-origin read regardless of CSP, for BOTH the open
and the protected route equally. Attempting it would have proven nothing
about `frame-ancestors` specifically — we relied on two signals CSP itself
actually produces: the real console violation message, and the framed
resource's own network status.

### The `'load'` event handler explicitly does NOT claim to prove success

**(c) Our own convention**, and an honest one: we verified that
`iframe.addEventListener('load', ...)` fires for BOTH the open and the
blocked frame — meaning "did load fire" is not a reliable signal for this
specific question, and the code/copy says so directly rather than
presenting a misleading green checkmark. The real proof came from two other
places instead.

### Verification relies on `read_network_requests`, not just the console message

**(c) Our own convention**, and it produced the more precise evidence of
the two. The captured network log shows the exact mechanism:
```
GET http://localhost:6700/open      → 200 OK
GET http://localhost:6700/protected → 200 OK [FAILED: net::ERR_BLOCKED_BY_RESPONSE]
```
That `200 OK` immediately followed by `FAILED: net::ERR_BLOCKED_BY_RESPONSE`
is itself informative: the server successfully sent the full response (this
is not a server-side rejection), and the *browser* blocked it after
receiving and inspecting the response headers. `frame-ancestors` is
enforced by the embedding browser reading the embedded resource's own
policy — a client-side decision made after a real, successful HTTP
transaction, not a network-level refusal to connect at all.

### Both victim routes render an identical fake "Transfer $1000" button

**(c) Our own convention**, chosen to make the stakes of clickjacking
concrete rather than abstract — a real clickjacking attack overlays
deceptive UI on top of a framed sensitive action (a real transfer button, a
real "delete account" button, a real permission-grant dialog) so the victim
thinks they're clicking something harmless. We didn't build the deceptive
overlay itself (that's a UI trick, not a CSP mechanism) — the button exists
here to make it visually obvious what kind of real-world action
`frame-ancestors` is protecting.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| Two byte-identical victim routes | (c) convention | Isolates the one variable, same discipline as Module 11 |
| No attempt to read framed content via JS | (a) platform | SOP already blocks this regardless of CSP; would prove nothing |
| `'load'` explicitly documented as inconclusive | (c) convention | Honest about what this signal does and doesn't prove |
| Verification via network log, not just console | (c) convention | Reveals the precise mechanism: response received, then blocked |
| Fake "Transfer $1000" button | (c) convention | Makes the real-world stakes concrete, not abstract |

## What We Proved

Real attacker page, real cross-origin iframes, real browser enforcement:
```
GET http://localhost:6700/open      → 200 OK                                (framed successfully)
GET http://localhost:6700/protected → 200 OK [FAILED: net::ERR_BLOCKED_BY_RESPONSE]  (blocked after receipt)
```
Real captured console message:
```
Framing 'http://localhost:6700/' violates the following Content Security
Policy directive: "frame-ancestors 'none'". The request has been blocked.
```
This confirms `frame-ancestors` does something CSP's script/style
directives fundamentally cannot: it protects a page from being embedded by
ANY other page at all, closing an attack vector (deceptive UI overlays
tricking users into clicking real, sensitive, framed content) that has
nothing to do with script execution and everything to do with rendering
context.
