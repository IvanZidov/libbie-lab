"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, ArrowRight, Lock } from "lucide-react";
import { Json, ReferenceEditor, download } from "./interface";

const gateLabel: Record<string, string> = {
  passed_demo_gates: "Ready to release",
  insufficient_evidence: "Needs human sign-off",
  failed_gates: "Blocked · the candidate broke a check",
};
const gateHelp: Record<string, string> = {
  passed_demo_gates:
    "Every case passes and a human signed off on every expected answer. You can release this version.",
  insufficient_evidence:
    "The candidate passes its checks, but not every case has been signed off by a person yet. Release stays blocked.",
  failed_gates:
    "The candidate gets at least one case wrong. Fix the change before asking for sign-off.",
};
const statusLabel: Record<string, string> = {
  accepted: "Signed off",
  ambiguous: "Genuinely unclear",
  needs_adjudication: "Needs a second opinion",
};

function Step({
  n,
  title,
  blurb,
  state,
  children,
}: {
  n: number;
  title: string;
  blurb: string;
  state: "done" | "now" | "waiting";
  children: any;
}) {
  return (
    <section className={"card step step-" + state}>
      <div className="step-head">
        <span className="step-number" aria-hidden="true">
          {state === "done" ? <Check size={16} /> : n}
        </span>
        <div>
          <h3>{title}</h3>
          <p>{blurb}</p>
        </div>
        <span className={"tag " + (state === "done" ? "green" : "amber")}>
          {state === "done"
            ? "Done"
            : state === "now"
              ? "You are here"
              : "Next"}
        </span>
      </div>
      <div className="step-body">{children}</div>
    </section>
  );
}

