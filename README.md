# trust-boundary

Most CSP material I'd read stopped at "add a header, done." That's not a security control, it's a cargo-cult incantation, and it falls apart the moment someone asks why `strict-dynamic` ignores host allowlists, or why `innerHTML` still executes attacker HTML even under the strictest `script-src` you can write. I built this course to close that gap by constructing the enforcement mechanics myself, from the ground up: a hand-written CSP header parser before I ever trusted the browser's own, real HTTP response headers served from a from-scratch Node server so every block or allow decision is the actual browser enforcing policy and not a simulation, and, in Track 2, a genuine `TrustedHTML`/`TrustedScript` brand-forgery campaign (prototype pollution, constructor reassignment, `setPrototypeOf`) run against the real DOM API to prove, not just assert, that the guard is an internal slot check and not an `instanceof` check.

## The kernel and the applied layer

There's a deliberate split running through this whole course. Content Security Policy is the browser's general-purpose resource-loading firewall. It governs where scripts, styles, and other resources are allowed to come from, and it would be worth knowing even if Trusted Types had never existed. Trusted Types is a single CSP directive, `require-trusted-types-for`, expanded into its own policy, sink, and type system, built specifically to police what shape of value a dangerous DOM sink like `innerHTML`, `eval`, or `script.src` is willing to accept, because CSP's origin-based model has no vocabulary at all for "this HTML structure, assembled at runtime by otherwise-legitimate code, happens to contain an XSS payload." You can't really teach Track 2, or even demonstrate it honestly, without Track 1's directive-parsing and enforcement mechanics already working, so the course is sequenced as one dependency chain, not two independent topics you can shuffle.

## What I actually built, and why

I wrote a hand-rolled CSP header parser (Module 2) that turns a raw `Content-Security-Policy` string into a directive-to-source-list map, and I wrote it before any module was allowed to lean on the browser's own parser, so the mental model of "directive name, space-separated source list, semicolon-delimited" is something you had to build, not something you were handed.

Every enforcement demo runs on a real HTTP server. Every "proves X" claim in the module table below is backed by an actual response header served to an actual Chromium instance and an actual blocked or allowed network request, never a mocked policy object.

Module 11 has a live before-and-after XSS exploit: the identical vulnerable app, unprotected in Module 1 and CSP-protected once Module 3's policy applies, so the defense gets demonstrated against a real payload instead of just described.

Module 23 runs a four-angle forgery campaign against Trusted Types: prototype pollution, global constructor reassignment, `setPrototypeOf` spoofing, and content theft, each one run to completion and shown failing against the real sink guard, with the exact error text explaining why (a native internal slot versus a reachable, spoofable prototype chain).

Module 24 is a production-shaped capstone: a vendored DOMPurify policy that blocks a corpus of 8 real XSS payload shapes end to end while legitimate rich-text HTML survives byte for byte. That's the pattern a team would actually ship, not a toy.

And then there's `lessons/`, the cross-module concept clusters and vocabulary webs. CSP's own module set left several terms genuinely easy to conflate under time pressure. "Policy" alone means three different things depending on whether you're inside a CSP header, a single directive, or a Trusted Types factory call. Those clusters exist because I hit that confusion myself while building this and decided it was worth disambiguating permanently instead of leaving it as a footnote.

## Module table of contents

### Prerequisites
Origins and headers, DOM sinks, CSP vocabulary, and the JS prototype chain. That last one exists specifically because Trusted Types brand-checking in Track 2, Phase 4 is unintelligible without it. See [`prerequisites/index.html`](prerequisites/index.html).

### Track 1, CSP Core Engine

| # | Module | Proves |
|---|---|---|
| 01 | [No-Policy Baseline](track1-csp-core/01_no_policy_baseline) | The browser's default same-origin model places no restriction on inline scripts, remote scripts, or resource loads |
| 02 | [CSP Header Parser](track1-csp-core/02_csp_header_parser) | A raw CSP header string can be deterministically parsed into a directive-to-source-list map. We build the parser |
| 03 | [Directive Enforcement](track1-csp-core/03_directive_enforcement) | `default-src`/`script-src`/`img-src`, sent as real response headers, actually block or allow real loads |
| 04 | [Report-Only Mode](track1-csp-core/04_report_only_mode) | `Content-Security-Policy-Report-Only` observes violations without blocking anything |
| 05 | [Nonce-Based Scripts](track1-csp-core/05_nonce_based_scripts) | A per-response `'nonce-xxx'` source allows one specific inline script while every other inline script stays blocked |
| 06 | [Hash-Based Scripts](track1-csp-core/06_hash_based_scripts) | A `'sha256-...'` source allowlists an inline script by the exact hash of its byte content |
| 07 | [strict-dynamic Propagation](track1-csp-core/07_strict_dynamic) | `'strict-dynamic'` lets a nonce-trusted script load further scripts dynamically, ignoring host allowlists entirely |
| 08 | [Multiple-Policy Intersection](track1-csp-core/08_multi_policy_intersection) | Two simultaneous CSP policies combine by intersection, most restrictive wins, not union |
| 09 | [Meta Tag vs. Header](track1-csp-core/09_meta_vs_header) | `<meta http-equiv="Content-Security-Policy">` enforces a real but restricted subset of what the header can do |
| 10 | [Violation Reporting API](track1-csp-core/10_violation_reporting_api) | Blocked actions fire real `SecurityPolicyViolationEvent`s and POST reports, captured on a tiny collector |
| 11 | [CSP Blocks Reflected XSS](track1-csp-core/11_csp_blocks_reflected_xss) | A working reflected-XSS payload executes against the Module 1 baseline and is blocked once Module 3's policy applies, same app, before and after |
| 12 | [frame-ancestors Clickjacking Defense](track1-csp-core/12_frame_ancestors_clickjacking) | `frame-ancestors` stops the page from being iframed by an attacker page, where `X-Frame-Options` alone is more limited |
| 13 | [form-action + base-uri Lockdown](track1-csp-core/13_form_action_base_uri) | `form-action` blocks cross-origin form submission and `base-uri` blocks `<base>`-tag hijacking of relative URLs |

