import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
process.env.LIBBIE_DB = join(
  mkdtempSync(join(tmpdir(), "libbie-test-")),
  "test.db",
);
const ready = Promise.all([
  import("../src/service"),
  import("../src/repository"),
  import("../src/evaluation"),
  import("../src/jobs"),
  import("../src/models"),
]);
test("durable family flow, revision conflicts, idempotency, correction, paired evaluation and rollback", async () => {
  const [{ act, state }, { get, all, createRun }, { evaluate }] = await ready;
  let l = createRun(get("S01", "scenario"));
  const call = (action: string, data: any = {}, key = crypto.randomUUID()) => {
    const r = act({
      action,
      data,
      key,
      leadId: l.id,
      expectedRevision: l.revision,
    });
    l = get(l.id, "lead");
    return r;
  };
  const rev = l.revision,
    key = crypto.randomUUID();
  call("message", { text: "Would Mudon work?" }, key);
  act({
    action: "message",
    data: { text: "Would Mudon work?" },
    key,
    leadId: l.id,
    expectedRevision: rev,
  });
  assert.equal(get(l.id).revision, rev + 1);
  assert.throws(
    () =>
      act({
        action: "message",
        key: crypto.randomUUID(),
        leadId: l.id,
        expectedRevision: rev,
        data: { text: "stale" },
      }),
    /conflict/,
  );
  call("start");
  call("step", { trigger: "confirm_area" });
  call("message", { text: "Is 500k a firm limit?" });
  call("step", { trigger: "ask_budget" });
  assert.equal(l.snapshot.money.max, 520000);
  assert.deepEqual(
    l.snapshot.areas
      .filter((a: any) => a.status === "accepted")
      .map((a: any) => a.name),
    ["Mudon"],
  );
  call("brief", { request: "Find something cosy" });
  call("search", {
    cap: 520000,
    areas: ["Mudon"],
    style: "warm and homely",
    unknownPolicy: "conditional",
    approved: true,
  });
  assert.ok(l.search.results.length);
  assert.ok(
    l.search.results.every((r: any) => r.property.location === "Mudon"),
  );
  call("draft");
  assert.ok(l.draft);
  call("message", { text: "Can you view Saturday at 10:00?" });
  call("step", { trigger: "ask_viewing_time" });
  assert.equal(l.snapshot.leadStage, "Viewing");
  call("correct", {
    field: "leadStage",
    value: "Qualifying",
    messageId: l.messages.at(-1).id,
    reason: "Test reviewer deliberately corrects historical interpretation",
  });
  call("message", { text: "Thanks, we will confirm details." });
  assert.equal(l.snapshot.leadStage, "Qualifying");
  assert.ok(all("feedback").some((f) => f.leadId === l.id));
  const report = evaluate();
  assert.equal(report.gate, "insufficient_evidence");
  assert.equal(report.rows.length, 12);
  assert.throws(
    () =>
      call("promote", {
        reportId: report.id,
        versionId: "v2",
        reason: "test blocked",
      }),
    /blocked/,
  );
  // Test-only reference annotations exercise the gate. They never touch the user's database.
  for (const s of all("scenario")) {
    const expected = s.evaluatorOnly.expectedAtOpening;
    const { extract } = await import("../src/domain");
    const actual = extract(
      s.publicOpening.map((m: any, i: number) => ({ ...m, id: String(i) })),
    );
    call("review", {
      scenarioId: s.id,
      status: "accepted",
      reviewer: "AUTOMATED TEST ACTOR",
      blind: false,
      value: { ...expected, leadStage: actual.leadStage, money: actual.money },
    });
  }
  const eligible = evaluate();
  assert.equal(eligible.gate, "passed_demo_gates");
  call("promote", {
    reportId: eligible.id,
    versionId: "v2",
    reason: "Automated test of atomic pointer only",
  });
  assert.equal(get("workspace").active, "v2");
  call("rollback");
  assert.equal(get("workspace").active, "v1");
  assert.equal(all("promotion").length, 2);
  assert.throws(() => get("SYN-P012", "property"), /not found/);
  const publicState = JSON.stringify(state());
  assert.ok(!publicState.includes("privatePersona"));
  assert.ok(!publicState.includes("evaluatorOnly"));
  assert.ok(!publicState.includes("maximumIfAsked"));
  assert.ok(!publicState.includes("expectedAtOpening"));
  const output = execFileSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "-e",
      `import('./src/repository.ts').then(m=>{const r=m.default||m; console.log(r.get('${l.id}').snapshot.leadStage)})`,
    ],
    { cwd: process.cwd(), env: process.env, encoding: "utf8" },
  );
  assert.match(output, /Qualifying/);
});
test("scripted persisted jobs pause, resume and finish within turn limits", async () => {
  const [{ act }, { get, createRun, all }, {}, { work }] = await ready;
  let l = createRun(get("S01"));
  const call = (action: string, data: any = {}) => {
    act({
      action,
      key: crypto.randomUUID(),
      leadId: l.id,
      expectedRevision: l.revision,
      data,
    });
    l = get(l.id);
  };
  call("start");
  call("batch", { limit: 2 });
  await work();
  l = get(l.id);
  assert.equal(l.turns, 1);
  call("pause");
  await work();
  assert.equal(get(l.id).turns, 1);
  call("start");
  await work();
  assert.equal(get(l.id).turns, 2);
  assert.equal(
    all("job")
      .filter((j) => j.leadId === l.id)
      .at(-1).status,
    "completed",
  );
});
test("live gateway validates output, captures usage, and rejects malformed replies without fallback", async () => {
  const [
    {},
    { all, get, createRun },
    {},
    {},
    { generate, simulatorInput, assistantInput },
  ] = await ready;
  process.env.MODEL_PROVIDER = "openai";
  process.env.MODEL_API_KEY = "test-only-not-a-real-key";
  process.env.SIMULATOR_MODEL = "mock-model";
  const l = createRun(get("S01"));
  const sim = simulatorInput(get("S01"), l);
  assert.ok(sim.persona);
  assert.ok(!JSON.stringify(sim).includes("evaluatorOnly"));
  assert.ok(!JSON.stringify(assistantInput(l)).includes("maximumIfAsked"));
  const mock: any = async () =>
    new Response(
      JSON.stringify({
        id: "mock-response",
        status: "completed",
        model: "mock-model",
        usage: { input_tokens: 10, output_tokens: 8 },
        output: [
          {
            content: [
              {
                type: "output_text",
                text: JSON.stringify({ text: "Mudon would work.", end: false }),
              },
            ],
          },
        ],
      }),
      { status: 200 },
    );
  const result = await generate(
    "simulator",
    sim,
    { runId: l.id, version: "v1" },
    mock,
  );
  assert.equal(result.usage.input_tokens, 10);
  const bad: any = async () =>
    new Response(
      JSON.stringify({
        status: "completed",
        output: [{ content: [{ type: "output_text", text: "not JSON" }] }],
      }),
    );
  await assert.rejects(
    () => generate("simulator", sim, { runId: l.id, version: "v1" }, bad),
    /invalid/,
  );
  assert.equal(get(l.id).revision, 8);
  assert.ok(all("modelCall").some((c) => c.status === "invalid_output"));
  const timeout: any = async () => {
    throw new DOMException("timeout", "TimeoutError");
  };
  await assert.rejects(
    () => generate("simulator", sim, { runId: l.id, version: "v1" }, timeout),
    /timed out/,
  );
  delete process.env.MODEL_API_KEY;
  delete process.env.MODEL_PROVIDER;
});

