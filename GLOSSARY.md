# Glossary

Every term, file, and constant introduced anywhere in this course, alphabetical.
Each entry is tagged with where it first appears. **This file is only ever
appended/inserted into — never rewritten from scratch.**

---

### Directive
A single named rule inside a CSP policy, e.g. `script-src` or `frame-ancestors`.
A policy is a semicolon-separated list of directives. Each directive has a name
and a space-separated list of source expressions.
*First seen: Prerequisites (03_csp_vocabulary).*

### DOMPurify
A real, independently-maintained, third-party HTML sanitization library
(vendored in this course, version 3.4.13, via npm — never a CDN). Used in
Module 24 as the real transformation backing a Trusted Types policy's
`createHTML` rule. Auto-detects Trusted Types support and creates its own
internal policy named exactly `"dompurify"` for its internal DOM
operations — a name that must be separately allowlisted alongside whatever
name the calling application's own policy uses.
*First seen: Module 24 (24_sanitizer_capstone).*

### frame-ancestors
A structural (non-resource-loading) CSP directive that restricts which
origins are allowed to embed the current page in a frame/iframe/object.
`'none'` blocks all framing; `'self'` allows same-origin framing only;
specific origins can be allowlisted. Enforced by the EMBEDDING browser after
it receives the framed page's response — a real, successful HTTP
transaction followed by a client-side render refusal
(`net::ERR_BLOCKED_BY_RESPONSE`), not a network-level connection block.
Notably: silently ignored when delivered via `<meta>` (see "Meta Tag vs.
Header" pattern, Module 9).
*First seen: Module 12 (12_frame_ancestors_clickjacking).*

### base-uri
A structural CSP directive restricting what values a `<base href="...">`
element is allowed to set as the document's base URI (the default a
relative URL resolves against). Blocking an unauthorized `<base>` tag makes
`document.baseURI` fall back to the document's own real URL — not to some
other default — closing an attack where a single injected tag silently
redirects every relative reference on the page at once.
*First seen: Module 13 (13_form_action_base_uri).*

### form-action
A structural CSP directive restricting which origins a `<form>` element on
the page is allowed to submit to, checked at submission time regardless of
what the form's `action` attribute says. Complements — but is enforced
completely independently of — `script-src`/`frame-ancestors`.
*First seen: Module 13 (13_form_action_base_uri).*

### require-trusted-types-for
A CSP directive, value always `'script'`, that turns on Trusted Types
enforcement for every guarded sink at once (HTML sinks like `innerHTML`;
Script sinks like `eval`; ScriptURL sinks like `script.src`). With this
directive present and zero policies defined, every guarded sink throws on
any plain-string assignment, regardless of content — verified: a
dangerous payload and a completely harmless one produce byte-for-byte
identical error text, proving the check happens before the browser forms
any opinion about what the string contains.
*First seen: Module 15 (15_require_trusted_types_directive).*

### TrustedHTML
The branded object type a Trusted-Types-guarded HTML sink (`innerHTML`,
`outerHTML`, `insertAdjacentHTML`, `document.write`) will accept in place
of a plain string, once `require-trusted-types-for 'script'` is active. A
sink throws `TypeError: ... This document requires 'TrustedHTML'
assignment` for any value that isn't one — see Module 22 for how the
browser actually recognizes a real one.
*First seen: Module 15 (15_require_trusted_types_directive).*

### Hash source (CSP)
A source expression of the form `'sha256-<base64>'` (also `sha384`/`sha512`)
that allowlists an inline `<script>`/`<style>` element by the cryptographic
hash of its exact text content — no server-side randomness involved, and
deterministic: the same content always produces the same hash. Contrast with
"Nonce (CSP)" (above), which is a per-response secret rather than a content
derivation. Breaks on any byte-level change, including whitespace.
*First seen: Module 6 (06_hash_based_scripts).*

### Illegal invocation
The error text (`TypeError: ... Illegal invocation`) browsers use when a
native method or property setter is called on an object that lacks the
internal state ("brand"/internal slot) it requires — a generic signal for
"wrong receiver type," not specific to Trusted Types. Verified, real
evidence that a Trusted-Types-guarded sink's actual check is not
`instanceof`: a value that legitimately passes `instanceof TrustedHTML`
(via `Object.create(TrustedHTML.prototype)`) still produces THIS error,
distinct from the ordinary "This document requires 'TrustedHTML'
assignment" rejection a plain string produces.
*First seen: Module 22 (22_brand_check_instanceof).*

