# Libbie: measure errors that change broker decisions

_Approach by Ivan Židov, TextValue. The prototype provides supporting development evidence._

## 1. What have we got?

I would not approve broad production use from “83.5% accuracy” alone. The supplied scorer has 167/200 field agreements, but only 24/50 conversations agree on all four fields. These are dependent fields within clients, not 200 independent examples. Seller recall is 3/8, a small but costly-looking slice: confusing an owner with a buyer sends the broker into the wrong workflow. The metric is agreement with imperfect supplied labels, not verified population accuracy.

I would inspect disagreements alongside ordinary examples, identify which downstream actions each field controls and measure correction effort. Row 19's selling intent and AED 8 million asking price expose a direction error and omission. Row 4's explicit offer supports Negotiation, so its reference and prediction both deserve review. The provided CSV has no transcripts, so full adjudication needs the source conversations. I would allow a clearly scoped, editable simulation while collecting evidence for a bounded broker pilot. Readiness should expose timing, commitments and blockers; stage is not a probability of closing.

## 2. We cannot measure what we cannot trust

I would begin with a timed 30-case pilot and draft guidance before committing to volume. A provisional target is 500 retained conversations: 240 development, 200 randomly sampled representative evaluation and 60 challenge evaluation. Sample across intent, stage, money forms, location rejection, speaker attribution and intent changes. Group related contacts and variations before splitting families. Deliberate rare-class oversampling is useful for diagnosis but cannot be treated as the natural traffic mix.

An LLM proposes labels and evidence; the analyst validates every retained reference. Budget the analyst's 80 hours as 12 for guidance/pilot/legacy audit, 18 representative review, 6 challenge review, 18 further development review, 6 delayed blind repeats, 12 disputes/repairs and 8 freeze/audit. If the pilot shows this is unrealistic, reduce case count rather than remove review. Repeat 60 cases after a delay. Seek a second reviewer for 80 overlapping cases and adjudication, explicitly assuming roughly 8 additional hours outside the analyst's budget. If that person is unavailable, report the limitation.

Clarify latest contact intent, furthest supported stage, arranged viewings versus broker proposals, accepted versus rejected/suggested areas, and contact amounts versus broker estimates. Preserve ranges and units operationally and document any scalar-export convention. Unresolved evidence must remain visible rather than forcing certainty. Store raw proposals, reviewer answers, evidence and guide versions separately. Compare blind and assisted review, delayed agreement, per-field/class disagreements and adjudicated residual errors. Freeze evaluation membership and references after review. Cases inspected during development become exposed evidence and need fresh family-separated evaluation to support generalization.

## 3. Someone wants to ship

I would ask for the paired predictions, exact scorer and denominator, changed prompt/model configuration and reference changes. If the comparison is against the same 200 fields, 86% means 172 matches, a net gain of five from 167. That could hide a new seller-direction error. Check wrong-to-right and right-to-wrong cases, critical slices, whole-conversation performance and reproducibility. Label repairs are separate from model improvements. The teammate's candidate outputs were not supplied, so I cannot endorse their improvement claim.

For Monday, demonstrate a labelled simulation with editable outputs and a reversible version pointer. Production promotion requires a frozen comparison, no new critical regressions, adequate reviewed evidence and an explicit owner decision. A provider change needs its own run. The prototype demonstrates the process with a real rule-extractor failure: “not selling … need to rent” is misclassified by v1/v2. v3 fixes that development case without breaking the other 12 scripted cases. This is a narrow implementation improvement, not the teammate's reported 86% result or proof of production reliability.

## 4. The harder half

For “somewhere cosy,” retrieve the visible conversation and active corrections, not only the four labels. Propose an editable brief: 5-bedroom rental house, garden, pool, 2 dogs, around AED 500k/year, warm/homely as a proposed style meaning. Arabian Ranches is a broker suggestion, not confirmed client interest. The original August year is unknown. Let the broker approve the working cap, area and treatment of unknown availability before searching.

The model proposes interpretations, ranking and draft wording. Code enforces scope, revision, explicit approval, numeric/unit filters, current listing status, candidate IDs and canonical facts. The AED 490k villa physically fits under the approved cap, but its minimalist/glass description weakly supports warm/homely. Pet permission and availability remain unverified. Return it as conditional, not a perfect match. Store inputs, proposed brief, approvals, versions, fetched IDs, inventory snapshot, evidence and validation so the decision can be reconstructed. Structured JSON constrains format, not truth.

Across 10,000 requests, run cheap invariants on all requests, review representative ordinary traffic plus targeted failures, and evaluate retrieval separately from ranking. Calibrate any judge against blind human review. Measure supported task completion, shortlist usefulness, broker corrections and time to the next useful action, then assess business outcomes in a controlled pilot. Feedback creates a reviewed development case and component diagnosis; a versioned change gets a fresh comparison and explicit promotion/rollback. No automatic prompt rewriting follows a thumbs-up.

_AI-use disclosure:_ AI helped calculate metrics and build the prototype, tests and drafts. The implementation audit found a naive negation error and a review-gate defect that could let an added case escape human validation; both are now explicit regression tests. The prototype uses synthetic fixtures and deterministic extraction/search. No real-model evaluation, independent annotation study or broker pilot has been completed.