export function Improve({
  data,
  action,
  busy,
  setError,
  setPage,
}: {
  data: any;
  action: (a: string, payload?: any) => Promise<boolean>;
  busy: boolean;
  setError: (m: string) => void;
  setPage: (p: string) => void;
}) {
  const [scenarioId, setScenarioId] = useState("S13");
  const [blind, setBlind] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewer, setReviewer] = useState("Local broker");
  const [baseline, setBaseline] = useState("v1");
  const [candidate, setCandidate] = useState("v3");
  const [reportId, setReportId] = useState("");

  const scenario =
    data.scenarios.find((s: any) => s.id === scenarioId) || data.scenarios[0];
  const report =
    data.evaluations.find((r: any) => r.id === reportId) ||
    data.evaluations.at(-1);
  const latestFor = (id: string) =>
    data.annotations.filter((a: any) => a.scenarioId === id).at(-1);
  const signedOff = data.scenarios.filter(
    (s: any) => latestFor(s.id)?.status === "accepted",
  ).length;

  // Reviewing 13 cases one field at a time is what stops anyone reaching the end
  // of the run. Outside blind mode the machine's answer is the starting point,
  // so a case is one considered click; blind mode still starts from nothing.
  useEffect(() => {
    if (blind || reviewText || !scenario?.proposal) return;
    const snap = scenario.proposal;
    setReviewText(
      JSON.stringify(
        {
          clientType: snap.clientType,
          leadStage: snap.leadStage,
          acceptedAreas: snap.areas
            .filter((a: any) => a.status === "accepted")
            .map((a: any) => a.name),
          money: snap.money,
        },
        null,
        2,
      ),
    );
  }, [blind, reviewText, scenario?.id, scenario?.proposal]);

  // Cases where the two versions give different answers. No claim about which is
  // right — it is a pointer at the cases a reviewer must not wave through.
  const disputed = new Set<string>(
    (report?.rows || [])
      .filter(
        (r: any) =>
          JSON.stringify(r.results[0].actual?.clientType) !==
            JSON.stringify(r.results[1].actual?.clientType) ||
          JSON.stringify(r.results[0].actual?.leadStage) !==
            JSON.stringify(r.results[1].actual?.leadStage),
      )
      .map((r: any) => r.caseId),
  );

  const caseLoaded = data.scenarios.some((s: any) => s.id === "S13");
  const corrected =
    data.feedback.length > 0 ||
    data.leads.some((l: any) => l.snapshot.corrections.length);
  const compared = !!report;
  const allSignedOff = signedOff === data.scenarios.length;
  const released = data.promotions.length > 0;
  const stepState = (done: boolean, ready: boolean) =>
    done ? "done" : ready ? "now" : "waiting";

  return (
    <>
      <section className="card improve-intro">
        <div>
          <h3>One run, start to finish</h3>
          <p>
            Libbie gets a conversation wrong. You correct it. The correction
            becomes a saved test. A candidate version is measured against every
            saved test, a person signs off on the answers, and only then can the
            new version go live. Nothing here changes what clients see.
          </p>
        </div>
        <div className="improve-progress">
          {[caseLoaded, corrected, compared, allSignedOff, released].map(
            (done, i) => (
              <span key={i} className={done ? "pip done" : "pip"} />
            ),
          )}
          <small>
            {
              [caseLoaded, corrected, compared, allSignedOff, released].filter(
                Boolean,
              ).length
            }{" "}
            of 5 steps complete
          </small>
        </div>
      </section>

      <Step
        n={1}
        title="See the mistake"
        blurb="Load a conversation the current version reads incorrectly."
        state={stepState(caseLoaded, true)}
      >
        <p>
          The client writes <b>“We are not selling. We need to rent…”</b> The
          live version reads that as a <b>Seller</b>. That is the mistake this
          run fixes.
        </p>
        <div className="actions">
          <button disabled={busy} onClick={() => action("loadImprovement")}>
            Load the failing conversation <ArrowRight size={15} />
          </button>
          {caseLoaded && (
            <button className="secondary" onClick={() => setPage("Workspace")}>
              Open it in Workspace
            </button>
          )}
        </div>
        <details>
          <summary>Use a different test case</summary>
          <label>
            Test case
            <select
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
            >
              {data.scenarios.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.id} · {s.title}
                </option>
              ))}
            </select>
          </label>
          <p className="micro">
            {scenario.validation} · {scenario.split} · family{" "}
            {scenario.familyId}
          </p>
          <div className="actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => action("reset", { scenarioId })}
            >
              Start this case as a fresh conversation
            </button>
            <button
              className="quiet"
              disabled={busy}
              onClick={() => action("generate", { scenarioId })}
            >
              Save a variation of it
            </button>
          </div>
          <p className="micro">
            A variation inherits its parent family and starts unreviewed.
          </p>
        </details>
      </Step>

      <Step
        n={2}
        title="Correct it, with evidence"
        blurb="A broker fixes the field and points at the message that proves it."
        state={stepState(corrected, caseLoaded)}
      >
        <p>
          In Workspace, open <b>Correct</b> on the lead brief, set the intent to
          the right value, choose the client message that proves it, and write
          why. The correction sticks to that conversation and is saved as
          something to test against later.
        </p>
        <div className="actions">
          <button className="secondary" onClick={() => setPage("Workspace")}>
            Go and correct it <ArrowRight size={15} />
          </button>
        </div>
        <h4>Saved from real use</h4>
        {data.feedback.length ? (
          data.feedback.map((f: any) => (
            <div className="result" key={f.id}>
              <span className="tag">{f.status}</span>
              <h4>{f.category}</h4>
              <p>{f.reason}</p>
              <small>
                {f.component || "Not yet attributed to a component"}
              </small>
            </div>
          ))
        ) : (
          <p className="micro">
            Nothing yet. Corrections and “report issue” in Workspace land here.
          </p>
        )}
      </Step>

      <Step
        n={3}
        title="Check the fix against every saved case"
        blurb="Same inputs, old version and new version, side by side."
        state={stepState(compared, corrected)}
      >
        <p>
          Both versions replay the identical saved conversations. You get the
          count of cases <b>fixed</b> and, just as important, cases the change{" "}
          <b>broke</b>.
        </p>
        <div className="form-grid">
          <label>
            Version in use today
            <select
              value={baseline}
              onChange={(e) => setBaseline(e.target.value)}
            >
              {data.versions.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Proposed version
            <select
              value={candidate}
              onChange={(e) => setCandidate(e.target.value)}
            >
              {data.versions.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="actions">
          <button
            disabled={busy}
            onClick={() => action("evaluate", { baseline, candidate })}
          >
            {busy ? "Comparing…" : "Run the comparison"}
          </button>
          {data.evaluations.length > 1 && (
            <label className="inline-select">
              Earlier run
              <select
                value={report?.id || ""}
                onChange={(e) => setReportId(e.target.value)}
              >
                {data.evaluations.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.at.slice(0, 16).replace("T", " ")} ·{" "}
                    {gateLabel[r.gate] || r.gate}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <p className="micro">
          v2 adds a landlord ambiguity warning. v3 fixes explicitly negated
          selling. Extraction and replay are deterministic in every mode.
        </p>
        {report && (
          <>
            <div className="metrics">
              <section className="card">
                <small>CASES FIXED</small>
                <h2>{report.fixed ?? 0}</h2>
                <small>were wrong before, right now</small>
              </section>
              <section className="card">
                <small>CASES BROKEN</small>
                <h2>{report.regressions}</h2>
                <small>were right before, wrong now</small>
              </section>
              <section className="card">
                <small>SIGNED OFF BY A PERSON</small>
                <h2>
                  {report.reviewed}
                  <small> / {report.total}</small>
                </h2>
                <small>cases in this comparison</small>
              </section>
              <section className="card">
                <small>RELEASE STATUS</small>
                <h2 className="gate">
                  {gateLabel[report.gate] || report.gate}
                </h2>
              </section>
            </div>
            <p>{gateHelp[report.gate]}</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Conversation</th>
                    <th>{baseline} · today</th>
                    <th>{candidate} · proposed</th>
                    <th>Signed off</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((r: any) => (
                    <tr key={r.caseId}>
                      <td>
                        <b>{r.caseId}</b> {r.title}
                      </td>
                      {r.results.map((v: any) => (
                        <td key={v.version}>
                          <span
                            className={"tag " + (v.passed ? "green" : "amber")}
                          >
                            {v.passed ? "Correct" : "Wrong"}
                          </span>
                          <small>{v.errors.join(", ")}</small>
                        </td>
                      ))}
                      <td>
                        {r.reviewed ? (
                          <span className="tag green">Yes</span>
                        ) : (
                          <button
                            className="quiet"
                            onClick={() => {
                              setScenarioId(r.caseId);
                              setReviewText("");
                              document
                                .getElementById("sign-off")
                                ?.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            Sign off →
                          </button>
                        )}
                      </td>
                      <td>
                        <details>
                          <summary>Inspect</summary>
                          <Json value={r} />
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <details>
              <summary>What this evidence is, and is not</summary>
              <p>{report.uncertainty}</p>
              <p>
                {report.exposure} · measured in {report.latencyMs.toFixed(1)} ms
                · cost and token usage unavailable for scripted replay.
              </p>
              {report.fieldMetrics && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>Intent agreement</th>
                        <th>Stage agreement</th>
                        <th>Area agreement</th>
                        <th>Whole cases</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.fieldMetrics.map((m: any) => (
                        <tr key={m.version}>
                          <td>{m.version}</td>
                          {Object.values(m.fields).map((f: any, i: number) => (
                            <td key={i}>
                              {f.matched}/{f.total}
                            </td>
                          ))}
                          <td>
                            {m.wholeCases}/{report.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button
                className="quiet"
                onClick={() => download(report, "libbie-comparison.json")}
              >
                Export this comparison
              </button>
            </details>
          </>
        )}
        <details>
          <summary>Where we started · the supplied legacy benchmark</summary>
          <p>
            {data.legacy.totalFieldMatches}/{data.legacy.totalFields} field
            matches (
            {(
              (100 * data.legacy.totalFieldMatches) /
              data.legacy.totalFields
            ).toFixed(1)}
            %). {data.legacy.wholeConversationMatches}/{data.legacy.rows}{" "}
            whole-conversation matches. Seller recall 3/8. These describe the
            supplied system and its imperfect labels, not this application.
          </p>
          <p className="micro">
            Row 19: a seller classified as Buyer, AED 8 million omitted. Row 4:
            an explicit AED 4.2 million offer supports Negotiation. The CSV has
            no transcripts, so no population-level claim follows from 50 rows.
          </p>
        </details>
      </Step>

      <Step
        n={4}
        title="A person signs off on the answers"
        blurb="The machine never grades its own homework."
        state={stepState(allSignedOff, compared)}
      >
        <div className="signoff-head" id="sign-off">
          <div>
            <h4>
              {signedOff} of {data.scenarios.length} cases signed off
            </h4>
            <p className="micro">
              Release needs every case signed off, and at least the original 12.
            </p>
          </div>
          <button
            className="secondary"
            onClick={() => {
              const next = data.scenarios.find(
                (s: any) => latestFor(s.id)?.status !== "accepted",
              );
              if (next) {
                setScenarioId(next.id);
                setReviewText("");
              }
            }}
          >
            Next case needing sign-off
          </button>
        </div>
        <div className="signoff-queue">
          {data.scenarios.map((s: any) => {
            const a = latestFor(s.id);
            return (
              <button
                key={s.id}
                className={
                  "queue-item " +
                  (s.id === scenarioId ? "selected " : "") +
                  (a?.status === "accepted" ? "ok" : "")
                }
                onClick={() => {
                  setScenarioId(s.id);
                  setReviewText("");
                }}
              >
                <b>
                  {s.id}
                  {disputed.has(s.id) && (
                    <span
                      className="disputed-dot"
                      title="The versions disagree here"
                    />
                  )}
                </b>
                <small>{a ? statusLabel[a.status] : "Not reviewed"}</small>
              </button>
            );
          })}
        </div>
        <div className="two-col">
          <section className="card">
            <div className="section-head">
              <h4>What the client actually wrote</h4>
              <span className="mono">{scenario.id}</span>
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={blind}
                onChange={(e) => {
                  setBlind(e.target.checked);
                  setReviewText("");
                }}
              />
              Hide the machine’s answer while I decide
            </label>
            {scenario.publicOpening.map((m: any, i: number) => (
              <blockquote key={i}>
                <b>{m.sender}</b>
                <p>{m.text}</p>
              </blockquote>
            ))}
          </section>
          <section className="card">
            <h4>Your answer</h4>
            <p className="micro">
              Pre-filled with what the version in use today says. Change
              anything that is wrong before you sign off. Saved next to the
              original expectation, never over it — a signed-off case is
              development evidence, not production accuracy.
            </p>
            {disputed.has(scenario.id) && (
              <p className="warning">
                The two versions disagree on this conversation. Decide which one
                is right from the messages on the left. Signing off the wrong
                answer here blocks the release rather than hiding the problem.
              </p>
            )}
            {!blind && (
              <button
                className="secondary"
                onClick={() => {
                  const snap = scenario.proposal;
                  if (!snap) {
                    setError("Still loading this case. Try again shortly.");
                    return;
                  }
                  setReviewText(
                    JSON.stringify(
                      {
                        clientType: snap.clientType,
                        leadStage: snap.leadStage,
                        acceptedAreas: snap.areas
                          .filter((a: any) => a.status === "accepted")
                          .map((a: any) => a.name),
                        money: snap.money,
                      },
                      null,
                      2,
                    ),
                  );
                }}
              >
                Reload the machine’s answer
              </button>
            )}
            <label>
              Reviewer
              <input
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
              />
            </label>
            <ReferenceEditor value={reviewText} onChange={setReviewText} />
            <div className="actions">
              {[
                ["accepted", "This is correct · sign off"],
                ["ambiguous", "Genuinely unclear"],
                ["needs_adjudication", "Needs a second opinion"],
              ].map(([status, label]) => (
                <button
                  className={status === "accepted" ? "" : "secondary"}
                  key={status}
                  disabled={busy}
                  onClick={async () => {
                    let value = null;
                    try {
                      value = reviewText ? JSON.parse(reviewText) : null;
                    } catch {
                      setError("That answer is not valid JSON.");
                      return;
                    }
                    const ok = await action("review", {
                      scenarioId,
                      status,
                      blind,
                      reviewer,
                      value,
                    });
                    if (ok) {
                      const next = data.scenarios.find(
                        (s: any) =>
                          s.id !== scenarioId &&
                          latestFor(s.id)?.status !== "accepted",
                      );
                      if (next) setScenarioId(next.id);
                      setReviewText("");
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <details>
              <summary>Sign-off history · {data.annotations.length}</summary>
              <Json value={data.annotations} />
            </details>
          </section>
        </div>
      </Step>

      <Step
        n={5}
        title="Release it, and keep the receipt"
        blurb="An explicit decision with a reason, reversible in one click."
        state={stepState(released, allSignedOff && compared)}
      >
        {report?.gate === "passed_demo_gates" ? (
          <p className="green">
            Every case passes and every case is signed off. {candidate} can go
            live.
          </p>
        ) : (
          <p className="warning">
            <Lock size={14} /> Release is blocked.{" "}
            {report
              ? gateHelp[report.gate]
              : "Run the comparison in step 3 first."}
          </p>
        )}
        <div className="actions">
          <button
            disabled={busy || report?.gate !== "passed_demo_gates"}
            onClick={() =>
              action("promote", {
                reportId: report.id,
                versionId: report.candidate,
                reason:
                  "Broker reviewed the comparison and accepted the change",
              })
            }
          >
            Make {report?.candidate || candidate} the live version
          </button>
          <button
            className="secondary"
            disabled={busy || !data.promotions.length}
            onClick={() => action("rollback")}
          >
            Undo the last release
          </button>
        </div>
        <h4>How the system changed over time</h4>
        <ol className="timeline">
          {data.promotions.length ? (
            data.promotions.map((p: any) => (
              <li key={p.id}>
                <span className="mono">
                  {p.at.slice(0, 16).replace("T", " ")}
                </span>
                <b>
                  {p.previous} → {p.next}
                </b>
                <p>{p.reason}</p>
                <small>
                  by {p.actor}
                  {p.reportId ? ` · evidence ${p.reportId.slice(0, 8)}` : ""}
                </small>
              </li>
            ))
          ) : (
            <li>
              <span className="mono">—</span>
              <b>{data.workspace.active} in use since setup</b>
              <p>No version change has been released yet.</p>
            </li>
          )}
        </ol>
        <motion.p
          className="micro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Live version right now: <b>{data.workspace.active}</b>. Every release
          and undo stays in this history with the evidence it was based on.
        </motion.p>
      </Step>
    </>
  );
}
