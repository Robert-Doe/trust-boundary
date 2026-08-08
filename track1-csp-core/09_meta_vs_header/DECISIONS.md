# Module 9 — Meta Tag vs. Header: Decisions

### No HTTP header CSP anywhere in this module — every policy comes from a `<meta>` tag

**(c) Our own convention.** Modules 1-8 all used the header exclusively;
this module needed to isolate the `<meta>` mechanism completely, with zero
header-based policy in play, so every result observed is attributable to
`<meta>` specifically and not to some interaction with a header policy.

### Proof A's script sits before the `<meta>` tag; Proof B's sits after, in the same document

**(b) Forced by an external contract.** A `<meta>` CSP is discovered by the
HTML parser as it reaches that tag — the spec does not apply it
retroactively to content already parsed before that point. This isn't a
convention we chose; it's a direct, spec-mandated consequence of `<meta>`
being an in-document element the parser encounters mid-stream, unlike an
HTTP header, which the browser has in hand before parsing begins at all
(see [prerequisites/01_http_headers_and_origins.html#http-request-response](../../prerequisites/01_http_headers_and_origins.html#http-request-response)).
We verified this rather than assuming it — Proof A's script really does run.

### `frame-ancestors` is included in the meta policy's `content` attribute even though we expected it to be ignored

**(c) Our own convention**, chosen specifically to produce the browser's own
warning rather than just describe the restriction in prose. Real captured
console output: *"The Content Security Policy directive 'frame-ancestors'
is ignored when delivered via a `<meta>` element."* The spec explicitly
excludes `frame-ancestors`, `report-uri`/`report-to`, and `sandbox` from
`<meta>`-deliverable CSP — we picked `frame-ancestors` as the one to
demonstrate because Module 12 covers it in depth next, making this a
concrete preview of a real limitation you'll want to remember there.

### Proof D lives on a separate page (`report-only-attempt.html`), not folded into `index.html`

**(c) Our own convention.** `index.html` already has an enforcing `<meta>`
CSP active; testing whether `Content-Security-Policy-Report-Only` works as
`<meta>` on the *same* page would conflate two different policies'
behavior. A dedicated page with only the Report-Only attempt keeps the
result unambiguous.

### Proof D waits 500ms before concluding "no violation event fired"

**(c) Our own convention**, and an honest hedge: violation events fire
synchronously in every case we've tested in this course, so the delay
wasn't strictly necessary here — but asserting a *negative* ("this never
happens") from a single synchronous check felt like the wrong rigor level
for this specific claim, given how much of this module rests on it. The
real captured browser console message settles it definitively anyway:
*"The report-only Content Security Policy 'script-src 'self'' was delivered
via a `<meta>` element, which is disallowed. The policy has been ignored."*
The browser doesn't merely fail to enforce it — it explicitly refuses to
even register it as an active policy.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| No header CSP anywhere in this module | (c) convention | Isolates `<meta>` behavior completely |
| Scripts placed before/after the meta tag | (b) spec | Parser discovers `<meta>` mid-document; can't apply retroactively |
| `frame-ancestors` included on purpose | (c) convention | Produces the browser's real warning instead of asserting the limitation |
| Proof D on its own page | (c) convention | Avoids conflating two different meta policies' effects |
| 500ms wait before concluding "no event" | (c) convention | Appropriate rigor for a negative claim, even though sync behavior made it moot here |

## What We Proved

Real page, real `<meta>` tags, zero header CSP, real captured browser output:
```
Proof A — script before <meta>:  ALLOWED  ("ran — this inline script
                                  executed BEFORE the <meta> CSP tag was
                                  parsed")
Proof B — script after <meta>:   BLOCKED  ("(has not run yet)" — never ran)
Proof C — frame-ancestors in     Browser console, verbatim: "The Content
          meta, real console               Security Policy directive
          warning captured:                'frame-ancestors' is ignored
                                            when delivered via a <meta>
                                            element."
Proof D — meta Report-Only,      Browser console, verbatim: "The
          real console warning             report-only Content Security
          captured:                        Policy 'script-src 'self'' was
                                            delivered via a <meta> element,
                                            which is disallowed. The policy
                                            has been ignored." Zero
                                            violation events fired.
```
This proves `<meta>` CSP is not a drop-in substitute for the header: it has
a real parse-order blind spot (Proof A/B), it silently drops three whole
directive categories (Proof C — and the browser is at least honest about it
in the console), and it doesn't support report-only mode at all (Proof D).
`<meta>` is a fallback for contexts with no control over HTTP response
headers (some static hosts, some CMSes) — not an equivalent delivery
mechanism.
