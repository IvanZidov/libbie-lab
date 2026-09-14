import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import { extract } from "./domain";
mkdirSync("data", { recursive: true });
export const db = new DatabaseSync(process.env.LIBBIE_DB || "data/libbie.db");
db.exec(readFileSync("migrations/001_initial.sql", "utf8"));
export const hash = (x: any) =>
  createHash("sha256").update(JSON.stringify(x)).digest("hex");
export const sourceHash = () =>
  hash(
    [
      "src/domain.ts",
      "src/evaluation.ts",
      "src/service.ts",
      "src/models.ts",
      "src/jobs.ts",
      "src/repository.ts",
      "src/legacy.ts",
      "migrations/001_initial.sql",
      "prompts/extractor-v1.txt",
      "prompts/simulator-v1.txt",
      "prompts/assistant-v1.txt",
    ]
      .map((p) => readFileSync(p, "utf8"))
      .concat(
        JSON.stringify({
          mode: process.env.APP_MODE || "demo",
          provider: process.env.MODEL_PROVIDER || "none",
          runtime: process.env.RUNTIME_MODEL || null,
          simulator: process.env.SIMULATOR_MODEL || null,
        }),
      ),
  );
export const id = () => randomUUID();
export function put(kind: string, x: any) {
  db.prepare(
    "INSERT INTO records(id,kind,workspace,data) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
  ).run(x.id, kind, x.workspaceId || "demo", JSON.stringify(x));
  for (const relation of [
    "leadId",
    "scenarioId",
    "propertyId",
    "reportId",
    "correctionId",
  ])
    if (
      x[relation] &&
      db.prepare("SELECT id FROM records WHERE id=?").get(x[relation])
    )
      db.prepare("INSERT OR IGNORE INTO record_links VALUES(?,?,?)").run(
        x.id,
        x[relation],
        relation,
      );
  return x;
}
export function get(id: string, kind?: string): any {
  const r = db
    .prepare("SELECT data,kind FROM records WHERE id=? AND workspace=?")
    .get(id, "demo") as any;
  if (!r || (kind && r.kind !== kind))
    throw Error("Record not found in this workspace");
  return JSON.parse(r.data);
}
export function all(kind: string): any[] {
  return (
    db
      .prepare(
        "SELECT data FROM records WHERE kind=? AND workspace=? ORDER BY rowid",
      )
      .all(kind, "demo") as any[]
  ).map((r) => JSON.parse(r.data));
}
export function atomic(fn: () => any) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const r = fn();
    db.exec("COMMIT");
    return r;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function once(key: string, fn: () => any) {
  return atomic(() => {
    const r = db
      .prepare("SELECT result FROM requests WHERE key=?")
      .get(key) as any;
    if (r) return JSON.parse(r.result);
    const result = fn();
    db.prepare("INSERT INTO requests VALUES(?,?)").run(
      key,
      JSON.stringify(result),
    );
    return result;
  });
}
export function snapshot(lead: any) {
  const value = extract(
    lead.messages,
    all("correction").filter((c) => c.leadId === lead.id),
    get(get("workspace").active, "version").variant,
  );
  lead.snapshot = value;
  put("snapshot", {
    id: id(),
    leadId: lead.id,
    revision: lead.revision,
    value,
    version: get("workspace").active,
    at: new Date().toISOString(),
  });
  return put("lead", lead);
}
export function createRun(s: any) {
  const runId = id();
  const lead = {
    id: runId,
    scenarioId: s.id,
    title: s.title,
    revision: s.publicOpening.length,
    messages: s.publicOpening.map((m: any, i: number) => ({
      ...m,
      id: runId + "-" + i,
      time: s.virtualStart,
    })),
    clock: s.virtualStart,
    status: "paused",
    turns: 0,
    draft: "",
    usedTriggers: [],
  };
  return snapshot(lead);
}
export function seed() {
  if (all("workspace").length) return;
  put("workspace", {
    id: "workspace",
    active: "v1",
    clock: "2026-07-01",
    mode: "demo",
  });
  const fixture = JSON.parse(
    readFileSync("libbie-mvp-handoff/fixtures/scenarios.json", "utf8"),
  );
  for (const s of fixture.scenarios) put("scenario", s);
  for (const p of JSON.parse(
    readFileSync("libbie-mvp-handoff/fixtures/properties.json", "utf8"),
  ).properties)
    put("property", p);
  for (const v of [
    { id: "v1", name: "Baseline · deterministic rules", variant: "baseline" },
    {
      id: "v2",
      name: "Candidate · flag landlord ambiguity",
      variant: "candidate",
    },
  ])
    put("version", {
      ...v,
      hash: hash(v),
      schema: "1",
      model: "scripted",
      createdAt: new Date().toISOString(),
    });
  for (const s of fixture.scenarios) createRun(s);
}
seed();

// Additive registration never changes an existing version or the active pointer.
if (!all("version").some((v) => v.id === "v3")) {
  const v = {
    id: "v3",
    name: "Candidate · ignore explicitly negated selling",
    variant: "negated-selling",
  };
  put("version", {
    ...v,
    hash: hash(v),
    schema: "1",
    model: "scripted",
    createdAt: new Date().toISOString(),
  });
}
