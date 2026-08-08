# Module 24 — Real-World Sanitizer Capstone: Decisions

### DOMPurify is installed via `npm install dompurify` and vendored, not loaded from a CDN

**(b) Forced by an external contract**, matching the Roadmap's Tools/
Architecture Target: no CDN dependency anywhere in this course. We used
`npm` only to obtain a real, official, unmodified build (3.4.13,
`dist/purify.min.js`, license header intact) — `node_modules` was deleted
immediately after copying the one file out; `package.json` records the
exact version as provenance, but nothing in this module depends on `npm`
being available at run time.

### The `trusted-types` directive allowlists BOTH `dompurify` and `dompurify-policy` — discovered empirically, not assumed

**(a) Forced by an external contract — a real, undocumented-until-tested
requirement.** Our first draft allowlisted only our own policy name,
`dompurify-policy`. Running it produced a real console error: *"Creating a
TrustedTypePolicy named 'dompurify' violates the following Content
Security Policy directive... The action has been blocked"* followed by
*"TrustedTypes policy dompurify could not be created."* **DOMPurify itself
auto-detects Trusted Types support and tries to create its OWN internal
policy, literally named `"dompurify"`, for its own internal DOM
operations** — separate from whatever policy the calling code creates.
Without that name also allowlisted, `DOMPurify.sanitize()` silently
degraded (returning `""` for everything) rather than throwing outright.
This is real, current DOMPurify behavior that anyone integrating it with
Trusted Types needs to know, and we only know it because we hit it.

### The results table is built with `createElement`/`textContent`, never `innerHTML` — even though its content is never attacker-controlled

**(a) Forced by the platform — the second real bug this module's own
development caught.** Our first draft built the results table by
concatenating a plain HTML string and assigning it to `table.innerHTML`
directly. That's `require-trusted-types-for`'s exact Module 15 failure
mode, applied to OUR OWN UI code — the directive guards every `innerHTML`
write, including ones that have nothing to do with sanitizing untrusted
input. The real captured error: `TypeError: ... This document requires
'TrustedHTML' assignment`, thrown from our own table-building line, which
(because it lacked a try/catch at the time) silently aborted the entire
rest of the page's script. The fix is the textbook-correct pattern for
this exact situation: trusted, developer-authored UI markup that never
touches untrusted data doesn't need a sanitizing policy at all — it needs
to avoid the HTML-parsing sink entirely, via safe DOM construction.

### Every payload in the corpus is processed inside its own `try`/`catch`, and the legitimate-content proof is wrapped separately too

**(c) Our own convention — adopted specifically because omitting it was
this module's third real bug.** Without per-item error handling, the
`Array.prototype.map` call would abort entirely on its first exception,
silently preventing every later proof on the page (the marker check, the
legitimate-content check) from ever running, with no visible sign of
what failed. Every module since 15 has used this defensive pattern for
exactly this reason; this module needed to relearn why the hard way when
we skipped it in a first draft.

### The corpus includes a CSS `url(javascript:...)` payload that DOMPurify passes through UNCHANGED

**(a) Forced by the platform — reported honestly, not hidden.** Every
other payload in the corpus was neutralized by DOMPurify itself, verified
by inspecting its actual output. This one wasn't: DOMPurify's default
configuration left
`<div style="background:url(javascript:...)">` completely untouched.
`window.__xssFired` still stayed `false` overall — but that's because
modern browsers no longer execute `javascript:` URLs referenced from CSS
`url()` at all (a long-dead attack vector, not a DOMPurify feature). We
kept this payload in the corpus specifically so the result table shows
this honestly: the harmlessness here comes from browser-level
obsolescence of the vector, not from the sanitizer actively defending
against it. Presenting it as "DOMPurify caught this one too" would have
been a fabricated claim.

### `policy.createHTML` calls `DOMPurify.sanitize(input, { RETURN_TRUSTED_TYPE: false })` and lets OUR policy do the TrustedHTML wrapping, rather than letting DOMPurify return a TrustedHTML directly

**(c) Our own convention.** DOMPurify can return a `TrustedHTML` value
itself when Trusted Types is detected and `RETURN_TRUSTED_TYPE` isn't set
to `false`. We chose to keep our OWN named policy (`dompurify-policy`) as
the single, explicit, auditable point where a string becomes a
`TrustedHTML` in our code — consistent with the pattern established since
Module 16, and clearer about which policy is actually authorizing what,
rather than relying on a library's own internal policy to do it invisibly.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| DOMPurify via npm, vendored, `node_modules` deleted | (b) architecture target | Real, official build; no CDN; no runtime npm dependency |
| Allowlist BOTH `dompurify` and `dompurify-policy` | (a) platform, empirical | DOMPurify auto-creates its own internal policy under a fixed name |
| Results table built via safe DOM APIs, not `innerHTML` | (a) platform, empirical | Our own UI code is ALSO subject to the guard — a real bug we hit |
| Per-item try/catch throughout | (c) convention, re-learned the hard way | One failure must not silently abort every later proof |
| CSS `url(javascript:...)` payload kept, result reported honestly | (a) platform, empirical | Its harmlessness is browser-level, not sanitizer-level — don't overclaim |
| Our own policy wraps DOMPurify's plain-string output | (c) convention | One consistent, explicit, auditable trust boundary, matching Module 16 |

## What We Proved

Real, unmodified DOMPurify 3.4.13, real policy, real corpus, real captured
output:
```
script tag:                <script>...</script>              → (empty)
img onerror:                <img onerror="...">                → <img src="x">  (attribute stripped)
svg onload:                  <svg onload="...">                 → <svg></svg>
anchor javascript: URL:      <a href="javascript:...">           → <a>click me</a>  (href stripped)
iframe javascript: URL:      <iframe src="javascript:...">        → (empty)
body onload fragment:        <body onload="...">text</body>       → text  (tag+attribute stripped)
CSS javascript: URL:         <div style="url(javascript:...)">     → UNCHANGED (harmless: obsolete browser vector, not sanitizer-caught)
encoded re-injection:        "><script>...</script>               → "&gt;  (escaped, inert)

window.__xssFired after all 8 payloads: false — NONE executed

Legitimate rich text: sanitized output === original, byte for byte
  (bold, italic, real link, and a list all fully preserved)
```
This is the complete, shippable pattern this entire track has been
building toward: a real sanitizer, wrapped in an explicit Trusted Types
policy, defeating a real corpus of XSS payload shapes while leaving
legitimate rich-text content completely untouched — verified end to end,
including the two real integration bugs (DOMPurify's own internal policy
name; our own UI code needing to respect the same guard) that a
first-time integrator would very plausibly hit exactly as we did.