### Internal slot
Spec-defined state that exists on an object but is not exposed as an
ordinary, enumerable JS property — invisible to `Object.keys`,
`Object.getOwnPropertyNames`, spreading, or `JSON.stringify`; only
specific, spec-defined operations can read it. Verified: a real
`TrustedHTML` value has zero own enumerable properties
(`Object.getOwnPropertyNames` returns `[]`) — its actual wrapped string
lives in an internal slot, which is exactly why copying an object's own
properties cannot forge one. See "instanceof" (below) for the JS-level
check this is deliberately NOT equivalent to.
*First seen: Module 22 (22_brand_check_instanceof).*

### instanceof
A JS operator, `a instanceof B`, that walks `a`'s prototype chain looking for
`B.prototype`. Returns `true` the moment it finds it, `false` if it reaches
`null` first. This is the exact mechanism the browser uses internally to
recognize a real `TrustedHTML`/`TrustedScript` value.
*First seen: Prerequisites (04_js_prototype_chain).*

### Nonce (CSP)
A random, unpredictable, per-response value the server generates and places
both in the CSP header (`'nonce-<value>'`) and as an attribute
(`nonce="<value>"`) on the specific inline `<script>`/`<style>` tags it wants
to allow. Only an exact string match between the two is accepted; a missing
or incorrect nonce attribute is blocked identically. Must never be reused across responses. Not to be confused with "Origin"
(above) — unrelated concepts that share no mechanism, easy to conflate by
name alone under time pressure.
*First seen: Module 5 (05_nonce_based_scripts).*

### 'strict-dynamic'
A `script-src` keyword that changes two rules at once: (1) every host- and
scheme-based source expression in the directive, including `'self'`, is
ignored entirely for parser-inserted scripts; (2) a script already trusted
via nonce or hash can insert further scripts via non-parser-inserted DOM
APIs (`createElement`+`appendChild`, not `innerHTML`), and those inserted
scripts inherit the same trust with no nonce/hash of their own needed. Lets
one trusted entry-point script load a runtime-determined set of further
scripts.
*First seen: Module 7 (07_strict_dynamic).*

### trusted-types (CSP directive)
A CSP directive naming exactly which policy names `trustedTypes.createPolicy`
is allowed to create, independent of `require-trusted-types-for`. A name
not on the list throws `Policy "<name>" disallowed`; reusing an allowed
name a second time throws a separately-worded `already exists` error unless
the special keyword `'allow-duplicates'` is also present. `'none'` blocks
policy creation entirely.
*First seen: Module 20 (20_policy_name_allowlist).*

### Policy (Trusted Types)
An object returned by `trustedTypes.createPolicy(name, rules)`, exposing
`createHTML`/`createScript`/`createScriptURL` as callable methods —
all three always exist regardless of which rules were supplied; calling one
with no corresponding rule throws a named error rather than silently doing
nothing. Calling a defined method invokes the caller's own rule function
and wraps its return value in the matching branded type (e.g.
`TrustedHTML`). Not to be confused with "Policy (CSP)" (below) — same word,
unrelated mechanism.
*First seen: Module 16 (16_policy_factory).*

### Origin
The triple `(scheme, host, port)` that the browser uses as its unit of trust —
`https://example.com:443` and `http://example.com:443` are different origins
because the scheme differs. CSP source expressions are matched against origins,
not full URLs.
*First seen: Prerequisites (01_http_headers_and_origins).*

### originalPolicy
A field on `SecurityPolicyViolationEvent` reporting the exact policy string
that caused a given violation. Only meaningful once more than one policy can
be active on a page at once — see "Policy intersection" (below) — since
without it there'd be no ambiguity about which policy did the blocking.
*First seen: Module 8 (08_multi_policy_intersection).*

### Policy intersection
The rule governing what happens when a page has more than one active CSP
(two `Content-Security-Policy` header lines, or a header plus a `<meta>`
policy): each policy is enforced completely independently, in full, and a
load is only permitted if every single active policy would have allowed it.
Not to be confused with "duplicate directive" resolution (see "Directive"),
which resolves multiple same-named directives *within one policy string*
before this step ever happens.
*First seen: Module 8 (08_multi_policy_intersection).*

### Policy (CSP)
The full value of a `Content-Security-Policy` header: an ordered set of
directives that together describe what a page is allowed to load and execute.
*First seen: Prerequisites (03_csp_vocabulary).*

