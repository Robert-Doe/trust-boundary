# Lessons — Cross-Module Concept Clusters

Phase 3 of this course. Each cluster below covers a concept that spans
more than one numbered module and doesn't belong entirely to any single
one of them — so it lives here, centrally, instead of being duplicated or
awkwardly wedged into one module's folder.

## 01 — CSP Allowlisting Strategies

**Files:** [01_explainer.html](01_csp_allowlisting_strategies/01_explainer.html) · [02_history_deepdive.html](01_csp_allowlisting_strategies/02_history_deepdive.html) · [03_tradeoffs_deepdive.html](01_csp_allowlisting_strategies/03_tradeoffs_deepdive.html)

**Relates to:** Track 1 Modules 5 (nonces), 6 (hashes), 7 (strict-dynamic)

**Why centralized:** Each of those three modules proves exactly one
mechanism works, in isolation, with its own server and its own proofs.
None of them is the right place to answer the question a real team
actually has to answer — *which one should we use, and why?* — because
answering that requires comparing all three side by side, something no
single module's scope covers.

## 02 — CSP and Trusted Types Layering

**Files:** [01_explainer.html](02_csp_trusted_types_layering/01_explainer.html) · [02_failure_modes_deepdive.html](02_csp_trusted_types_layering/02_failure_modes_deepdive.html) · [03_real_world_adoption_deepdive.html](02_csp_trusted_types_layering/03_real_world_adoption_deepdive.html)

**Relates to:** Track 1 Module 3 (Directive Enforcement); Track 2 Modules
14 (DOM-XSS Sink Baseline), 15 (require-trusted-types-for), 18 (HTML Sink
Guard), 24 (Sanitizer Capstone)

**Why centralized:** No single module states, end to end, exactly where
CSP's job stops and Trusted Types' job starts — Module 14 comes closest,
but its scope is narrowly "does script-src cover this one gap." Stating
the full boundary precisely requires pulling evidence from across both
tracks at once.

## 03 — Trusted Types and Prototypal Inheritance

**Files:** [01_explainer.html](03_trusted_types_and_prototypes/01_explainer.html) · [02_internal_slots_deepdive.html](03_trusted_types_and_prototypes/02_internal_slots_deepdive.html) · [03_prototype_pollution_deepdive.html](03_trusted_types_and_prototypes/03_prototype_pollution_deepdive.html)

**Relates to:** Prerequisites Module 4 (JS Prototype Chain); Track 2
Modules 16 (Policy Factory), 22 (Brand Check via instanceof), 23
(Forged-Object Defense)

**Why centralized:** This is the course's direct answer to "how does
Trusted Types relate to prototypal inheritance" — assembling the full
chain of reasoning (prototype-chain mechanics → why `instanceof` is
spoofable → why the real sink guard isn't `instanceof`-based → why that
resistance holds under four different forgery attempts) requires content
from the prerequisites layer and three separate Track 2 modules. No single
module owns that whole story.

---

## Reading order

These don't need to be read in order relative to each other, but each
assumes you've completed the modules it's tagged as relating to — the
`00 — Which Modules This Spans` section at the top of every explainer links
back to exactly those.
