# Module 13 — form-action + base-uri Lockdown: Decisions

### The form auto-submits via `requestSubmit()` on page load, not from a user click

**(c) Our own convention**, for the same reason established in Module 3's
DECISIONS.md: a result that depends on real click delivery is harder to
verify reliably in this course's testing environment, and genuine page
script calling `requestSubmit()` is subject to CSP identically to a real
click — it's real page-script-initiated form submission either way, so
nothing about the proof's validity is weakened by automating it.

### `form-open`'s exploit target is a real second server (`/receive`), and we verify by reading the RESULTING page after navigation

**(c) Our own convention**, chosen to make the consequence concrete instead
of inferred: rather than just checking "did a network request fire," we
followed the entire real consequence through — the browser actually
navigates away from the victim page entirely, landing on
attacker-controlled content, with the submitted data visible in the URL.
Verified directly: after visiting `/form-open`, the tab's real URL becomes
`http://localhost:6901/receive?amount=1000` and its content is the
attacker's own page.

### `base-open`/`base-protected` inject the SAME `<base>` tag directly in server-rendered HTML, not via a separate injection bug

**(c) Our own convention.** A real `<base>`-tag attack usually arrives via
some other injection vulnerability (the same shape as Module 11's unescaped
reflection) — we skipped rebuilding that delivery mechanism a second time
and injected the tag directly in the template, since this module's subject
is specifically "what does `base-uri` do once an attacker-controlled
`<base>` tag exists on the page," not "how did it get there."

### Proof relies on `document.baseURI` and the actual origin that received the relative image request, not just the console message

**(c) Our own convention**, and it surfaced a genuinely interesting, precise
result: when `base-uri 'self'` blocks the injected tag,
`document.baseURI` doesn't just revert to the origin — it reverts to the
document's own full URL, including path (`http://localhost:6900/base-protected`,
not merely `http://localhost:6900/`). We verified this exact value rather
than assuming "falls back to origin" — the real fallback is "falls back to
the document's own address," which happens to include origin as a prefix
but is not the same claim.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| Auto-submit via `requestSubmit()` | (c) convention | Genuine page script, avoids click-delivery reliability issues |
| Verify by following the real resulting navigation | (c) convention | Confirms the full real consequence, not just a network log line |
| `<base>` tag injected directly, not via a second injection bug | (c) convention | Keeps focus on `base-uri`'s effect, not injection delivery (already covered, Module 11) |
| Verified `document.baseURI`'s exact fallback value | (c) convention | Precise result differs subtly from "falls back to origin" |

## What We Proved

**form-action** — real form, real cross-origin target, real navigation:
```
/form-open      → tab navigates to http://localhost:6901/receive?amount=1000
                   (attacker's own page, showing "Attacker received your
                   submission — Query string: /receive?amount=1000")
/form-protected → tab stays on http://localhost:6900/form-protected
                   page text: "BLOCKED: form-action"
                   console: "Sending form data to 'http://localhost:6901/receive?amount=1000'
                   violates the following Content Security Policy directive:
                   "form-action 'self'". The request has been blocked."
```

**base-uri** — real injected `<base>` tag, real relative-URL resolution:
```
/base-open      → document.baseURI = "http://localhost:6901/"  (attacker)
                   pixel.png actually requested from http://localhost:6901/pixel.png
/base-protected → document.baseURI = "http://localhost:6900/base-protected"  (own document)
                   pixel.png actually requested from http://localhost:6900/pixel.png
                   console: "Setting the document's base URI to
                   'http://localhost:6901/' violates the following Content
                   Security Policy directive: "base-uri 'self'". The action
                   has been blocked."
```

This closes Track 1: across 13 modules, every mechanism — parsing, header
enforcement, allowlisting by nonce/hash, propagation, multi-policy
combination, delivery method, reporting, and now these two structural
directives — has been built and verified against a real browser, never
assumed from documentation.
