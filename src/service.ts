import { readFileSync } from "node:fs";
import { legacyBenchmark } from "./legacy";
import { z } from "zod";
import {
  all,
  get,
  put,
  id,
  once,
  snapshot,
  createRun,
  hash,
  sourceHash,
} from "./repository";
import { extract, propose, search, nextAction } from "./domain";
import { evaluate } from "./evaluation";
export const command = z.object({
  action: z.enum([
    "message",
    "step",
    "pause",
    "start",
    "reset",
    "clock",
    "draft",
    "saveDraft",
    "brief",
    "search",
    "correct",
    "feedback",
    "review",
    "evaluate",
    "promote",
    "rollback",
    "enrich",
    "generate",
    "batch",
    "retry",
    "propertyUpdate",
    "loadImprovement",
  ]),
  key: z.string().min(1),
  leadId: z.string().optional(),
  expectedRevision: z.number().int().optional(),
  data: z.record(z.string(), z.any()).default({}),
});
export function state(view = "Workspace") {
  return {
    legacy: legacyBenchmark(),
    workspace: get("workspace"),
    leads: all("lead").sort(
      (a, b) => new Date(b.clock).getTime() - new Date(a.clock).getTime(),
    ),
    properties: all("property"),
    scenarios: all("scenario").map(
      ({ privatePersona, evaluatorOnly, scriptedReplies, ...s }) => ({
        ...s,
        proposal:
          view === "Improve"
            ? extract(
                s.publicOpening.map((m: any, i: number) => ({
                  ...m,
                  id: s.id + "-" + i,
                })),
              )
            : undefined,
        triggers: scriptedReplies.map((r: any) => r.trigger),
      }),
    ),
    feedback: all("feedback"),
    annotations: view === "Improve" ? all("annotation") : [],
    evaluations: view === "Improve" ? all("evaluation") : [],
    versions: all("version"),
    promotions: all("promotion"),
    jobs: all("job").map(({ result, ...j }) => j),
    modelCalls: all("modelCall").map(({ output, ...c }) => c),
    attributes: all("attribute"),
    settings: {
      mode: process.env.APP_MODE || "demo",
      provider: process.env.MODEL_PROVIDER || "none",
      keyConfigured: !!process.env.MODEL_API_KEY,
      simulator: process.env.SIMULATOR_MODEL || "unconfigured",
      runtime: process.env.RUNTIME_MODEL || "unconfigured",
      maxTurns: Number(process.env.MAX_SIMULATION_TURNS || 12),
    },
  };
}
export function act(raw: unknown) {
  const c = command.parse(raw);
  return once(c.key, () => {
    const d = c.data;
    const l = c.leadId ? get(c.leadId, "lead") : null;
    const current = () => {
      if (!l || c.expectedRevision !== l.revision)
        throw Error(
          "Revision conflict. Refresh and review the latest conversation.",
        );
    };
    const append = (sender: string, text: string) => {
      current();
      if (
        sender === "broker" &&
        (l.snapshot.stop ||
          (l.snapshot.nurture && l.clock < l.snapshot.nurture))
      )
        throw Error("Contact policy blocks this simulated send.");
      l.messages.push({
        id: id(),
        sender,
        text: z.string().trim().min(1).max(6000).parse(text),
        time: l.clock,
        channel: "simulated_whatsapp",
        key: c.key,
      });
      l.revision++;
      l.clock = new Date(new Date(l.clock).getTime() + 60000).toISOString();
      return snapshot(l);
    };
    switch (c.action) {
      case "message": {
        append("broker", d.text);
        l.draft = "";
        put("lead", l);
        return { message: "Sent to simulated client only." };
      }
      case "saveDraft":
        current();
        l.draft = z.string().max(6000).parse(d.text);
        put("lead", l);
        return { message: "Draft saved." };
      case "draft":
        current();
        if (
          l.snapshot.stop ||
          (l.snapshot.nurture && l.clock < l.snapshot.nurture)
        )
          throw Error(nextAction(l.snapshot, l.clock));
        l.draft = l.snapshot.nurture
          ? "You asked me to check back in December. Have your plans or requirements changed?"
          : l.snapshot.clientType === "Seller"
            ? "Can we confirm the valuation time and the details you would like included in the listing?"
            : l.snapshot.clientType === "Landlord"
              ? "Have you had a chance to discuss letting the apartment? What asking rent would you like us to consider?"
              : "Would Mudon work for you? What times can you view? I’ll check pet permission and move-in dates before confirming homes.";
        put("lead", l);
        return { message: "Draft ready for your review." };
      case "step": {
        current();
        if (l.status === "paused")
          throw Error("Start the run before requesting a client reply.");
        if (l.turns >= Number(process.env.MAX_SIMULATION_TURNS || 12))
          throw Error("Simulation turn limit reached.");
        if (process.env.APP_MODE === "live")
          throw Error(
            "Live mode requires the asynchronous provider runner. Use the documented adapter test; this UI is scripted only.",
          );
        const s = get(l.scenarioId, "scenario"),
          reply = s.scriptedReplies.find((r: any) => r.trigger === d.trigger);
        if (!reply)
          throw Error(
            "No scripted response for this input. Choose an available trigger.",
          );
        if (l.usedTriggers.includes(d.trigger))
          throw Error("This trigger has already been used in this run.");
        append("client", reply.text);
        l.usedTriggers.push(d.trigger);
        l.turns++;
        put("lead", l);
        return { message: "One scripted client reply received." };
      }
      case "start":
      case "pause":
        current();
        for (const job of all("job").filter(
          (j) => j.leadId === l.id && j.status === "paused",
        ))
          if (c.action === "start") put("job", { ...job, status: "queued" });
        l.status = c.action === "start" ? "running" : "paused";
        put("lead", l);
        return { message: l.status };
      case "reset":
        return {
          leadId: createRun(get(d.scenarioId || l?.scenarioId, "scenario")).id,
          message: "Created a new run. Previous history retained.",
        };
      case "clock":
        current();
        l.clock = z.iso.datetime({ offset: true }).parse(d.clock);
        put("lead", l);
        return { message: "Simulated clock updated." };
      case "brief":
        current();
        if (!["Buyer", "Renter"].includes(l.snapshot.clientType))
          throw Error(
            "This intent needs owner support, not a property search.",
          );
        l.brief = propose(l.snapshot, l.revision);
        l.brief.request = z.string().min(1).max(2000).parse(d.request);
        put("lead", l);
        return {
          message:
            "Review the proposed interpretation and approve search assumptions.",
        };
      case "search": {
        current();
        if (!l.brief || l.brief.revision !== l.revision)
          throw Error("Search brief is stale. Ask Libbie again.");
        const edits = z
          .object({
            cap: z
              .number()
              .positive(
                "Set a working budget cap above zero before searching.",
              ),
            areas: z
              .array(z.string())
              .min(
                1,
                "Approve at least one working area before running a search.",
              ),
            style: z
              .string()
              .min(1, "Say what the client's wording means, in a few words.")
              .max(200),
            unknownPolicy: z.enum(["conditional", "exclude"]),
            approved: z.literal(
              true,
              "Tick the approval box before running a search.",
            ),
          })
          .parse(d);
        const brief = { ...l.brief, ...edits };
        const results = search(all("property"), brief);
        const run = put("search", {
          id: id(),
          leadId: l.id,
          revision: l.revision,
          brief,
          approvedBy: "local broker",
          version: get("workspace").active,
          inventoryHash: hash(all("property")),
          messageIds: l.messages.map((m: any) => m.id),
          corrections: l.snapshot.corrections,
          results,
          at: new Date().toISOString(),
          usage: null,
        });
        l.search = run;
        l.brief = brief;
        put("lead", l);
        return {
          message: `${results.length} eligible records. Unknowns remain conditional.`,
        };
      }
      case "correct": {
        current();
        const field = z
          .enum(["clientType", "leadStage", "areas", "money", "requirements"])
          .parse(d.field);
        let value = d.value;
        if (field === "clientType")
          value = z
            .enum(["Buyer", "Seller", "Renter", "Landlord"])
            .nullable()
            .parse(value);
        if (field === "leadStage")
          value = z
            .enum(["Inquiry", "Qualifying", "Viewing", "Negotiation"])
            .nullable()
            .parse(value);
        if (field === "areas")
          value = z
            .array(
              z.object({
                name: z.string(),
                status: z.enum(["accepted", "rejected", "unconfirmed"]),
                evidence: z.string(),
              }),
            )
            .parse(value);
        if (field === "money")
          value = z
            .object({
              meaning: z.enum([
                "unknown",
                "target",
                "maximum",
                "range",
                "offer",
                "asking_price",
              ]),
              period: z.enum(["year", "month", "purchase"]).nullable(),
              target: z.number().nonnegative().nullable(),
              min: z.number().nonnegative().nullable(),
              max: z.number().nonnegative().nullable(),
              rawText: z.string(),
            })
            .parse(value);
        if (field === "requirements")
          value = z
            .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
            .parse(value);
        const evidence = l.messages.find((m: any) => m.id === d.messageId);
        if (!evidence) throw Error("Select source evidence.");
        const correction = put("correction", {
          id: id(),
          leadId: l.id,
          field,
          value,
          original: l.snapshot[field],
          reason: z.string().min(3).parse(d.reason),
          evidence,
          reviewer: "local broker",
        });
        l.brief = null;
        if (l.search) l.search.invalidated = true;
        snapshot(l);
        put("feedback", {
          id: id(),
          leadId: l.id,
          scenarioId: l.scenarioId,
          category: d.category || "extraction",
          reason: d.reason,
          correctionId: correction.id,
          status: "development",
          component: "extraction",
          evidence,
        });
        return {
          message:
            "Human override saved. Failure added to development evidence.",
        };
      }
      case "feedback":
        current();
        put("feedback", {
          id: id(),
          leadId: l.id,
          scenarioId: l.scenarioId,
          category: d.category || "usefulness",
          reason: z.string().min(3).parse(d.reason),
          output: l.search || l.snapshot,
          status: "pending",
          reviewer: "local broker",
        });
        return { message: "Feedback recorded." };
      case "review": {
        const s = get(d.scenarioId, "scenario"),
          status = z
            .enum(["accepted", "ambiguous", "needs_adjudication"])
            .parse(d.status);
        let value = d.value;
        if (status === "accepted")
          value = z
            .object({
              clientType: z
                .enum(["Buyer", "Seller", "Renter", "Landlord"])
                .nullable(),
              leadStage: z
                .enum(["Inquiry", "Qualifying", "Viewing", "Negotiation"])
                .nullable(),
              acceptedAreas: z.array(z.string()),
              money: z
                .object({
                  meaning: z.enum([
                    "unknown",
                    "target",
                    "maximum",
                    "range",
                    "offer",
                    "asking_price",
                  ]),
                  period: z.enum(["year", "month", "purchase"]).nullable(),
                  target: z.number().nullable(),
                  min: z.number().nullable(),
                  max: z.number().nullable(),
                })
                .passthrough(),
            })
            .parse(value);
        put("annotation", {
          id: id(),
          scenarioId: s.id,
          status,
          value,
          blind: !!d.blind,
          reviewer: z.string().min(1).parse(d.reviewer),
          evidence: s.publicOpening,
          at: new Date().toISOString(),
        });
        return {
          message: "Annotation saved separately from the original fixture.",
        };
      }
      case "evaluate": {
        const job = put("job", {
          id: id(),
          type: "evaluation",
          status: "running",
          progress: 0,
        });
        const report = evaluate(d.baseline || "v1", d.candidate || "v2");
        put("job", {
          ...job,
          status: "completed",
          progress: 100,
          reportId: report.id,
        });
        return {
          message: `Comparison completed: ${report.gate}`,
          reportId: report.id,
        };
      }
      case "promote": {
        const r = get(d.reportId, "evaluation"),
          v = get(d.versionId, "version");
        if (
          r.sourceHash !== sourceHash() ||
          r.mode !== "scripted replay" ||
          r.gate !== "passed_demo_gates" ||
          r.status !== "completed" ||
          r.candidate !== v.id ||
          r.versionHashes[1] !== v.hash
        )
          throw Error(
            "Promotion blocked: exact candidate needs a completed report that passes demo gates.",
          );
        const w = get("workspace");
        put("promotion", {
          id: id(),
          previous: w.active,
          next: v.id,
          reportId: r.id,
          actor: "local broker",
          reason: z.string().min(3).parse(d.reason),
          at: new Date().toISOString(),
        });
        w.active = v.id;
        put("workspace", w);
        return { message: "Candidate promoted for scripted simulation." };
      }
      case "rollback": {
        const w = get("workspace"),
          prior = all("promotion").at(-1);
        if (!prior) throw Error("No previous promotion to roll back.");
        put("promotion", {
          id: id(),
          previous: w.active,
          next: prior.previous,
          actor: "local broker",
          reason: "Explicit rollback",
          at: new Date().toISOString(),
        });
        w.active = prior.previous;
        put("workspace", w);
        return { message: "Previous version restored. History retained." };
      }
      case "propertyUpdate": {
        const p = get(d.propertyId, "property");
        const changes = z
          .object({
            petsAllowed: z.boolean().nullable(),
            availableFrom: z
              .string()
              .regex(/^\d{4}-\d{2}-\d{2}$/)
              .nullable(),
            description: z.string().min(1).max(10000),
            reason: z.string().min(3),
          })
          .parse(d);
        put("propertyVersion", { ...p, id: id(), propertyId: p.id });
        for (const a of all("attribute").filter((a) => a.propertyId === p.id))
          put("attribute", { ...a, status: "superseded" });
        const updated = {
          ...p,
          petsAllowed: changes.petsAllowed,
          availableFrom: changes.availableFrom,
          description: changes.description,
          recordVersion: String(Number(p.recordVersion) + 1),
          updatedAt: new Date().toISOString(),
          verifiedUpdate: {
            by: "local broker",
            reason: changes.reason,
            at: new Date().toISOString(),
          },
        };
        put("property", updated);
        for (const l of all("lead").filter((l) =>
          l.search?.results.some((r: any) => r.property.id === p.id),
        )) {
          l.search.invalidated = true;
          put("lead", l);
        }
        return {
          message:
            "Broker update saved. Prior record and attributes retained as history. Re-enrich the new version.",
        };
      }
      case "enrich": {
        const p = get(d.propertyId, "property");
        const traits = [
          "warm",
          "wood",
          "bright",
          "minimalist",
          "renovated",
          "cul-de-sac",
        ]
          .filter((t) => p.description.toLowerCase().includes(t))
          .map((t) => ({
            trait: t,
            quote: p.description,
            source: "description",
            status: "proposal",
            uncertainty: "Agent description, not independent verification",
          }));
        put("attribute", {
          id: id(),
          propertyId: p.id,
          recordVersion: p.recordVersion,
          traits,
          at: new Date().toISOString(),
        });
        return {
          message: `Created attribute version with ${traits.length} description-supported traits.`,
          traits,
        };
      }
      case "batch": {
        current();
        if (process.env.APP_MODE === "live")
          throw Error(
            "Automatic runs currently require scripted mode. Live runs use manual broker review.",
          );
        if (l.status !== "running") throw Error("Start the run first.");
        if (
          all("job").some(
            (j) =>
              j.leadId === l.id && ["running", "queued"].includes(j.status),
          )
        )
          throw Error("A job is already active.");
        const limit = z.number().int().min(1).max(12).parse(d.limit);
        put("job", {
          id: id(),
          type: "scripted_batch",
          leadId: l.id,
          status: "queued",
          attempts: 0,
          limit,
          completed: 0,
          progress: 0,
          approvedPolicy:
            "Broker questions for each explicit trigger; simulated sends only",
        });
        return { message: "Bounded automated simulation queued." };
      }
      case "retry": {
        const j = get(d.jobId, "job");
        if (!["failed", "paused"].includes(j.status))
          throw Error("Only failed or paused jobs may be retried.");
        const target = get(j.leadId, "lead");
        put("job", {
          ...j,
          status: "queued",
          revision: target.revision,
          correctionHash: hash(target.snapshot.corrections),
          result: undefined,
          error: undefined,
        });
        return { message: "Job queued for retry." };
      }
      case "loadImprovement": {
        const fixture = JSON.parse(
          readFileSync("fixtures/improvement-case.json", "utf8"),
        );
        if (!all("scenario").some((s) => s.id === fixture.id))
          put("scenario", fixture);
        const lead = createRun(get(fixture.id, "scenario"));
        return {
          leadId: lead.id,
          message:
            "Development failure loaded. v1/v2 misread negated selling; compare v3. Reference still needs human review.",
        };
      }
      case "generate": {
        const s = get(d.scenarioId, "scenario");
        const n = {
          ...s,
          id: id(),
          title: z
            .string()
            .min(3)
            .max(150)
            .parse(d.title || s.title + " · variation"),
          validation: "unreviewed",
          origin: "synthetic",
          parent: s.id,
        };
        n.publicOpening = [
          ...s.publicOpening,
          {
            sender: "client",
            text: z
              .string()
              .min(1)
              .max(2000)
              .parse(
                d.text || "Thanks. Please keep the requirements we discussed.",
              ),
          },
        ];
        put("scenario", n);
        return {
          message:
            "Scripted variation saved in the same development family. Human review required.",
        };
      }
    }
  });
}
