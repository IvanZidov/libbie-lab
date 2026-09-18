# Client walkthrough

Explore how Libbie turns a conversation into an inspectable search and a reproducible improvement. All messages and properties are fictional. No external messages are sent.

Start with Node 24, run `npm ci` and `npm run dev`, then open http://127.0.0.1:3000. No API key is required. The app saves progress locally between sessions.

There are three screens. **Workspace** is the broker's day. **Improve** is the numbered
improvement run. **Settings** is configuration and version history. Presenting this to
a client? Use the [demo script](CLIENT-DEMO-SCRIPT.md) instead — it is the same product
with the words to say.

## 1. Understand and approve a search

Open the family lead in **Workspace**. The conversation establishes five bedrooms, a garden, a pool, two dogs, and a target around AED 500,000 per year. Arabian Ranches is initially a broker suggestion. The fictional scenario supplies the year 2026 for the August move date.

Choose **Review search**. Review the working budget cap, area, meaning of cosy, and treatment of unknown facts. For the initial example, approve Arabian Ranches as a working area, AED 500,000/year, warm/homely style, and conditional options. Check the approval box and choose **Run search**.

SYN-P001 meets physical requirements but has uncertain style fit and unverified pet permission and availability. SYN-P004 is a separate fictional factual match. Inspect the reasons and trace. Approval of a working area does not record it as accepted by the client.

## 2. Update the conversation

Draft a reply asking whether Mudon works and send it to the simulated client. Under the composer, choose `confirm area` and **Client replies**. The reply accepts Mudon and rejects Arabian Ranches. Start, pause, bounded automatic turns and the simulated clock sit in **Run controls** below it.

Ask about the maximum budget and use `ask budget` to disclose AED 520,000. Approve a fresh search. Earlier approvals become stale when the conversation changes. Asking for a viewing time and using `ask viewing time` demonstrates progression to Viewing after an actual commitment.

## 3. Reproduce and correct a failure

In **Improve**, step 1, choose **Load the failing conversation**. This adds optional S13 to the original 12 cases. With v1 active, the statement “We are not selling. We need to rent…” is incorrectly classified as Seller.

Use **Correct** to set the current intent to Renter, choosing the source message and recording a reason. The correction persists for that conversation and creates development feedback; it does not change the global extractor.

## 4. Compare a candidate

In **Improve**, step 3, select v1 as the version in use today and v3 as the proposed version, then **Run the comparison**. Candidate v3 handles explicit negated selling. The replay uses frozen source inputs rather than the corrected workspace state.

The 13-case development comparison shows one fixed failure and zero scripted regressions. This is a narrow test of exposed synthetic cases, not independent production accuracy.

## 5. Sign off before releasing

Step 4 is the sign-off queue. Each case shows the client's actual messages and an
answer pre-filled from the version in use today; change anything wrong before signing
off. Cases where the two versions disagree carry an amber dot and a caution — those are
the ones a reviewer must not wave through, and S13 is one of them. Blind mode hides the
machine's answer for a reviewer who wants to decide independently. Record *genuinely
unclear* or *needs a second opinion* when the evidence does not resolve.

Release requires a signed-off answer for every included case, at least the original 12,
passing checks, and a report matching the candidate source. Without that the expected
result is **Needs human sign-off**. Signing off an answer the candidate contradicts
produces **Blocked · the candidate broke a check** rather than a silent pass. A
qualifying report enables an explicit release in step 5; undoing it restores the
previous version pointer and records the change.

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
| S13 | Explicitly negated selling, the failure the improvement run fixes |

## Reproduce the report

Run `npm run demo:report` to generate `reports/improvement-demo.json` using an isolated temporary database. It does not annotate or promote anything in your workspace. Run `npm test` for behavior checks and `npm run build` for a production build.

The optional provider supports simulated replies and broker drafts. Extraction, search, enrichment, and evaluation remain deterministic. Independent labeling, real-provider validation, production access controls, and a broker pilot are next-stage work.

## Contact

**Ivan Židov · TextValue**

[ivan@textvalue.ai](mailto:ivan@textvalue.ai) · [LinkedIn](https://www.linkedin.com/in/ivan-zidov/)