test("expired job leases recover and property changes invalidate enrichment", async () => {
  const [{ act }, { get, put, id, all, createRun }, {}, { work }] = await ready;
  const lead = createRun(get("S01"));
  put("lead", { ...lead, status: "running" });
  const job = put("job", {
    id: id(),
    type: "scripted_batch",
    leadId: lead.id,
    status: "running",
    lease: Date.now() - 1,
    attempts: 1,
    limit: 1,
    completed: 0,
    progress: 0,
  });
  await work();
  assert.equal(get(job.id).status, "completed");
  assert.equal(get(lead.id).turns, 1);
  act({
    action: "enrich",
    key: crypto.randomUUID(),
    data: { propertyId: "SYN-P001" },
  });
  const p = get("SYN-P001");
  act({
    action: "propertyUpdate",
    key: crypto.randomUUID(),
    data: {
      propertyId: p.id,
      petsAllowed: true,
      availableFrom: "2026-07-15",
      description: p.description,
      reason: "Test broker verification",
    },
  });
  assert.equal(get(p.id).recordVersion, "2");
  assert.ok(
    all("attribute")
      .filter((a) => a.propertyId === p.id)
      .every((a) => a.status === "superseded"),
  );
  assert.ok(all("propertyVersion").some((v) => v.propertyId === p.id));
});

test("improvement replay fixes a real failure and every added case needs review", async () => {
  const [{ act }, { get, all }, { evaluate }] = await ready;
  act({ action: "loadImprovement", key: crypto.randomUUID(), data: {} });
  const failed = evaluate("v1", "v2");
  assert.equal(failed.gate, "failed_gates");
  assert.equal(
    failed.rows.find((r: any) => r.caseId === "S13").results[1].actual
      .clientType,
    "Seller",
  );
  const fixed = evaluate("v1", "v3");
  assert.equal(fixed.fixed, 1);
  assert.equal(fixed.regressions, 0);
  assert.equal(fixed.reviewed, 12);
  assert.equal(fixed.total, 13);
  assert.equal(fixed.gate, "insufficient_evidence");
  assert.equal(get("workspace").active, "v1");
  assert.ok(all("scenario").some((s) => s.id === "S13"));
});
