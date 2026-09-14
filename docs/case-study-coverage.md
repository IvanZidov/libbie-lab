# Original case-study coverage audit

The task asks for reasoning in a four-section memo, not a production build. All its questions now have an explicit written answer. The app supplies executable illustrations of the main loop. Some evidence cannot be produced from the supplied materials and must not be implied.

| Original requirement                            | Where to demonstrate / explain                                                 | Evidence boundary                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Is 83.5% enough?                                | Memo §1; Evaluation legacy summary                                             | Recalculated 167/200 and 24/50, not app accuracy                                     |
| Inspect flawed labels and costly errors         | Memo §1; rows 19/4 explanation; S02/S04                                        | Original full transcripts are not supplied by the CSV                 |
| Select data from 10,000                         | Memo §2, sampling/family split plan                                            | Proposed sampling programme, not acquired real traffic                               |
| Divide 80 analyst hours / LLM work              | Memo §2, explicit hour allocation                                              | Planned workload, with pilot to verify throughput                                    |
| Repeat labelling                                | Memo §2: 60 delayed repeats, 80 overlaps                                       | Additional reviewer is a stated resource assumption                                  |
| Resolve disagreement / ambiguity                | Review statuses and evidence; memo §2                                          | Single-operator workflow; independent agreement not measured                         |
| Clarify guidance without losing original schema | Four-field export; S02–S09; memo §2                                            | Operational unknown/range handling explicitly differs from forced exercise labels    |
| Separate development/evaluation                 | Stored frozen replay and dataset hashes; memo §2                               | Bundled/generated cases are exposed development evidence, no untouched holdout       |
| Evidence that labels are reliable               | Memo §2: blind/repeat/per-class/adjudication checks                            | No claim that these reliability measurements were conducted                          |
| Respond to 83→86 Monday request                 | Memo §3; report gates; explicit promotion/rollback                             | Teammate's predictions are absent; no invented gain                                  |
| Exact cosy walkthrough                          | Client walkthrough §1; S01; SYN-P001                                                     | Fictional clock supplies year; original year unknown                                 |
| Model versus code ownership                     | Memo §4; tutorial explanation; trace                                           | Runtime interpretation/ranking currently scripted; live adapter covers client/drafts |
| Broker understands before search                | Editable working cap/areas/style/unknown policy plus approval                  | Broker approval is not client acceptance                                             |
| Reconstruct decisions afterwards                | Stored search and paired case trace                                            | No hidden chain-of-thought needed                                                    |
| Prevent invented listings/claims                | S11, workspace exclusion, canonical filtering, conditional unknowns            | Not a general semantic truth verifier                                                |
| Evaluate across 10,000 requests                 | Memo §4: universal checks, mixed sampling, calibrated review, controlled pilot | Proposed production evaluation programme                                             |
| Improve over time                               | S13 failure → correction → v3 replay → review gate → promotion/rollback        | Actual narrow deterministic fix, not live-model improvement                          |
| Disclose AI help, mistakes, overrides           | Memo disclosure; tutorial framing                                              | No invented external research mistake or real-broker validation                      |

## Audit-driven changes

- Added optional S13, preserving the 12 supplied scenarios unchanged.
- Added v3 to fix explicit negated-selling intent. v1/v2 remain reproducible.
- Corrected active-version lookup so promoted v3 actually drives subsequent snapshots.
- Tightened the release gate: **every included case** must be reviewed, even when more than 12 exist.
- Added measured fixed-case counts to reports and UI.
- Added tests that reproduce the old failure, verify the candidate and verify the added-case review gate.

## Still not implemented or demonstrated

General live-model extraction/ranking; teacher/judge execution; interactive paired stochastic evaluation; representative production datasets; independent adjudication; judge calibration and uncertainty estimates; broker conversion/trust outcomes; authentication/deployment. These are clearly described as next-stage work. These outcomes have not yet been validated.
