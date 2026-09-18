"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import {
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  Search,
  ChevronsUpDown,
  FlaskConical,
  CheckCheck,
  PanelLeft,
  X,
  ChevronRight,
  MessageCircle,
  GraduationCap,
} from "lucide-react";
import {
  BrandMark,
  NavIcon,
  Requirement,
  Transcript,
  PropertyDrawing,
  Json,
  download,
  leadTitles,
} from "./components/interface";
import { PropertyDrawer } from "./components/drawer";
import { Improve } from "./components/improve";
import { Tutorial, hasSeenTour } from "./components/tutorial";
import { nextAction, legacy } from "../src/domain";
const nav = ["Workspace", "Improve", "Settings"];
const money = (n: number) => new Intl.NumberFormat("en-AE").format(n);
export default function App() {
  const propertyTriggerRef = useRef<HTMLButtonElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef<Record<string, number>>({});
  const [leadQuery, setLeadQuery] = useState("");
  const [data, setData] = useState<any>(null),
    [page, setPage] = useState("Workspace"),
    [leadId, setLeadId] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [draft, setDraft] = useState(""),
    [request, setRequest] = useState(
      "Find me some properties for this lead, somewhere cosy",
    ),
    [cap, setCap] = useState(500000),
    [area, setArea] = useState(""),
    [style, setStyle] = useState("warm and homely"),
    [policy, setPolicy] = useState("conditional"),
    [approved, setApproved] = useState(false),
    [trigger, setTrigger] = useState("confirm_area"),
    [correction, setCorrection] = useState(false),
    [field, setField] = useState("leadStage"),
    [value, setValue] = useState('"Qualifying"'),
    [reason, setReason] = useState(""),
    [evidence, setEvidence] = useState(""),
    [propId, setPropId] = useState(""),
    [traits, setTraits] = useState<any>(null),
    [clock, setClock] = useState("2026-12-01T09:00"),
    [sort, setSort] = useState("activity"),
    [petUpdate, setPetUpdate] = useState("unknown"),
    [availableUpdate, setAvailableUpdate] = useState(""),
    [descriptionUpdate, setDescriptionUpdate] = useState(""),
    [propertyReason, setPropertyReason] = useState(""),
    [tour, setTour] = useState(false);
  useEffect(() => {
    if (!hasSeenTour()) setTour(true);
  }, []);
  const refresh = async () => {
    const r = await fetch("/api/action?view=" + encodeURIComponent(page)).then(
      (r) => r.json(),
    );
    if (!r.ok) throw Error(r.error);
    setData(r.data);
    return r.data;
  };
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, [page]);
  useEffect(() => {
    if (!data?.jobs.some((j: any) => ["queued", "running"].includes(j.status)))
      return;
    const timer = setInterval(
      () => refresh().catch((e) => setError(e.message)),
      1500,
    );
    return () => clearInterval(timer);
  }, [data?.jobs, page]);
  const lead =
    data?.leads.find((l: any) => l.id === leadId) ||
    data?.leads.find((l: any) => l.scenarioId === "S01") ||
    data?.leads[0];
  useEffect(() => {
    if (lead) {
      setApproved(false);
      setEvidence(lead.messages.at(-1).id);
      setArea(
        lead.snapshot.areas
          .filter((a: any) => a.status === "accepted")
          .map((a: any) => a.name)
          .join(", "),
      );
      setCap(
        (lead.snapshot.money.max ?? lead.snapshot.money.target ?? 500000) *
          (lead.snapshot.money.period === "month" ? 12 : 1),
      );
    }
  }, [lead?.id, lead?.revision]);
  useEffect(() => {
    if (lead) setDraft(lead.draft || "");
  }, [lead?.id, lead?.draft]);
  useEffect(() => {
    const node = transcriptRef.current;
    if (node) node.scrollTop = scrollPositions.current[lead?.id] ?? 0;
  }, [lead?.id, page]);
  async function action(action: string, payload: any = {}, selected = lead) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          key: crypto.randomUUID(),
          leadId: selected?.id,
          expectedRevision: selected?.revision,
          data: payload,
        }),
      }).then((r) => r.json());
      if (!r.ok) throw Error(r.error);
      setNotice(r.data.message);
      const fresh = await refresh();
      if (r.data.leadId) setLeadId(r.data.leadId);
      if (action === "draft" && !r.data.jobId)
        setDraft(fresh.leads.find((l: any) => l.id === selected.id).draft);
      if (r.data.traits) setTraits(r.data.traits);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (!data || !lead)
    return (
      <main className="loading">
        <span className="logo">
          <BrandMark />
        </span>
        <h1>Opening your workspace</h1>
        <p>{error || "Loading the local simulation lab…"}</p>
      </main>
    );
  const s = lead.snapshot,
    property = data.properties.find((p: any) => p.id === propId),
    activeScenario = data.scenarios.find((s: any) => s.id === lead.scenarioId);
  const switchLead = (l: any) => {
    if (draft !== lead.draft) action("saveDraft", { text: draft });
    setLeadId(l.id);
    setCorrection(false);
  };
  const areaList = area
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const brief = (
    <>
      <div className="section-head">
        <h3>Review search</h3>
        <span className="tag amber">Broker approval required</span>
      </div>
      <p>
        Confirmed bedrooms, garden and pool remain in the brief. “Around” is a
        target. Approve a working cap before searching.
      </p>
      <div className="form-grid">
        <label>
          Working cap · AED/year
          <input
            type="number"
            min="1"
            value={cap}
            onChange={(e) => {
              setCap(Number(e.target.value));
              setApproved(false);
            }}
          />
        </label>
        <label>
          Approved areas · comma separated
          <input
            value={area}
            placeholder={
              lead.brief?.proposedAreas.join(", ") || "Confirm an area"
            }
            onChange={(e) => {
              setArea(e.target.value);
              setApproved(false);
            }}
          />
        </label>
        <label>
          Meaning of cosy
          <input value={style} onChange={(e) => setStyle(e.target.value)} />
        </label>
        <label>
          Unknown required facts
          <select value={policy} onChange={(e) => setPolicy(e.target.value)}>
            <option value="conditional">Show as conditional options</option>
            <option value="exclude">Exclude unverified options</option>
          </select>
        </label>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={approved}
          onChange={(e) => setApproved(e.target.checked)}
        />
        I approve these working assumptions for this search.
      </label>
      {!areaList.length && (
        <p className="hint">
          A search needs at least one working area you approve. The conversation
          has not confirmed one yet
          {lead.brief?.proposedAreas.length
            ? " — Libbie suggests " + lead.brief.proposedAreas.join(" or ")
            : ""}
          .
          {lead.brief?.proposedAreas.map((a: string) => (
            <button
              className="quiet"
              key={a}
              onClick={() => {
                setArea(a);
                setApproved(false);
              }}
            >
              Use {a}
            </button>
          ))}
        </p>
      )}
      <button
        disabled={busy || !approved || !areaList.length}
        onClick={() =>
          action("search", {
            cap,
            areas: areaList,
            style,
            unknownPolicy: policy,
            approved,
          })
        }
      >
        Run search
      </button>
      <details>
        <summary>Requirements and interpretation trace</summary>
        <Json value={lead.brief} />
      </details>
    </>
  );
  const shortlist = lead.search && (
    <section className="card">
      <div className="section-head">
        <h3>Your shortlist</h3>
        <span className="mono">{lead.search.results.length} records</span>
      </div>
      {(lead.search.revision !== lead.revision || lead.search.invalidated) && (
        <p className="warning">
          Conversation changed. Review and run a fresh search.
        </p>
      )}
      {!lead.search.results.some((r: any) => r.kind === "verified") && (
        <p className="warning">
          No homes are verified to meet all confirmed requirements.
        </p>
      )}
      {["verified", "conditional"].map((kind) => (
        <div key={kind}>
          <h4>
            {kind === "verified"
              ? "Verified factual matches"
              : "Conditional options"}
          </h4>
          {lead.search.results
            .filter((r: any) => r.kind === kind)
            .map((r: any) => (
              <div className="result" key={r.property.id}>
                <div className="section-head">
                  <strong>{r.property.location}</strong>
                  <span>
                    AED {money(r.property.price.amount)}/
                    {r.property.price.period}
                  </span>
                </div>
                <span className="mono">
                  {r.property.id} · {r.property.bedrooms} beds ·{" "}
                  {r.property.poolType || "no"} pool
                </span>
                <p className="green">
                  Physical requirements match the approved filters.
                </p>
                <p>{r.fit}</p>
                {r.unknowns.map((u: string) => (
                  <span className="tag amber" key={u}>
                    {u}
                  </span>
                ))}
                <details>
                  <summary>Description evidence</summary>
                  <p>{r.styleEvidence}</p>
                </details>
              </div>
            ))}
        </div>
      ))}
      <details>
        <summary>Inspect stored decision trace</summary>
        <Json value={lead.search} />
      </details>
      <div className="actions">
        <button
          className="secondary"
          onClick={() =>
            action("feedback", {
              reason: "Shortlist marked useful by broker",
              category: "useful",
            })
          }
        >
          Mark useful
        </button>
        <button
          className="quiet"
          onClick={() => {
            setCorrection(true);
            setReason("Poor shortlist: ");
          }}
        >
          Report issue
        </button>
      </div>
    </section>
  );
  return (
    <MotionConfig reducedMotion="user">
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <span className="logo">
              <BrandMark />
            </span>
            <div>
              <b>
                libbie<span className="brand-light"> lab</span>
              </b>
              <small>A broker’s second brain</small>
            </div>
          </div>
          <div className="workspace-switch">
            <div className="workspace-monogram">TV</div>
            <div>
              <b>TextValue</b>
              <small>Simulation workspace</small>
            </div>
            <ChevronsUpDown size={14} />
          </div>
          <div className="workspace-label">WORKSPACE</div>
          <nav aria-label="Primary navigation">
            {nav.map((n, i) => (
              <button
                className={page === n ? "nav active" : "nav"}
                key={n}
                onClick={() => setPage(n)}
                aria-label={n}
                aria-current={page === n ? "page" : undefined}
              >
                {page === n && (
                  <motion.span
                    className="nav-highlight"
                    layoutId="active-navigation"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
                <NavIcon index={i} />
                <span className="nav-label">{n}</span>
                {n === "Improve" && (
                  <i>
                    {
                      data.feedback.filter((f: any) => f.status === "pending")
                        .length
                    }
                  </i>
                )}
                {page === n && <span className="nav-active-dot" />}
              </button>
            ))}
          </nav>
          <div className="sidebar-lab">
            <FlaskConical size={20} />
            <b>A safe space to get better.</b>
            <p>
              Try a conversation. Inspect a decision. Learn from the difference.
            </p>
            <button onClick={() => setPage("Improve")}>
              Open the improvement run <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="sidebar-foot">
            <div className="profile-avatar">IZ</div>
            <div>
              <b>Ivan Židov</b>
              <small>by TextValue</small>
            </div>
            <span className="status-dot" title="Local workspace" />
          </div>
        </aside>
        <main>
          <header>
            <div className="crumb">
              <PanelLeft size={17} />
              <span className="crumb-root">Workspace</span>
              <ChevronRight size={13} />
              <b>{page}</b>
            </div>
            <div className="header-right">
              <span className="runtime-pill">
                <span className="status-dot" />
                System {data.workspace.active}
              </span>
              <button className="quiet tour-open" onClick={() => setTour(true)}>
                <GraduationCap size={14} /> How this works
              </button>
              <div className="tag simulation">
                <FlaskConical size={13} /> Simulation{" "}
                <span>
                  ·{" "}
                  {data.settings.mode === "live"
                    ? "Live configuration"
                    : "Scripted client"}
                </span>
              </div>
            </div>
            {busy && (
              <motion.div
                className="working-line"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 0.85 }}
                transition={{ duration: 1.5 }}
              />
            )}
          </header>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={page}
              className="page-content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="page-head">
                <div>
                  <div className="eyebrow">
                    LIBBIE LAB <span>/</span> YOUR DAILY WORKSPACE
                  </div>
                  <h1>
                    {page === "Workspace"
                      ? "A little context. A better next step."
                      : page === "Improve"
                        ? "Teach it once. Prove it. Then release it."
                        : page}
                  </h1>
                  <p>
                    {page === "Workspace"
                      ? "Your conversations, requirements and next moves. All in one place."
                      : page === "Improve"
                        ? "Five steps from a mistake to a released, reversible fix."
                        : "Local runtime, transparent limits, and no real client outreach."}
                  </p>
                </div>
                <div className="page-context">
                  <div className="context-orbit">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <b>
                      {page === "Workspace"
                        ? data.leads.length + " conversations"
                        : "Simulation mode"}
                    </b>
                    <small>Fictional clients. Real learning.</small>
                  </div>
                </div>
              </div>
              {error && (
                <div role="alert" className="alert error">
                  {error}
                  <button className="quiet" onClick={() => setError("")}>
                    Dismiss
                  </button>
                </div>
              )}
              {notice && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="status"
                  className="alert notice"
                >
                  <CheckCheck size={17} />
                  {notice}
                </motion.div>
              )}
              {page === "Workspace" && (
                <>
                  <a className="mobile-summary" href="#lead-summary">
                    Lead summary ↓
                  </a>
                  <section className="card ask">
                    <span className="assistant-icon">
                      <Sparkles size={21} />
                    </span>
                    <div>
                      <h3>Ask Libbie</h3>
                      <p>Private to you · never sent to the client</p>
                      <div className="inline">
                        <input
                          aria-label="Ask Libbie"
                          value={request}
                          onChange={(e) => setRequest(e.target.value)}
                        />
                        <button
                          disabled={busy}
                          onClick={() => action("brief", { request })}
                        >
                          Review search <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  </section>
                  <div className="workspace-grid">
                    <section className="card leads">
                      <label className="mobile-lead-select">
                        Conversation
                        <select
                          value={lead.id}
                          onChange={(e) =>
                            switchLead(
                              data.leads.find(
                                (l: any) => l.id === e.target.value,
                              ),
                            )
                          }
                        >
                          {data.leads.map((l: any) => (
                            <option key={l.id} value={l.id}>
                              {l.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="section-head">
                        <h3>
                          Conversations{" "}
                          <span className="count">{data.leads.length}</span>
                        </h3>
                      </div>
                      <label className="lead-search">
                        <Search size={15} />
                        <input
                          aria-label="Find conversation"
                          placeholder="Find a conversation…"
                          value={leadQuery}
                          onChange={(e) => setLeadQuery(e.target.value)}
                        />
                      </label>
                      <select
                        aria-label="Sort leads"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        <option value="activity">Latest activity</option>
                        <option value="action">
                          Needs action: unresolved areas first
                        </option>
                      </select>
                      {[...data.leads]
                        .filter(
                          (l: any) =>
                            !leadQuery ||
                            (
                              l.title +
                              " " +
                              l.messages.map((m: any) => m.text).join(" ")
                            )
                              .toLowerCase()
                              .includes(leadQuery.toLowerCase()),
                        )
                        .sort((a: any, b: any) =>
                          sort === "action"
                            ? Number(
                                !!a.snapshot.areas.find(
                                  (x: any) => x.status === "accepted",
                                ),
                              ) -
                              Number(
                                !!b.snapshot.areas.find(
                                  (x: any) => x.status === "accepted",
                                ),
                              )
                            : 0,
                        )
                        .map((l: any) => (
                          <button
                            key={l.id}
                            className={
                              "lead " + (lead.id === l.id ? "selected" : "")
                            }
                            onClick={() => switchLead(l)}
                          >
                            <span className="avatar">
                              {l.scenarioId === "S01"
                                ? "FM"
                                : l.scenarioId.slice(-2)}
                            </span>
                            <div>
                              <b>{leadTitles[l.scenarioId] || l.title}</b>
                              <small>
                                {l.snapshot.clientType || "Intent unresolved"} ·{" "}
                                {l.snapshot.leadStage || "Needs context"}
                              </small>
                              <p>{l.messages.at(-1).text}</p>
                              <span className="micro">
                                {l.snapshot.corrections.length
                                  ? "Human correction active"
                                  : "Needs review"}{" "}
                                · rev {l.revision}
                              </span>
                            </div>
                          </button>
                        ))}
                    </section>
                    <section className="card conversation">
                      <div className="conversation-head">
                        <span className="avatar blue">
                          {lead.scenarioId === "S01"
                            ? "FM"
                            : lead.scenarioId.slice(-2)}
                        </span>
                        <div>
                          <h3>
                            {lead.scenarioId === "S01"
                              ? "Family · a place to call home"
                              : lead.title}
                          </h3>
                          <small>Fictional lead · simulated WhatsApp</small>
                        </div>
                        <span className="tag">
                          {s.clientType || "Unresolved"}
                        </span>
                      </div>
                      <div
                        className="transcript"
                        ref={(node) => {
                          transcriptRef.current = node;
                          if (node)
                            node.scrollTop =
                              scrollPositions.current[lead.id] ?? 0;
                        }}
                        onScroll={(e) => {
                          scrollPositions.current[lead.id] =
                            e.currentTarget.scrollTop;
                        }}
                      >
                        <div className="chat-date">
                          {new Date(lead.clock).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}{" "}
                          · simulated time
                        </div>
                        <Transcript
                          messages={lead.messages}
                          clock={lead.clock}
                        />
                      </div>
                      <div className="composer">
                        <div className="section-head">
                          <span className="mono">TO SIMULATED CLIENT</span>
                          <button
                            className="quiet"
                            disabled={busy}
                            onClick={() => action("draft")}
                          >
                            <Sparkles size={14} /> Draft reply
                          </button>
                        </div>
                        <textarea
                          aria-label="Broker reply"
                          placeholder="Write a thoughtful next message…"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                        />
                        <div className="section-head">
                          <button
                            className="quiet"
                            disabled={busy}
                            onClick={() => action("saveDraft", { text: draft })}
                          >
                            Save draft
                          </button>
                          <button
                            disabled={busy || !draft.trim()}
                            onClick={async () => {
                              if (await action("message", { text: draft }))
                                setDraft("");
                            }}
                          >
                            Send to simulated client <ArrowUpRight size={15} />
                          </button>
                        </div>
                        <div className="client-turn">
                          <span className="mono">THEN THE CLIENT REPLIES</span>
                          <div className="inline">
                            <label className="sr-label" htmlFor="reply-trigger">
                              What you asked about
                            </label>
                            <select
                              id="reply-trigger"
                              value={trigger}
                              onChange={(e) => setTrigger(e.target.value)}
                            >
                              <option value="">What did you ask about?</option>
                              {activeScenario?.triggers.map((t: string) => (
                                <option key={t}>
                                  {t.replaceAll("_", " ")}
                                </option>
                              ))}
                            </select>
                            <button
                              className="secondary"
                              disabled={busy}
                              onClick={() =>
                                action("step", {
                                  trigger: trigger.replaceAll(" ", "_"),
                                })
                              }
                            >
                              Client replies <ArrowRight size={15} />
                            </button>
                          </div>
                          <small>
                            {lead.status} · turn {lead.turns} of{" "}
                            {data.settings.maxTurns} · this simulated client
                            only answers the topics listed above
                          </small>
                          <details>
                            <summary>Run controls</summary>
                            <div className="actions">
                              <button
                                className="quiet"
                                disabled={busy}
                                onClick={() => action("start")}
                              >
                                Start / resume
                              </button>
                              <button
                                className="quiet"
                                disabled={busy}
                                onClick={() => action("pause")}
                              >
                                Pause
                              </button>
                              <button
                                className="quiet"
                                disabled={busy}
                                onClick={() => action("batch", { limit: 4 })}
                              >
                                Run up to 4 turns
                              </button>
                            </div>
                            <label>
                              Move the simulated clock
                              <input
                                type="datetime-local"
                                value={clock}
                                onChange={(e) => setClock(e.target.value)}
                              />
                            </label>
                            <button
                              className="quiet"
                              onClick={() =>
                                action("clock", {
                                  clock: new Date(clock).toISOString(),
                                })
                              }
                            >
                              Apply the new time
                            </button>
                            {data.jobs
                              .filter((j: any) => j.leadId === lead.id)
                              .map((j: any) => (
                                <div className="result" key={j.id}>
                                  <span className="tag">
                                    {j.type} · {j.status} · {j.progress}%
                                  </span>
                                  {j.error && (
                                    <p className="warning">{j.error}</p>
                                  )}
                                  {j.status === "failed" && (
                                    <button
                                      className="quiet"
                                      onClick={() =>
                                        action("retry", { jobId: j.id })
                                      }
                                    >
                                      Retry
                                    </button>
                                  )}
                                </div>
                              ))}
                          </details>
                        </div>
                      </div>
                    </section>
                    <aside id="lead-summary" className="brief-column">
                      <section className="card next-action">
                        <div className="eyebrow">
                          <Sparkles size={14} /> NEXT BEST ACTION{" "}
                          <span className="action-live-dot" />
                        </div>
                        <svg className="scribble" aria-hidden="true">
                          <use href="/branding/scribbles.svg#wave" />
                        </svg>
                        <h2>{nextAction(s, lead.clock)}</h2>
                        <p>
                          {s.evidence.moveBefore?.quote ||
                            "Use the visible conversation as evidence. A promise to line up homes does not agree a viewing."}
                        </p>
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() => action("draft")}
                        >
                          Draft reply <ArrowRight size={15} />
                        </button>
                      </section>
                      <section className="card">
                        <div className="section-head">
                          <h3>The lead brief</h3>
                          <button
                            className="quiet"
                            onClick={() => setCorrection(!correction)}
                          >
                            Correct
                          </button>
                        </div>
                        <dl>
                          <dt>Intent</dt>
                          <dd>{s.clientType || "Unknown"}</dd>
                          <dt>Stage</dt>
                          <dd>{s.leadStage || "Unresolved"}</dd>
                          <dt>Budget</dt>
                          <dd>
                            {s.money.max || s.money.target
                              ? `AED ${money(s.money.max ?? s.money.target)} / ${s.money.period}`
                              : "Not stated"}
                            <small>
                              {s.money.meaning} · client wording preserved
                            </small>
                          </dd>
                        </dl>
                        <div className="divider" />
                        <h4>What matters</h4>
                        <div className="tags">
                          {Object.entries(s.requirements).map(([k, v]) => (
                            <Requirement key={k} name={k} value={v} />
                          ))}
                        </div>
                        <h4>Areas</h4>
                        {s.areas.length ? (
                          s.areas.map((a: any) => (
                            <p className="area" key={a.name}>
                              {a.name}
                              <span
                                className={
                                  "tag " +
                                  (a.status === "accepted" ? "green" : "amber")
                                }
                              >
                                {a.status}
                              </span>
                            </p>
                          ))
                        ) : (
                          <p>No area confirmed.</p>
                        )}
                        <h4>Still to check</h4>
                        <p>
                          Pet permission and availability need listing evidence.
                          Readiness is based on commitments, timing and
                          blockers.
                        </p>
                        {s.conflicts.map((c: string) => (
                          <p className="warning" key={c}>
                            {c}
                          </p>
                        ))}
                        <details>
                          <summary>Source quotes & four-field export</summary>
                          {Object.entries(s.evidence).map(([k, v]: any) => (
                            <blockquote key={k}>
                              <b>{k}</b>
                              <a href={"#message-" + v.messageId}>{v.quote}</a>
                            </blockquote>
                          ))}
                          <Json value={legacy(s)} />
                        </details>
                      </section>
                    </aside>
                  </div>
                  {lead.brief && <section className="card">{brief}</section>}
                  {shortlist}
                  {correction && (
                    <section className="card correction">
                      <h3>Correct with evidence</h3>
                      <p>
                        A correction applies to this lead and survives later
                        extraction. It also creates a development failure.
                      </p>
                      <div className="form-grid">
                        <label>
                          Field
                          <select
                            value={field}
                            onChange={(e) => {
                              setField(e.target.value);
                              setValue(
                                JSON.stringify(s[e.target.value], null, 2),
                              );
                            }}
                          >
                            {[
                              "leadStage",
                              "clientType",
                              "areas",
                              "money",
                              "requirements",
                            ].map((f) => (
                              <option key={f}>{f}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Source message
                          <select
                            value={evidence}
                            onChange={(e) => setEvidence(e.target.value)}
                          >
                            {lead.messages.map((m: any) => (
                              <option value={m.id} key={m.id}>
                                {m.sender}: {m.text.slice(0, 90)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      {["clientType", "leadStage"].includes(field) ? (
                        <label>
                          Corrected value
                          <select
                            value={JSON.parse(value) || ""}
                            onChange={(e) =>
                              setValue(JSON.stringify(e.target.value || null))
                            }
                          >
                            <option value="">Unresolved</option>
                            {(field === "clientType"
                              ? ["Buyer", "Seller", "Renter", "Landlord"]
                              : [
                                  "Inquiry",
                                  "Qualifying",
                                  "Viewing",
                                  "Negotiation",
                                ]
                            ).map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <label>
                          Corrected structured value · JSON
                          <textarea
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                          />
                        </label>
                      )}
                      <label>
                        Reason
                        <input
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </label>
                      <div className="actions">
                        <button
                          disabled={busy}
                          onClick={() => {
                            try {
                              action("correct", {
                                field,
                                value: JSON.parse(value),
                                reason,
                                messageId: evidence,
                              });
                            } catch {
                              setError("Corrected value must be valid JSON.");
                            }
                          }}
                        >
                          Save human correction
                        </button>
                        <button
                          className="secondary"
                          onClick={() =>
                            action("feedback", {
                              reason,
                              category: "poor shortlist",
                            })
                          }
                        >
                          Record issue only
                        </button>
                      </div>
                    </section>
                  )}
                  <details className="card inventory">
                    <summary>
                      Inventory · {data.properties.length} fictional records,
                      facts and unknowns kept apart
                    </summary>
                    <div className="inventory-note">
                      <span className="tag">13 workspace records</span>
                      <p>
                        14 seeded records include 1 separate-workspace exclusion
                        fixture. No property photographs are supplied.
                      </p>
                    </div>
                    <div className="property-grid">
                      {data.properties.map((p: any) => (
                        <button
                          className="card property"
                          key={p.id}
                          onClick={(event) => {
                            propertyTriggerRef.current = event.currentTarget;
                            setPropId(p.id);
                            setTraits(null);
                            setPetUpdate(
                              p.petsAllowed === null
                                ? "unknown"
                                : String(p.petsAllowed),
                            );
                            setAvailableUpdate(p.availableFrom || "");
                            setDescriptionUpdate(p.description);
                          }}
                        >
                          <PropertyDrawing
                            index={Number(p.id.replace(/\D/g, ""))}
                          />
                          <div className="section-head">
                            <span className="mono">{p.id}</span>
                            <span className="tag">{p.status}</span>
                          </div>
                          <h3>{p.location}</h3>
                          <h2>
                            AED {money(p.price.amount)}
                            <small> / {p.price.period}</small>
                          </h2>
                          <p>
                            {p.bedrooms} beds · {p.poolType || "No"} pool ·
                            Garden {p.garden ? "yes" : "no"}
                          </p>
                          <span className="micro">
                            Fictional listing · updated{" "}
                            {p.updatedAt.slice(0, 10)}
                          </span>
                        </button>
                      ))}
                    </div>
                    <PropertyDrawer
                      open={!!property}
                      onClose={() => setPropId("")}
                      returnFocus={propertyTriggerRef}
                    >
                      {property && (
                        <section className="card">
                          <h2>
                            {property.id} · {property.location}
                          </h2>
                          <p>{property.description}</p>
                          <div className="property-facts">
                            <div>
                              <span>Price</span>
                              <strong>
                                AED {money(property.price.amount)}
                                <small>per {property.price.period}</small>
                              </strong>
                            </div>
                            <div>
                              <span>Bedrooms</span>
                              <strong>{property.bedrooms}</strong>
                            </div>
                            <div>
                              <span>Pool</span>
                              <strong>{property.poolType || "None"}</strong>
                            </div>
                            <div>
                              <span>Garden</span>
                              <strong>{property.garden ? "Yes" : "No"}</strong>
                            </div>
                            <div>
                              <span>Pets</span>
                              <strong>
                                {property.petsAllowed === null
                                  ? "Unverified"
                                  : property.petsAllowed
                                    ? "Allowed"
                                    : "Not allowed"}
                              </strong>
                            </div>
                            <div>
                              <span>Available from</span>
                              <strong>
                                {property.availableFrom || "Unverified"}
                              </strong>
                            </div>
                          </div>
                          <details>
                            <summary>Inspect canonical record</summary>
                            <Json value={property} />
                          </details>
                          <h4>Broker-verified updates</h4>
                          {property.verifiedUpdate && (
                            <p>
                              {property.verifiedUpdate.reason} ·{" "}
                              {property.verifiedUpdate.at}
                            </p>
                          )}
                          <details>
                            <summary>Record a verified update</summary>
                            <label>
                              Pet permission
                              <select
                                value={petUpdate}
                                onChange={(e) => setPetUpdate(e.target.value)}
                              >
                                <option value="unknown">Unknown</option>
                                <option value="true">Allowed</option>
                                <option value="false">Not allowed</option>
                              </select>
                            </label>
                            <label>
                              Available from
                              <input
                                type="date"
                                value={availableUpdate}
                                onChange={(e) =>
                                  setAvailableUpdate(e.target.value)
                                }
                              />
                            </label>
                            <label>
                              Description
                              <textarea
                                value={descriptionUpdate}
                                onChange={(e) =>
                                  setDescriptionUpdate(e.target.value)
                                }
                              />
                            </label>
                            <label>
                              Verification source / reason
                              <input
                                value={propertyReason}
                                onChange={(e) =>
                                  setPropertyReason(e.target.value)
                                }
                              />
                            </label>
                            <button
                              disabled={busy}
                              onClick={() =>
                                action("propertyUpdate", {
                                  propertyId: property.id,
                                  petsAllowed:
                                    petUpdate === "unknown"
                                      ? null
                                      : petUpdate === "true",
                                  availableFrom: availableUpdate || null,
                                  description: descriptionUpdate,
                                  reason: propertyReason,
                                })
                              }
                            >
                              Save broker update
                            </button>
                          </details>
                          <h4>Unknowns</h4>
                          <p>
                            {property.petsAllowed === null
                              ? "Pet permission unverified. "
                              : ""}
                            {!property.availableFrom
                              ? "Availability unverified. "
                              : ""}
                            Walking distance and measured quietness are
                            unverified.
                          </p>
                          <button
                            disabled={busy}
                            onClick={() =>
                              action("enrich", { propertyId: property.id })
                            }
                          >
                            Re-enrich
                          </button>
                          {traits && <Json value={traits} />}
                          <details>
                            <summary>Attribute version history</summary>
                            <Json
                              value={data.attributes.filter(
                                (a: any) => a.propertyId === property.id,
                              )}
                            />
                          </details>
                          <details>
                            <summary>
                              Enrichment walkthrough illustration
                            </summary>
                            <img
                              className="concept"
                              src="/branding/villa-concept.png"
                              alt="Concept illustration of a villa, not a seeded property"
                            />
                            <p>
                              Concept illustration only. Not a photo of this
                              property.
                            </p>
                          </details>
                        </section>
                      )}
                    </PropertyDrawer>
                  </details>
                </>
              )}
              {page === "Improve" && (
                <Improve
                  data={data}
                  action={action}
                  busy={busy}
                  setError={setError}
                  setPage={setPage}
                />
              )}
              {page === "Settings" && (
                <div className="two-col">
                  <section className="card">
                    <h3>Runtime configuration</h3>
                    <dl>
                      <dt>Workspace</dt>
                      <dd>Simulation · local only</dd>
                      <dt>Mode</dt>
                      <dd>{data.settings.mode}</dd>
                      <dt>Provider</dt>
                      <dd>{data.settings.provider}</dd>
                      <dt>API key</dt>
                      <dd>
                        {data.settings.keyConfigured
                          ? "Configured on server"
                          : "Not configured"}
                      </dd>
                      <dt>Simulator model</dt>
                      <dd>{data.settings.simulator}</dd>
                      <dt>Runtime model</dt>
                      <dd>{data.settings.runtime}</dd>
                      <dt>Turn limit</dt>
                      <dd>{data.settings.maxTurns}</dd>
                    </dl>
                    <p>
                      Credentials belong in server environment variables.
                      Restart the server after changing .env.local. Keys are
                      never returned to this page.
                    </p>
                    <h4>Live provider</h4>
                    <p>
                      Live mode uses the configured provider for client replies
                      and draft replies. Extraction, search and replay
                      evaluations remain explicitly deterministic. Live failures
                      stay visible and never become scripted replies.
                    </p>
                  </section>
                  <section className="card">
                    <h3>Data and versions</h3>
                    <p>
                      Conversations, corrections, searches, annotations,
                      comparisons and promotions persist in SQLite.
                    </p>
                    <button
                      className="secondary"
                      onClick={() =>
                        download(
                          {
                            scenarios: data.scenarios,
                            properties: data.properties,
                          },
                          "libbie-public-fixtures.json",
                        )
                      }
                    >
                      Export public fixture data
                    </button>
                    <h4>Actual model usage</h4>
                    <Json value={data.modelCalls} />
                    <h4>Version registry</h4>
                    <Json value={data.versions} />
                    <p>
                      No automatic prompt updates. Promotion requires reviewed
                      references and an eligible report.
                    </p>
                  </section>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <Tutorial
            open={tour}
            onClose={() => setTour(false)}
            onFinish={() => {
              setTour(false);
              setPage("Improve");
            }}
          />
          <footer>
            Libbie Lab <span>by TextValue / Ivan Židov</span>
            <span>Synthetic development workspace · no real messages sent</span>
            <a href="mailto:ivan@textvalue.ai">ivan@textvalue.ai</a>
            <a
              href="https://www.linkedin.com/in/ivan-zidov/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
          </footer>
        </main>
      </div>
    </MotionConfig>
  );
}
function ReferenceEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  let ref: any;
  try {
    ref = JSON.parse(value);
  } catch {
    ref = {
      clientType: null,
      leadStage: null,
      acceptedAreas: [],
      money: {
        meaning: "unknown",
        period: null,
        target: null,
        min: null,
        max: null,
      },
    };
  }
  const update = (key: string, v: any) =>
    onChange(JSON.stringify({ ...ref, [key]: v }, null, 2));
  return (
    <>
      <div className="form-grid">
        <label>
          Client intent
          <select
            value={ref.clientType || ""}
            onChange={(e) => update("clientType", e.target.value || null)}
          >
            <option value="">Unresolved</option>
            {["Buyer", "Seller", "Renter", "Landlord"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Furthest supported stage
          <select
            value={ref.leadStage || ""}
            onChange={(e) => update("leadStage", e.target.value || null)}
          >
            <option value="">Unresolved</option>
            {["Inquiry", "Qualifying", "Viewing", "Negotiation"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Accepted areas · separate with commas
        <input
          value={ref.acceptedAreas.join(", ")}
          onChange={(e) =>
            update(
              "acceptedAreas",
              e.target.value
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            )
          }
        />
      </label>
      <div className="form-grid">
        <label>
          Money meaning
          <select
            value={ref.money.meaning}
            onChange={(e) =>
              update("money", { ...ref.money, meaning: e.target.value })
            }
          >
            {[
              "unknown",
              "target",
              "maximum",
              "range",
              "offer",
              "asking_price",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Price period
          <select
            value={ref.money.period || ""}
            onChange={(e) =>
              update("money", { ...ref.money, period: e.target.value || null })
            }
          >
            <option value="">Unknown</option>
            {["year", "month", "purchase"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        {["target", "min", "max"].map((k) => (
          <label key={k}>
            {k} · AED
            <input
              type="number"
              min="0"
              value={ref.money[k] ?? ""}
              onChange={(e) =>
                update("money", {
                  ...ref.money,
                  [k]: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </label>
        ))}
      </div>
      <details>
        <summary>Structured reference</summary>
        <Json value={ref} />
      </details>
    </>
  );
}