### Track 2, Trusted Types Applied Layer

| # | Module | Proves |
|---|---|---|
| 14 | [DOM-XSS Sink Baseline](track2-trusted-types/14_dom_xss_sink_baseline) | `innerHTML` accepts a raw attacker string unconditionally even under the strictest `script-src`. CSP has zero jurisdiction over non-executing HTML structure |
| 15 | [`require-trusted-types-for` Directive](track2-trusted-types/15_require_trusted_types_directive) | Adding this one directive makes guarded sinks throw a `TypeError` on raw-string writes instead of executing them |
| 16 | [Policy Factory](track2-trusted-types/16_policy_factory) | `trustedTypes.createPolicy(name, rules)` returns a callable object whose methods produce branded values |
| 17 | [The `"default"` Policy](track2-trusted-types/17_default_policy) | A policy literally named `"default"` gets invoked automatically for legacy code that still assigns raw strings to a guarded sink |
| 18 | [HTML Sink Guard](track2-trusted-types/18_html_sink_guard) | A real `TrustedHTML` value is accepted by `innerHTML`, while an identical-looking plain string or object literal gets rejected |
| 19 | [Script Sink Guard](track2-trusted-types/19_script_sink_guard) | `TrustedScript`/`TrustedScriptURL` gate `eval` and `script.src` solidly, with real, verified gaps found in `Function()` and `.text`-triggered execution |
| 20 | [Policy-Name Allowlist](track2-trusted-types/20_policy_name_allowlist) | The `trusted-types` directive restricts which policy names `createPolicy` may create, blocking a second untrusted policy |
| 21 | [Trusted Types Violation Reporting](track2-trusted-types/21_violation_reporting) | Policy-creation and sink-assignment violations surface through the same Reporting API pipeline as ordinary CSP violations |
| 22 | [Brand Check via `instanceof`](track2-trusted-types/22_brand_check_instanceof) | `instanceof TrustedHTML` is genuinely spoofable, but the real sink guard rejects the spoofed object anyway. The guard is not an `instanceof` check |
| 23 | [Forged-Object Defense](track2-trusted-types/23_forged_object_defense) | Four independent forgery angles all fail the sink's real check, with the internal-slot-vs-prototype-chain explanation for why |
| 24 | [Real-World Sanitizer Capstone](track2-trusted-types/24_sanitizer_capstone) | A vendored DOMPurify-backed policy blocks 8 real XSS payload shapes, 0 of 8 executed, while legitimate rich-text HTML survives byte for byte |

### Cross-cutting material
- [`lessons/`](lessons): three concept clusters (CSP allowlisting strategies, CSP and Trusted Types layering, Trusted Types and prototypal inheritance) plus two vocabulary webs for terms I found genuinely easy to conflate while building this: the "Policy" overloading, and the Trusted Types directive family.
- [`GLOSSARY.md`](GLOSSARY.md): every term, file, and constant introduced anywhere in the course, alphabetical, append-only, each entry tagged with its first appearance.
- [`ROADMAP.md`](ROADMAP.md): the authoritative module map, phase breakdown, and recommended stopping points depending on your goal.

## Tech stack

Plain HTML, CSS, and vanilla JS for every demo page, no framework, no build step. A minimal Node.js static and header server, written once in Modules 2 and 3 and reused everywhere after, chosen specifically because it's the simplest way to set arbitrary real HTTP response headers per route and watch genuine browser enforcement happen. Track 2 needs a Chromium-based browser (Chrome or Edge), since Firefox and Safari don't natively implement the Trusted Types API. Track 1's CSP work runs fine in any modern browser. DOMPurify 3.4.13 is vendored, not pulled from a CDN, and used only in the Module 24 capstone, so every other module stays dependency-free and the mechanism under study never gets obscured by a library doing the work for you.

## Where this stands

Done. All 24 modules across both tracks are built, run against real servers, verified in a real browser, and documented with source, `DECISIONS.md`, and `tutorial.html` per module. The Phase 3 concept clusters and Phase 4 vocabulary webs are complete too.

Deliberately out of scope: Firefox/Safari Trusted Types polyfills, a production-grade violation-report collector or aggregator, framework-specific Trusted Types integration for React or Angular, CSP in non-HTML contexts, and non-Chromium reporting-API differences.

## How to explore this repo

Start at [`prerequisites/index.html`](prerequisites/index.html) if origins, headers, DOM sinks, or the JS prototype chain aren't already solid for you. Track 2 leans hard on that last one.

Work Track 1 in order. Each module directory has its own `tutorial.html` (the lesson) and `DECISIONS.md` (why it's built the way it is). Most modules run through the shared Node server, check the module's own README or `DECISIONS.md` for its exact run command.

Move to Track 2 once Track 1 modules 1 and 3 are solid. See the dependency notes in [`ROADMAP.md`](ROADMAP.md), since several Track 2 modules depend on specific Track 1 modules, not just "Track 1 in general."

Use `GLOSSARY.md` as a running reference. Every term is tagged with the module it first appears in, so you can trace any concept back to its introduction.

If all you actually need is a working answer to "how do I ship a sane CSP header" or "how do I ship `require-trusted-types-for` in production," `ROADMAP.md` has a table of recommended stopping points well short of all 24 modules.
