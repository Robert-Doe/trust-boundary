# ROADMAP — Everything CSP + Trusted Types (and its debt to Prototypal Inheritance)

Status: **DRAFT — awaiting approval before Phase 1 (Prerequisites) or any module code begins.**

## Why two tracks

Content Security Policy is the browser's *general-purpose* resource-loading firewall — it
exists independently of Trusted Types and would still be worth knowing even if Trusted Types
never shipped. Trusted Types is a *specific application built on top of one CSP directive*
(`require-trusted-types-for`) that closes the one class of injection CSP's `script-src` cannot
fully close: DOM-XSS via sinks like `innerHTML`. That's a real kernel/applied-layer split —
Track 2 cannot be taught (or even meaningfully demonstrated) without Track 1's directive-parsing
and enforcement mechanics already working. So:

- **Track 1 — CSP Core Engine**: the browser's policy parser/enforcer, standalone.
- **Track 2 — Trusted Types Applied Layer**: one CSP directive, expanded into its own
  policy/sink/type system, plus the JS-engine mechanics (prototype identity, `instanceof`
  branding) that make it *unforgeable* — which is where the "relates to Prototypal
  Inheritance" part of your ask lives.

---

## TRACK 1 — CSP Core Engine

### Phase 1: Bare Metal Foundation

| # | Module name | What it proves | Directory | Status |
|---|---|---|---|---|
| 1 | No-Policy Baseline | Proves the browser's default same-origin execution model places no restriction on inline scripts, remote scripts, or resource loads | `track1-csp-core/01_no_policy_baseline` | ✅ Done |
| 2 | CSP Header Parser | Proves a raw `Content-Security-Policy` header string can be deterministically parsed into a directive→source-list map (we build the parser) | `track1-csp-core/02_csp_header_parser` | ✅ Done |
| 3 | Directive Enforcement | Proves `default-src`/`script-src`/`img-src` sent as real response headers actually block/allow real loads in a real browser, not just in our parser | `track1-csp-core/03_directive_enforcement` | ✅ Done |
| 4 | Report-Only Mode | Proves `Content-Security-Policy-Report-Only` observes violations without blocking anything | `track1-csp-core/04_report_only_mode` | ✅ Done |
| 5 | Nonce-Based Scripts | Proves a per-response `'nonce-xxx'` source allows one specific inline `<script>` while every other inline script stays blocked | `track1-csp-core/05_nonce_based_scripts` | ✅ Done |
| 6 | Hash-Based Scripts | Proves a `'sha256-...'` source allowlists an inline script by the exact hash of its byte content | `track1-csp-core/06_hash_based_scripts` | ✅ Done |
| 7 | strict-dynamic Propagation | Proves `'strict-dynamic'` lets a nonce-trusted script load further scripts dynamically, while ignoring host allowlists entirely | `track1-csp-core/07_strict_dynamic` | ✅ Done |
| 8 | Multiple-Policy Intersection | Proves two simultaneous CSP headers/policies combine by intersection (most restrictive wins), not union | `track1-csp-core/08_multi_policy_intersection` | ✅ Done |

### Phase 2: CSP Defense in Depth

| # | Module name | What it proves | Directory | Status |
|---|---|---|---|---|
| 9 | Meta Tag vs. Header | Proves `<meta http-equiv="Content-Security-Policy">` enforces a real (but restricted) subset of what the HTTP header can do | `track1-csp-core/09_meta_vs_header` | ✅ Done |
| 10 | Violation Reporting API | Proves blocked actions fire real `SecurityPolicyViolationEvent`s / POST reports we can capture on a tiny collector endpoint | `track1-csp-core/10_violation_reporting_api` | ✅ Done |
| 11 | CSP Blocks Reflected XSS | Proves a working reflected-XSS payload executes against Module 1's baseline and is blocked once Module 3's policy is applied — same app, before/after | `track1-csp-core/11_csp_blocks_reflected_xss` | ✅ Done |
| 12 | frame-ancestors Clickjacking Defense | Proves `frame-ancestors` stops our page from being iframed by an attacker page, where `X-Frame-Options` alone would be more limited | `track1-csp-core/12_frame_ancestors_clickjacking` | ✅ Done |
| 13 | form-action + base-uri Lockdown | Proves `form-action` blocks form submission to attacker origins and `base-uri` blocks a `<base>`-tag injection from hijacking relative URLs | `track1-csp-core/13_form_action_base_uri` | ✅ Done |

---

## TRACK 2 — Trusted Types Applied Layer

### Phase 3: Trusted Types Foundations

| # | Module name | What it proves | Directory | Depends on (Track 1 / Prereq) | Status |
|---|---|---|---|---|---|
| 14 | DOM-XSS Sink Baseline | Proves `innerHTML` accepts a raw attacker string unconditionally even under the strictest `script-src` — CSP blocks the executable parts of a payload but has zero jurisdiction over non-executing HTML structure | `track2-trusted-types/14_dom_xss_sink_baseline` | T1-01, T1-11 | ✅ Done |
| 15 | `require-trusted-types-for` Directive | Proves adding this one CSP directive makes the browser throw a `TypeError` on raw-string sink writes instead of executing them | `track2-trusted-types/15_require_trusted_types_directive` | T1-03 | ✅ Done |
| 16 | Policy Factory | Proves `trustedTypes.createPolicy(name, rules)` returns a callable object whose `createHTML`/`createScript`/`createScriptURL` methods produce branded values | `track2-trusted-types/16_policy_factory` | Prereq: prototype-chain, T1-03 | ✅ Done |
| 17 | The `"default"` Policy | Proves a policy literally named `"default"` is invoked automatically for legacy code that still assigns raw strings to a guarded sink | `track2-trusted-types/17_default_policy` | #16 | ✅ Done |
| 18 | HTML Sink Guard | Proves a `TrustedHTML` value from `createHTML()` is accepted by `innerHTML`, while an identical-looking plain string or object literal is rejected | `track2-trusted-types/18_html_sink_guard` | #16, #14 | ✅ Done |
| 19 | Script Sink Guard | Proves `TrustedScript`/`TrustedScriptURL` gate `eval` and `script.src` solidly, while finding real, verified gaps in `Function()` and `.text`-triggered execution — not all sinks in the family behave identically | `track2-trusted-types/19_script_sink_guard` | #16 | ✅ Done |
| 20 | Policy-Name Allowlist | Proves the `trusted-types` CSP directive restricts *which policy names* `createPolicy` is allowed to create, blocking a second untrusted policy | `track2-trusted-types/20_policy_name_allowlist` | T1-03, #16 | ✅ Done |
| 21 | Trusted Types Violation Reporting | Proves policy-creation and sink-assignment violations surface through the same Reporting API pipeline as ordinary CSP violations | `track2-trusted-types/21_violation_reporting` | T1-10 | ✅ Done |

