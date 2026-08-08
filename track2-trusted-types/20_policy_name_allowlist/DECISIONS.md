# Module 20 — Policy-Name Allowlist: Decisions

### Two full routes (`/allowlist`, `/allow-duplicates`) instead of one page testing both cases

**(c) Our own convention**, same discipline as Module 17: `createPolicy`
calls can't be meaningfully undone within one page load, so isolating the
one variable (is `'allow-duplicates'` present in the directive) requires
genuinely separate page loads, not a simulated toggle.

### Proof B and Proof C are checked for DIFFERENT error text, not just "both threw"

**(c) Our own convention**, and it surfaced a real, useful distinction.
Real captured errors:
```
Proof B (name not allowlisted): Policy "rogue-policy" disallowed.
Proof C (duplicate name):       Policy with name "approved-policy" already exists.
```
These are two completely different failure reasons — one is about the
NAME never being permitted at all; the other is about a permitted name
being used TWICE. Conflating them (just checking "did it throw") would
have missed that `trusted-types` enforces two independent rules
simultaneously, not one.

### `'allow-duplicates'` is tested by attempting the SAME name twice, not two different names

**(c) Our own convention.** The keyword's name states its purpose
precisely — it doesn't loosen the ALLOWLIST (Proof B still fails identically
on `/allow-duplicates`, confirmed), it only loosens the UNIQUENESS
requirement for names that are already permitted.

### The allowlist contains exactly one name, `approved-policy` — no wildcard or pattern syntax attempted

**(b) Forced by an external contract.** The `trusted-types` directive's
grammar is a plain space-separated list of exact policy names (plus the
special keywords `'allow-duplicates'` and `'none'`) — there's no wildcard
or pattern-matching syntax defined in the spec to test in the first place.

---

## Decisions We Made

| Decision | Category | One-line why |
|---|---|---|
| Two separate routes | (c) convention | `createPolicy` calls can't be undone within one page load |
| Compared exact error text, B vs. C | (c) convention | Surfaces two genuinely independent enforcement rules |
| `'allow-duplicates'` tested via same name twice | (c) convention | Tests exactly what the keyword's name claims to do |
| No wildcard/pattern syntax attempted | (b) spec | Directive grammar doesn't define one |

## What We Proved

Real allowlist, real duplicate-name attempt, real captured errors:
```
/allowlist (trusted-types approved-policy):
  Proof A (approved-policy, 1st time):  SUCCEEDED
  Proof B (rogue-policy):                THREW: Policy "rogue-policy" disallowed.
  Proof C (approved-policy, 2nd time):  THREW: Policy with name "approved-policy" already exists.

/allow-duplicates (trusted-types approved-policy 'allow-duplicates'):
  Proof A (approved-policy, 1st time):  SUCCEEDED
  Proof B (rogue-policy):                THREW: Policy "rogue-policy" disallowed. (identical — allowlist still enforced)
  Proof C (approved-policy, 2nd time):  SUCCEEDED
```
This confirms `trusted-types` enforces two independent, separately-testable
guarantees: only explicitly-named policies can be created at all (closing
the door on, say, a compromised third-party script defining its own
permissive policy under an unexpected name), and — unless explicitly
relaxed — each allowed name can only be claimed once, preventing a later
script from silently redefining an already-trusted policy's behavior.
