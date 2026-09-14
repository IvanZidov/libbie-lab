# Evaluation policy

The original CSV is unchanged. The application recalculates 167/200 field agreements and 24/50 whole-conversation agreements against its imperfect labels. No original transcripts exist in that CSV. Its agreement is not the application's current classifier accuracy.

Paired replay uses exactly the same frozen public opening messages and inventory for both deterministic strategies. Each report records reference values, case/family IDs, hashes, actual outputs, per-assertion failures, field counts, latency and mode. Dataset snapshots are append-only. Supplied fixture assertions are proposed development references. Accepted human annotations are separate records and supersede those references only in a new report. The latest ambiguous/adjudication annotation makes a case unreviewed again.

A report fails gates when candidate assertions fail. It has insufficient evidence until every included opening has an accepted review (at least the initial 12 cases). Eligible reports can only promote the exact candidate configuration and current implementation-source fingerprint. Promotion is an explicit local action with a reason and report reference. Rollback retains history. New provider/configuration changes require separate evidence, and this runner does not certify live calls.

All bundled scenario families were exposed during implementation and remain development evidence. Generated variants inherit their parent's family and split and remain unreviewed. The UI does not claim untouched holdout performance, significance, closing probabilities, conversion benefit or client trust. The later independent 500-case analyst programme in the case-study memo is not performed by this MVP.