### Phase 4: Trusted Types Meets Prototypes

| # | Module name | What it proves | Directory | Depends on (Track 1 / Prereq) | Status |
|---|---|---|---|---|---|
| 22 | Brand Check via `instanceof` | Proves `instanceof TrustedHTML` is genuinely spoofable via `Object.create`, but the real sink guard rejects the spoofed object anyway (different error, no internal slot) — the guard is NOT an `instanceof` check | `track2-trusted-types/22_brand_check_instanceof` | Prereq: prototype-chain, #16 | ✅ Done |
| 23 | Forged-Object Defense | Proves four independent forgery angles (Object.prototype pollution, reassigning the global TrustedHTML constructor, setPrototypeOf, stealing real content) all fail the sink's real check, and explains precisely why (native internal slot vs. reachable prototype) | `track2-trusted-types/23_forged_object_defense` | #22 | ✅ Done |
| 24 | Real-World Sanitizer Capstone | Proves a real, vendored DOMPurify-backed policy blocks a corpus of 8 real XSS payload shapes (0/8 executed) while legitimate rich-text HTML survives byte-for-byte — the shippable pattern | `track2-trusted-types/24_sanitizer_capstone` | #18, #19 | ✅ Done |

**24 modules total** (13 in Track 1, 11 in Track 2).

---

## Recommended Stopping Points

| Your goal | Stop after |
|---|---|
| "I just need to add a sane CSP header to my site" | Module 8 (`strict_dynamic`) |
| "I need to understand CSP well enough to defend against XSS/clickjacking in a review" | Module 13 (end of Track 1) |
| "I need to ship `require-trusted-types-for` in production" | Module 21 (end of Track 2 Phase 3) |
| "I want the full mental model, including why Trusted Types can't be faked by prototype tricks" | Module 24 (full course) |

---

## Tools / Architecture Target

- **Runtime for demos:** a minimal Node.js (no framework) static/header server we write once in
  Module 2/3 and reuse — chosen because it's the simplest way to set arbitrary real HTTP response
  headers per route and observe real browser enforcement, not simulated enforcement.
- **Browser:** Chromium-based (Chrome or Edge) required for Trusted Types (Track 2) — Firefox/
  Safari do not implement the Trusted Types API natively as of this writing; Track 1 (CSP) works
  in any modern browser. This is called out explicitly as a platform constraint in the
  Prerequisites layer, not silently assumed.
- **Sanitizer:** DOMPurify, vendored (not CDN) for the Module 24 capstone only — every other
  module uses zero dependencies so the mechanism under study is never obscured by a library.
- **Language:** plain HTML/CSS/vanilla JS + Node for the server. No build step, no framework.
- **Explicitly out of scope:** Firefox/Safari Trusted Types polyfills; a production-grade
  violation-report collector/aggregator (we show raw captured reports on a throwaway endpoint,
  not a real ingestion pipeline); framework-specific TT integration (React/Angular's built-in
  Trusted Types support); CSP in non-HTML contexts (browser extensions, PDF viewers); non-Chromium
  reporting-API differences.

---

## Course Status: Complete

All 24 modules across both tracks are built, run against real servers, verified in a real
browser, and documented (source + `DECISIONS.md` + `tutorial.html` each). Phase 3 and Phase 4
are also complete:

**Phase 3 — Cross-Module Concept Clusters** (see [lessons/README.md](lessons/README.md)):

| Cluster | Relates to |
|---|---|
| [CSP Allowlisting Strategies](lessons/01_csp_allowlisting_strategies/01_explainer.html) | Modules 5, 6, 7 |
| [CSP and Trusted Types Layering](lessons/02_csp_trusted_types_layering/01_explainer.html) | Modules 3, 14, 15, 18, 24 |
| [Trusted Types and Prototypal Inheritance](lessons/03_trusted_types_and_prototypes/01_explainer.html) | Prereq 4, Modules 16, 22, 23 |

**Phase 4 — Vocabulary Webs** (for terms this course's own modules found genuinely easy to conflate):

| Web | Terms disambiguated | Location |
|---|---|---|
| "Policy" overloading | CSP Policy, Directive, Trusted Types Policy, Rule | [track2-trusted-types/16_policy_factory/concept_how_they_connect.html](track2-trusted-types/16_policy_factory/concept_how_they_connect.html) |
| Trusted Types Directive Family | `require-trusted-types-for`, `trusted-types`, `window.trustedTypes`, `TrustedHTML`/`TrustedScript`/`TrustedScriptURL` | [track2-trusted-types/20_policy_name_allowlist/concept_how_they_connect.html](track2-trusted-types/20_policy_name_allowlist/concept_how_they_connect.html) |
