# Module 7 — strict-dynamic Propagation: Decisions

### Policy includes `'self'` alongside `'nonce-...' 'strict-dynamic'`, even though we expect `'self'` to be ignored

**(c) Our own convention**, and deliberately provocative: we kept `'self'`
in the policy specifically so Proof C could demonstrate it being ignored,
rather than just not testing the interaction at all. A policy author who
doesn't know this rule would very plausibly write exactly this combination,
expecting `'self'` to serve as a fallback for anything the nonce doesn't
cover — Proof C shows that expectation is wrong.

### `dynamic-child.js` is inserted via `document.createElement('script')` + `appendChild`, never via `innerHTML`

**(b) Forced by an external contract.** The CSP spec's propagation rule for
`'strict-dynamic'` specifically requires the child script be inserted via a
non-"parser-inserted" mechanism — `createElement`+`appendChild` (or
`insertBefore`) qualifies; `innerHTML`/`document.write` do not count as
propagation-eligible insertion at all (and, separately, `innerHTML`-inserted
`<script>` tags never execute in any browser regardless of CSP — a DOM
parsing rule, not a CSP one; see
[prerequisites/02_dom_sinks.html#innerhtml-sink](../../prerequisites/02_dom_sinks.html#innerhtml-sink)).
We picked the one insertion method the spec actually grants propagation to,
on purpose.

### `violation-listener.js` and `wiring.js` needed a `nonce="{{NONCE}}"` attribute added — discovered only by running the module

**(a) Forced by the platform — a real bug we hit, not a hypothetical.** Our
first draft loaded both as plain `<script src="...">` tags with no nonce,
exactly like every prior module (where `'self'` alone was enough). Running
it produced three blocked scripts, not one: our own infrastructure files
were casualties of the same rule Proof C exists to demonstrate. The real
captured console message says it outright: *"Note that 'strict-dynamic' is
present, so host-based allowlisting is disabled."* That sentence doesn't
carve out an exception for "your own utility scripts" — `'self'` is
disabled for **every** parser-inserted script once `'strict-dynamic'` is
present, full stop. Fix: give our legitimate infrastructure scripts a nonce
too, same as the root proof script, and leave only the intentionally-broken
`static-child.js` without one.

### The server reads `index.html` into memory once at module load, not per-request

**(c) Our own convention that became a real gotcha during development.**
Editing `public/index.html` while the server was already running had no
effect until we restarted the process — `fs.readFileSync` at the top of
`server.js` runs once, at startup. We kept this pattern (rather than
re-reading the file on every request) because it matches Modules 5–6 and
keeps the per-request work limited to nonce generation and templating — but
it's worth flagging explicitly here since it cost us a debugging detour: a
"my fix isn't working" symptom that was actually "the server never saw the
fix."

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| `'self'` kept in the policy on purpose | (c) convention | Lets Proof C demonstrate it being ignored, not just assert it |
| Propagation via `createElement`+`appendChild`, not `innerHTML` | (b) spec | The only insertion method the spec actually grants trust to |
| Infra scripts given a nonce, found empirically | (a) platform | `'strict-dynamic'` disables `'self'` for ALL parser-inserted scripts, no exceptions |
| Template read once at startup | (c) convention | Matches prior modules; documented as a real gotcha we hit, not hidden |

## What We Proved

Real server, real nonce, real dynamic DOM insertion, real browser
enforcement — three outcomes, verified independently:
```
Proof A — nonced root script:              ALLOWED  ("ran — root nonced script executed")
Proof B — dynamically-inserted child,      ALLOWED  ("ran — dynamically-inserted child
          NO nonce, via createElement:               executed, trust propagated from
                                                       the root script")
Proof C — static <script src>, NO nonce,   BLOCKED  ("(has not run yet)" — never ran,
          despite 'self' in the policy:               despite 'self' being present)
```
Violation log — exactly the one expected entry, once the infrastructure
scripts had their own nonce:
```
#1 blockedURI=http://localhost:5900/static-child.js  violatedDirective=script-src-elem
```
And the real console message confirms the mechanism, not just the outcome:
*"Note that 'strict-dynamic' is present, so host-based allowlisting is
disabled."* This proves both halves of `'strict-dynamic'`'s contract at
once: trust propagates forward from an already-trusted script through
dynamic, non-parser insertion — and every host/scheme-based allowlist entry
in the policy, including `'self'`, stops mattering the moment
`'strict-dynamic'` appears, for every script that isn't part of that
propagation chain.
