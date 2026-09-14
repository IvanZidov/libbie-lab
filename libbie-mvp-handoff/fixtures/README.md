# Development fixtures

All cases are fictional or explicitly identified case-study recreations. They are AI-authored proposals, not human-validated evaluation data.

- `scenarios.json` has 12 scenario blueprints. `publicOpening` is visible to Libbie. `privatePersona` belongs only to the client simulator. `evaluatorOnly` belongs only to the evaluator. Never concatenate the whole object into the assistant prompt.
- `properties.json` has 14 fictional listing records. SYN-P001 recreates the supplied listing. SYN-P012 belongs to another workspace and must be excluded. SYN-P013 contains an intentional malicious instruction inside listing text.
- All scenario families start in development. Do not relabel these visible fixtures as an untouched holdout. Generate independent families and validate them for future evaluation.
- Trigger names in `scriptedReplies` are explicit scripted-mode actions, not a claim of language understanding. Recognize only supported triggers or show that no scripted reply is available.
- `expectedAtOpening` deliberately contains richer operational fields. It is a proposed assertion object, not the production LeadSnapshot schema. Build a typed fixture importer and translate these assertions into checks.
- S03 intentionally leaves the Inquiry/Qualifying boundary for adjudication. S06 intentionally has no resolved client type. Do not force either into a clean benchmark label.
- The virtual date is fictional July 2026. The original undated family transcript did not provide a year. The simulation can infer year from its own declared clock, not from the original source.

The seeded property prices and traits are test facts. Actual matches depend on the broker-approved search brief and current snapshot. Unknown pets or availability stay conditional. The simulator cannot establish real-world customer outcomes.
