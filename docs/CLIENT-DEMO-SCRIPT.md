# Showing a client how the system improves over time

A twelve-minute walkthrough of one complete improvement: a real mistake, a broker's
correction, measured evidence, human sign-off, release, and rollback. Everything is
fictional and local. No messages leave the machine.

The app has three places: **Workspace** (the broker's day), **Improve** (this run),
and **Settings**. The whole story below lives in **Improve**, which numbers the five
steps and marks each one done as you go.

---

## Before the meeting

```sh
npm ci && npm run dev          # http://127.0.0.1:3000
```

Open **Improve** once and leave it on step 1. Decide which of the two endings you
want — see *Choosing your ending* at the bottom — and keep this page open on a second
screen.

One sentence to open with:

> "I am going to show you one mistake, and everything that has to happen before the
> fix is allowed to go live."

---

## Step 1 · See the mistake — 90 seconds

**Click** `Load the failing conversation`, then `Open it in Workspace`.

**Point at** the client's message: *"We are not selling. We need to rent a
four-bedroom house in Mudon, up to 450k a year."* Then at the lead brief on the
right, which says **Seller**.

**Say:**

> "The word 'selling' is in the message, so the system latched onto it and ignored
> the 'not'. A broker reading this would lose the lead or waste a week on the wrong
> pitch. This is the kind of failure we are going to fix — and, more importantly,
> prove we fixed."

**Why this beats a slide:** the client sees the product being wrong. Credibility for
everything that follows comes from here.

---

## Step 2 · The broker corrects it — 2 minutes

In **Workspace**, on the lead brief, **click** `Correct`.

- Field: `clientType`
- Corrected value: `Renter`
- Source message: the "We are not selling" message
- Reason: *"Client explicitly rules out selling in the first message."*

**Click** `Save human correction`.

**Say:**

> "Three things just happened. The brief for this client is right from now on. The
> correction is attached to the message that proves it, so nobody has to take my word
> for it later. And the case is saved as something the system must get right in
> future — the correction is not a patch, it is a test."

**Point out:** the correction does not silently retrain anything. Nothing about the
live system has changed yet. That is deliberate.

---

## Step 3 · Measure the candidate — 2 minutes

Back in **Improve**, step 3. Leave *Version in use today* as **v1** and *Proposed
version* as **v3**. **Click** `Run the comparison`.

**Read the four numbers out loud:**

| Tile | What to say |
| --- | --- |
| **Cases fixed: 1** | "One conversation that used to be wrong is now right." |
| **Cases broken: 0** | "And nothing that used to work stopped working. This number is the one that matters — it is how you catch a fix that quietly costs you something else." |
| **Signed off by a person: 0 / 13** | "No human has checked any of these yet." |
| **Release status: Needs human sign-off** | "So the system will not let me ship it." |

**Say:**

> "Both versions just replayed the identical saved conversations. Same inputs, same
> inventory, no cherry-picking. The table below shows every case and where the two
> versions disagree."

If asked *how it can be sure*: open `What this evidence is, and is not`. It states
plainly that these are 13 development cases that were visible while the system was
built, not an independent accuracy measurement. Say that out loud — it is the most
trust-building sentence in the demo.

---

## Step 4 · A person signs off — 4 minutes

**Say:**

> "The machine does not get to grade its own homework. Before anything ships, a
> person has to state what the right answer actually was."

Work the queue of 13 cases. Each is pre-filled with what today's version says, so
most are one considered click: read the messages on the left, then `This is correct ·
sign off`. It advances to the next case automatically.

**Stop deliberately at S13** — the one with the amber dot, marked *the versions
disagree here*. The form is pre-filled with **Seller**, because that is what today's
version says.

**Say:**

> "If I rubber-stamp this, I am certifying the bug. Watch what happens."

You have two options, and both are good demos:

- **The fast version:** change Client intent to **Renter**, sign off, and move on.
- **The strong version:** sign off **Seller** on purpose, re-run the comparison in
  step 3, and watch the release status turn into **Blocked · the candidate broke a
  check**. Then fix the reference to **Renter**, re-run, and watch it clear. Say:
  *"The system would rather block a good fix than let me quietly approve a bad
  answer."*

Mention `Hide the machine's answer while I decide` — the blind mode for a reviewer
who wants to form an independent answer first. Use it on one case if there is time.

---

## Step 5 · Release, and the receipt — 2 minutes

Re-run the comparison if you have not since the last sign-off. Release status now
reads **Ready to release**.

**Click** `Make v3 the live version`.

**Point at** *How the system changed over time*: the timestamp, `v1 → v3`, the
reason, who did it, and the evidence the decision was based on.

**Say:**

> "That is the whole point. Every version change has a person's name on it, a reason,
> and the exact comparison it was based on. If this turns out to be wrong in
> production next week —"

**Click** `Undo the last release`.

> "— one click, and the previous version is live again. The history keeps both
> entries. Nothing is erased."

**Close with:**

> "A mistake became a test, the test became evidence, the evidence became a decision
> a person signed, and the decision is reversible. Run that loop every week and the
> system gets measurably better instead of anecdotally better."

---

## Questions you will get

**"How much better did it actually get?"**
One case fixed, zero broken, across 13 development cases. Do not inflate this. The
honest framing: *"The number is small because the evidence is honest. What I am
selling you is the loop, not this week's score."*

**"What about the 83.5% in the benchmark?"**
Open `Where we started · the supplied legacy benchmark` in step 3. That figure
describes the supplied system measured against its own imperfect labels, on a CSV
with no transcripts. It is the starting point, not this app's accuracy.

**"Does it learn automatically?"**
No — and that is a feature. Corrections become tests, not silent retraining. A person
approves every version change. Answering this crisply is usually what wins the room.

**"What happens with a real language model?"**
Settings shows the live provider configuration. Client simulation and draft replies
can run against a real model; extraction, search and the comparison stay
deterministic so the evidence is reproducible. No provider call is required for
anything you just saw.

---

## Choosing your ending

- **Twelve minutes, full loop:** sign off all 13 cases live. Real, but there is a
  quiet stretch in the middle. Fill it by talking through what a reviewer is actually
  deciding.
- **Six minutes, pre-signed:** sign off the 13 cases *before* the meeting, then demo
  steps 1–3, jump to step 4 to show the S13 trap and the completed queue, and finish
  on release and rollback. Say that you did the sign-off beforehand — the timestamps
  are visible in the history either way, and being straight about it costs nothing.

Either way, do step 2's correction live. Watching a human fix the system, and the
system treat that fix as evidence rather than as a patch, is the part that sells.

---

**Ivan Židov · TextValue** · [ivan@textvalue.ai](mailto:ivan@textvalue.ai)
