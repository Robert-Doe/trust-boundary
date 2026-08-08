# Module 10 — Violation Reporting API: Decisions

### The policy declares BOTH `report-uri` (legacy) and `report-to` (modern), plus a `Reporting-Endpoints` header

**(c) Our own convention**, chosen specifically so we wouldn't have to
*assume* which mechanism this environment actually supports — we tested
both at once and let the evidence decide. See "What We Proved" below; the
result was not what we expected going in.

### The collector endpoint accepts and stores whatever content-type/body arrives, without validating it's well-formed

**(c) Our own convention.** `report-uri`'s legacy format
(`application/csp-report`) and the modern Reporting API's format
(`application/reports+json`, a JSON array of report objects) are shaped
differently. Rather than write two separate parsers and pick the "right"
one, the collector just logs whatever actually shows up — appropriate for a
diagnostic tool whose entire job is "tell us what's real," not "validate
conformance."

### A `ReportingObserver` was added to this module after the network collector showed zero reports — not part of the original plan

**(a) Forced by the platform — this is the module's central discovery, not
a hypothetical.** Our first working version polled `/debug/reports` for
6 seconds and found nothing. Rather than assume the mechanism was
misconfigured (or worse, silently rewrite the module to claim network
delivery "should" work without checking), we added `ReportingObserver` —
a separate, network-independent browser API that observes report objects
the browser constructs internally, regardless of whether it ever uploads
them. That let us isolate exactly which half of the pipeline was and wasn't
happening.

### We waited up to ~30 seconds, and also forced a navigation away, before concluding no network delivery occurred

**(a) Forced by the platform, verified rather than assumed.** The Reporting
API spec does not guarantee prompt delivery — implementations are
explicitly permitted to batch and delay uploads at their own discretion,
and some implementations flush queued reports on page unload. We checked
both: an extended wait, and a forced navigation, reading the collector
server's own raw stdout log directly afterward (bypassing the page
entirely, so a client-side bug in our own polling code couldn't produce a
false negative). Zero requests reached `/csp-report` by either path, by
either mechanism, in this environment.

### The DECISIONS.md and tutorial report the null result honestly, instead of quietly showing only the parts that "worked"

**(c) Our own convention — and the whole point of this course's verification
discipline.** It would have been easy to write this module around
`ReportingObserver` alone and never mention that the network-delivery half
didn't work in the environment we actually tested in. That would teach a
false confidence: "add `report-to` and reports show up at your collector."
What we can actually stand behind, because we checked it directly, is
narrower and more useful: the browser reliably constructs full,
detailed report objects the moment a violation occurs — and whether/when
those get uploaded over the network is a separate, best-effort concern you
cannot rely on synchronously, or sometimes at all, in every environment.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| Both `report-uri` and `report-to` declared | (c) convention | Let real evidence decide which (if either) actually delivers, instead of assuming |
| Collector logs any body/content-type as-is | (c) convention | Diagnostic tool, not a conformance validator |
| `ReportingObserver` added after a null result | (a) platform, empirical | Isolates report GENERATION from report DELIVERY |
| Extended wait + forced navigation before concluding | (a) platform, empirical | Spec permits arbitrary delivery delay/batching; ruled it out directly |
| Null result reported honestly | (c) convention | The course's verification discipline applies to negative results too |

## What We Proved

Real server, real dual-mechanism policy, real waiting, real server-side log
inspection — two genuinely different findings, not one:

**Report generation — confirmed, in full detail, via `ReportingObserver`:**
```json
{
  "type": "csp-violation",
  "url": "http://localhost:6500/",
  "body": {
    "sourceFile": "http://localhost:6500/",
    "lineNumber": 37,
    "blockedURL": "inline",
    "effectiveDirective": "script-src-elem",
    "originalPolicy": "default-src 'self'; script-src 'self'; report-uri /csp-report; report-to csp-endpoint",
    "disposition": "enforce",
    "statusCode": 200
  }
}
```
(and a second, identically detailed object for the `eval` violation.)

**Report delivery — NOT observed, in this environment, despite:**
- polling our own `/debug/reports` collector for 6+ seconds via the page,
- waiting an additional ~20 seconds directly,
- forcing a navigation away (in case delivery is unload-triggered),
- and finally checking the collector server's raw stdout log directly,
  bypassing the page and our own polling code entirely.

Zero requests ever reached `/csp-report`, via either `report-uri` or
`report-to`. We do not claim to know the exact cause (could be
environment-specific network-reporting restrictions in this automated
browser context, could be a longer real-world delivery delay than we
waited for) — only what we directly verified: **generation is immediate and
reliable; delivery is not something you can assume or wait for
synchronously, even briefly.** For real production use, this means:
instrument with `ReportingObserver` client-side if you need a reliable
local signal, and treat a collector endpoint as eventually-consistent at
best, never as a real-time debugging tool.
