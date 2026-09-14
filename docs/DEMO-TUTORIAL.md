# Client walkthrough

Explore how Libbie turns a conversation into an inspectable search and a reproducible improvement. All messages and properties are fictional. No external messages are sent.

Start with Node 24, run `npm ci` and `npm run dev`, then open http://127.0.0.1:3000. No API key is required. The app saves progress locally between sessions.

## 1. Understand and approve a search

Open the family lead in **Workspace**. The conversation establishes five bedrooms, a garden, a pool, two dogs, and a target around AED 500,000 per year. Arabian Ranches is initially a broker suggestion. The fictional scenario supplies the year 2026 for the August move date.

Choose **Review search**. Review the working budget cap, area, meaning of cosy, and treatment of unknown facts. For the initial example, approve Arabian Ranches as a working area, AED 500,000/year, warm/homely style, and conditional options. Check the approval box and choose **Run search**.

SYN-P001 meets physical requirements but has uncertain style fit and unverified pet permission and availability. SYN-P004 is a separate fictional factual match. Inspect the reasons and trace. Approval of a working area does not record it as accepted by the client.

## 2. Update the conversation

Draft a reply asking whether Mudon works and send it to the simulated client. In **Scenario Lab**, start/resume the run and choose `confirm_area`, then **Next client reply**. The reply accepts Mudon and rejects Arabian Ranches.

Ask about the maximum budget and use `ask_budget` to disclose AED 520,000. Return to Workspace and approve a fresh search. Earlier approvals become stale when the conversation changes. Asking for a viewing time and using `ask_viewing_time` demonstrates progression to Viewing after an actual commitment.

## 3. Reproduce and correct a failure

In **Scenario Lab**, choose **Load improvement case**. This adds optional S13 to the original 12 cases. With v1 active, the statement “We are not selling. We need to rent…” is incorrectly classified as Seller.

Use **Correct** to set the current intent to Renter, choosing the source message and recording a reason. The correction persists for that conversation and creates development feedback; it does not change the global extractor.

## 4. Compare a candidate

Open **Evaluation**, select baseline v1 and candidate v3, then **Run comparison**. Candidate v3 handles explicit negated selling. The replay uses frozen source inputs rather than the corrected workspace state.

The 13-case development comparison shows one fixed failure and zero scripted regressions. This is a narrow test of exposed synthetic cases, not independent production accuracy.

## 5. Review before promotion

Use **Review** to inspect frozen openings and save human references. Blind mode hides machine proposals. Record ambiguity or need for adjudication when evidence is unresolved.

Promotion requires accepted human references for every included case, at least 12 cases, passing checks, and a report matching the candidate source. Without this evidence the expected result is **Insufficient evidence**. A qualifying report enables explicit promotion; rollback restores the previous version pointer and records the change.

## Additional scenarios

| Case | Behavior to inspect |
| --- | --- |
| S02 | Selling intent remains distinct from broker buying questions |
| S03 | Broker rent estimates are not client budgets; stage ambiguity remains visible |
| S04 | An explicit offer advances stage; rejected alternatives stay excluded |
| S05 | Chit-chat preserves known requirements |
| S06 | Greetings do not invent property intent |
| S07 | Budget ranges and location constraints remain explicit |
| S08 | Monthly rent is normalized to an annual amount |
| S09 | Current intent can change without erasing history |
| S10 | Requested contact timing and stop instructions suppress premature contact |
| S11 | Listing text cannot invent canonical IDs or verify unknown pet permission |
| S12 | No matching inventory produces no match rather than relaxed constraints |

## Reproduce the report

Run `npm run demo:report` to generate `reports/improvement-demo.json` using an isolated temporary database. It does not annotate or promote anything in your workspace. Run `npm test` for behavior checks and `npm run build` for a production build.

The optional provider supports simulated replies and broker drafts. Extraction, search, enrichment, and evaluation remain deterministic. Independent labeling, real-provider validation, production access controls, and a broker pilot are next-stage work.

## Contact

**Ivan Židov · TextValue**

[ivan@textvalue.ai](mailto:ivan@textvalue.ai) · [LinkedIn](https://www.linkedin.com/in/ivan-zidov/)
