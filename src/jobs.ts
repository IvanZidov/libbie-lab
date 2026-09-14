import { all, get, put, id, atomic, once, snapshot, hash } from "./repository";
import { generate, simulatorInput, assistantInput } from "./models";
import { act, command } from "./service";
export function enqueue(raw: any) {
  const c = command.parse(raw);
  return once(c.key, () => {
    const l = get(c.leadId!, "lead");
    if (l.revision !== c.expectedRevision)
      throw Error("Revision conflict. Refresh before retrying.");
    if (c.action === "step" && l.status !== "running")
      throw Error("Start the simulation first.");
    if (l.snapshot.stop || (l.snapshot.nurture && l.clock < l.snapshot.nurture))
      throw Error("Contact policy blocks this action.");
    if (
      all("job").some(
        (j) => j.leadId === l.id && ["queued", "running"].includes(j.status),
      )
    )
      throw Error("This lead already has an active job.");
    const job = put("job", {
      id: id(),
      type: c.action === "step" ? "live_step" : "live_draft",
      status: "queued",
      leadId: l.id,
      revision: l.revision,
      correctionHash: hash(l.snapshot.corrections),
      version: get("workspace").active,
      progress: 0,
      attempts: 0,
      at: new Date().toISOString(),
    });
    return {
      message: "Live call queued. Its result or error will appear here.",
      jobId: job.id,
    };
  });
}
export async function work() {
  const job = atomic(() => {
    const active = all("job");
    if (
      active.filter((j) => j.status === "running" && j.lease > Date.now())
        .length >= Number(process.env.MAX_PARALLEL_RUNS || 2)
    )
      return null;
    const j = active.find(
      (j) =>
        ["live_step", "live_draft", "scripted_batch"].includes(j.type) &&
        (j.status === "queued" ||
          (j.status === "running" && j.lease < Date.now())),
    );
    if (!j) return null;
    return put("job", {
      ...j,
      status: "running",
      lease: Date.now() + 90000,
      attempts: j.attempts + 1,
    });
  });
  if (!job) return;
  try {
    const lead = get(job.leadId, "lead");
    if (lead.status === "paused" && job.type !== "live_draft") {
      put("job", { ...job, status: "paused" });
      return;
    }
    if (job.type === "scripted_batch") {
      const scenario = get(lead.scenarioId, "scenario");
      const next = scenario.scriptedReplies.find(
        (r: any) => !lead.usedTriggers.includes(r.trigger),
      );
      if (!next || job.completed >= job.limit) {
        put("job", { ...job, status: "completed", progress: 100 });
        return;
      }
      const asks: Record<string, string> = {
        confirm_area:
          "Is Arabian Ranches your preference, or would Mudon work too?",
        ask_budget: "Is that a firm budget limit?",
        ask_viewing_time: "Can you view Saturday at 10:00?",
        ask_cosy_meaning: "What does cosy mean to you?",
        ask_metro_threshold: "What walking time to the metro would work?",
        ask_contact_cadence: "When and how often should I contact you?",
        confirm_stop: "Would you like me to stop contacting you?",
      };
      act({
        action: "message",
        key: job.id + "-broker-" + job.completed,
        leadId: lead.id,
        expectedRevision: lead.revision,
        data: {
          text: asks[next.trigger] || "Could you clarify your requirements?",
        },
      });
      const current = get(lead.id, "lead");
      act({
        action: "step",
        key: job.id + "-client-" + job.completed,
        leadId: lead.id,
        expectedRevision: current.revision,
        data: { trigger: next.trigger },
      });
      put("job", {
        ...job,
        status: job.completed + 1 >= job.limit ? "completed" : "queued",
        completed: job.completed + 1,
        progress: Math.round(((job.completed + 1) / job.limit) * 100),
      });
      return;
    }
    if (lead.revision !== job.revision)
      throw Error(
        "Stale job: conversation changed. Retry against the latest prefix.",
      );
    if (lead.turns >= Number(process.env.MAX_SIMULATION_TURNS || 12))
      throw Error("Simulation turn limit reached.");
    const result =
      job.result ??
      (await generate(
        job.type === "live_step" ? "simulator" : "assistant",
        job.type === "live_step"
          ? simulatorInput(get(lead.scenarioId, "scenario"), lead)
          : assistantInput(lead),
        { runId: lead.id, version: job.version },
      ));
    put("job", { ...job, result });
    atomic(() => {
      const current = get(lead.id, "lead");
      if (
        current.revision !== job.revision ||
        hash(current.snapshot.corrections) !== job.correctionHash
      )
        throw Error(
          "Stale live output: conversation changed. No reply appended.",
        );
      if (current.status === "paused" && job.type === "live_step")
        throw Error(
          "Run paused before append. Live reply retained in job trace.",
        );
      if (job.type === "live_draft") current.draft = result.output.text;
      else if (result.output.end) current.status = "completed";
      else if (!current.messages.some((m: any) => m.key === job.id)) {
        current.messages.push({
          id: id(),
          sender: "client",
          text: result.output.text,
          time: current.clock,
          key: job.id,
          channel: "simulated_whatsapp",
          modelCall: result.id,
        });
        current.revision++;
        current.turns++;
        snapshot(current);
      }
      put("lead", current);
      put("job", { ...job, result, status: "completed", progress: 100 });
    });
  } catch (e: any) {
    put("job", { ...job, status: "failed", error: e.message, progress: 0 });
  }
}