### Prototype pollution
An attack pattern where code adds or overwrites a property directly on
`Object.prototype` (or another widely-shared prototype), causing that
property to appear on every object that inherits from it — a real,
well-documented JS vulnerability class for code that trusts property
presence or `instanceof` checks. Verified NOT to help forge a Trusted
Types value: a polluted `Object.prototype` still leaves a plain object
rejected by a guarded sink, because the sink's real check never consults
the prototype chain in the first place.
*First seen: Module 23 (23_forged_object_defense).*

### Prototype chain
The linked list of objects JS walks when you read a property that isn't found
directly on an object: `obj → obj.__proto__ → obj.__proto__.__proto__ → … → null`.
Every `instanceof` check, and every Trusted Types brand check, is really a
prototype-chain walk underneath.
*First seen: Prerequisites (04_js_prototype_chain).*

### ReportingObserver
A browser API (`new ReportingObserver(callback, {buffered: true})`) that
observes report objects — including CSP violations — the browser generates
internally, with no network endpoint or server involved at all. Proves
report *generation* is immediate and reliable, independent of whether
report *delivery* (via `report-uri`/`report-to`) ever actually reaches a
server — two genuinely separate guarantees, easy to conflate.
*First seen: Module 10 (10_violation_reporting_api).*

### report-to / report-uri
Two CSP directives that name where violation reports should be delivered.
`report-uri <url>` is the legacy form: POSTs an `application/csp-report`
body directly to a URL. `report-to <group-name>` is the modern form: names
a group defined by a separate `Reporting-Endpoints` HTTP header, and
delivery goes through the browser's general-purpose Reporting API
(batched, `application/reports+json`, delivery timing not guaranteed by
spec). Both are commonly declared together for browser-support coverage.
*First seen: Module 10 (10_violation_reporting_api).*

### TrustedScript / TrustedScriptURL
The branded object types Trusted-Types-guarded Script sinks (`eval`,
`script.text`) and ScriptURL sinks (`script.src`) require in place of a
plain string. `eval` and `script.src` are solidly guarded and usable with
real values; the `Function` constructor, verified directly, does not
support Trusted Types values at all in this engine — a real, current
platform gap, not a design choice this course made.
*First seen: Module 19 (19_script_sink_guard).*

### SecurityPolicyViolationEvent
The event fired at `document` whenever the browser blocks something for
violating CSP. Carries `blockedURI` (what was blocked), `violatedDirective`
(the directive name as written in your policy), and `effectiveDirective`
(the specific sub-directive actually checked, e.g. `script-src-elem` when
your policy only declared the broader `script-src`). Listening for this
event is the DOM-level way to observe violations live, as opposed to the
server-side Reporting API covered in Module 10.
*First seen: Module 3 (03_directive_enforcement).*

### "default" policy
A Trusted Types policy created with the exact name `"default"`. Unlike any
other policy name, it's consulted automatically whenever unmodified
"legacy" code — code that never calls `createPolicy` or references any
policy at all — assigns a raw string to a guarded sink. Only covers the
sink categories (`createHTML`/`createScript`/`createScriptURL`) it actually
implements; a sink category it doesn't implement stays exactly as blocked
as if no default policy existed at all.
*First seen: Module 17 (17_default_policy).*

### disposition
A field on `SecurityPolicyViolationEvent`: `"enforce"` if the violation came
from a blocking `Content-Security-Policy` header, `"report"` if it came from
a non-blocking `Content-Security-Policy-Report-Only` header. Same event,
same shape — this field is the only way to tell which mode produced it.
*First seen: Module 4 (04_report_only_mode).*

### Sink
A DOM API that takes a string (or string-like value) and turns it into live
markup or executing code — `innerHTML`, `document.write`, `eval`, `<script src>`,
etc. CSP's `script-src` restricts *where code can come from*; Trusted Types
restricts *what shape of value a sink will even accept*, which is why the two
layers are complementary rather than redundant.
*First seen: Prerequisites (02_dom_sinks).*

### Source expression
One entry inside a directive's value — a host (`https://cdn.example.com`), a
scheme (`https:`), a keyword (`'self'`, `'unsafe-inline'`), a nonce
(`'nonce-abc123'`), or a hash (`'sha256-…'`). A directive is enforced by
testing whether the thing being loaded/executed matches any of its source
expressions.
*First seen: Prerequisites (03_csp_vocabulary).*
