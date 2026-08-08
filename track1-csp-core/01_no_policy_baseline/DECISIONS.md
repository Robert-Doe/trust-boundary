# Module 1 — No-Policy Baseline: Decisions

Every non-obvious choice in `server.js` / `public/index.html` / `attacker-site/`,
categorized as: **(a)** forced by the platform, **(b)** forced by an external
contract, or **(c)** our own convention.

---

### Two separate `http.createServer` instances on two separate ports

**(a) Forced by the platform.** Origin is `(scheme, host, port)` — see
[prerequisites/01_http_headers_and_origins.html#origin-triple](../../prerequisites/01_http_headers_and_origins.html#origin-triple).
There is no way to get the browser to treat two responses as cross-origin on
`localhost` without varying at least one of those three. Varying the port is
the cheapest way to do that without editing `/etc/hosts` or buying a second
domain, so the whole rest of this course uses "different port" as its
stand-in for "different origin."

### No `Content-Security-Policy` header is set anywhere in `server.js`

**(c) Our own convention** — and the load-bearing one for this whole module.
Nothing in HTTP *requires* a server to omit this header; we omit it on
purpose, because this module's entire job is to be the "before" picture that
Modules 3 and 11 diff against. We verified the omission directly rather than
just asserting it — seen in the browser's own `fetch().headers`:
```json
{"connection":"keep-alive","content-type":"text/html; charset=utf-8","date":"...","keep-alive":"timeout=5","transfer-encoding":"chunked"}
```
No `content-security-policy` key. That's a real captured response, not a
claim about what Node "would" send.

### Four separate labeled "Proof" boxes instead of one combined demo

**(c) Our own convention.** We could have crammed inline script + remote
script + remote image + `eval` into one paragraph. Splitting them lets every
later module reference *one specific proof* by name ("Module 3 will re-run
Proof B and show it get blocked") instead of "the demo," which stays precise
across 13 modules of diffing against this baseline.

### The eval button's handler is wired via `addEventListener` in a `<script>` block, not an inline `onclick="..."` attribute

**(c) Our own convention, chosen to avoid teaching the wrong lesson early.**
An inline event-handler attribute (`onclick="eval(...)"`) is *also* just
inline script from CSP's point of view, and would behave identically to
Proof A in this specific module. But later modules (5, 6) will show
nonce/hash allowlisting only working for `<script>` elements/blocks, not for
`on*` attributes at all in most configurations — starting the button's
wiring in the "already-correct" pattern now means Modules 5–7 don't have to
stop and refactor it.

### Attacker's cross-origin script (`attacker.js`) is allowed to touch the main page's DOM directly

**(a) Forced by the platform.** This one surprises people: `<script src>`
does not create a sandboxed execution context. Once the browser fetches the
bytes from `http://localhost:5200/attacker.js`, it executes them *inside the
including document* (`http://localhost:5100`), with full access to that
document's DOM, cookies (subject to cookie scoping, a separate mechanism),
and globals. The Same-Origin Policy restricts *reading responses across
origins* via script (e.g. `fetch`); it does not restrict *executing* a
`<script src>` from another origin at all. This is precisely the gap
[prerequisites/01_http_headers_and_origins.html#same-origin-policy](../../prerequisites/01_http_headers_and_origins.html#same-origin-policy)
warned about, now made concrete.

### The pixel image is a hand-built 68-byte PNG, not a real photo

**(c) Our own convention.** The only thing Proof C needs to demonstrate is
"an image byte stream from a different origin was fetched and decoded." A
1×1 transparent PNG proves that in 68 bytes instead of shipping a JPEG whose
size has nothing to do with the lesson.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| Two ports instead of two hostnames | (a) platform | Port is the cheapest of the three origin fields to vary on localhost |
| No CSP header set | (c) convention | This module *is* the "before" picture |
| Four discrete "Proof" boxes | (c) convention | Gives every later module a stable name to reference |
| `eval` button wired via `addEventListener` | (c) convention | Keeps the pattern later modules need already in place |
| Cross-origin script can edit the including page's DOM | (a) platform | `<script src>` executes in-document; SOP doesn't gate this |
| 68-byte hand-built PNG | (c) convention | Smallest artifact that still proves real byte-level cross-origin image load |

## What We Proved

With zero CSP in place, and verified against a real running server and a
real browser (not asserted from documentation):

1. Inline `<script>` blocks execute unconditionally.
2. A `<script src>` pointed at a completely different origin (different port
   = different origin) is fetched and executed with full access to the
   including page's DOM.
3. An `<img>` from a different origin loads and decodes.
4. `eval()` on an arbitrary string executes it.
5. The server's actual response headers, captured via `fetch()` in the
   browser, contain no `content-security-policy` key.

This is the complete, unrestricted attack surface that every subsequent
Track 1 module exists to shrink, one directive at a time.
