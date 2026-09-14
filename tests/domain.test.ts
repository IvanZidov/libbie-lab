import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extract, legacy, propose, search, nextAction } from "../src/domain";
const scenarios = JSON.parse(
  readFileSync("libbie-mvp-handoff/fixtures/scenarios.json", "utf8"),
).scenarios;
const inventory = JSON.parse(
  readFileSync("libbie-mvp-handoff/fixtures/properties.json", "utf8"),
).properties;
const messages = (id: string) =>
  scenarios
    .find((s: any) => s.id === id)
    .publicOpening.map((m: any, i: number) => ({ ...m, id: String(i) }));
test("family keeps source facts, proposal area, annual target and no invented viewing", () => {
  const s = extract(messages("S01"));
  assert.equal(s.clientType, "Renter");
  assert.equal(s.leadStage, "Qualifying");
  assert.equal(s.money.meaning, "target");
  assert.equal(s.money.target, 500000);
  assert.equal(s.requirements.dogs, 2);
  assert.equal(s.areas[0].status, "unconfirmed");
  for (const e of Object.values(s.evidence))
    assert.equal(
      messages("S01").find((m: any) => m.id === e.messageId).text,
      e.quote,
    );
});
test("speaker attribution and direction survive broker questions", () => {
  const seller = extract(messages("S02"));
  assert.equal(seller.clientType, "Seller");
  assert.equal(seller.money.target, 8000000);
  assert.equal(seller.leadStage, "Viewing");
  const landlord = extract(messages("S03"));
  assert.equal(landlord.clientType, "Landlord");
  assert.equal(landlord.money.target, null);
});
test("offers, ranges and monthly units remain separate", () => {
  assert.equal(extract(messages("S04")).money.meaning, "offer");
  const range = extract(messages("S07"));
  assert.equal(range.money.min, 450000);
  assert.equal(range.money.max, 500000);
  assert.equal(legacy(range).status, "unresolved");
  const monthly = extract(messages("S08"));
  assert.equal(monthly.money.max, 40000);
  assert.equal(propose(monthly, 3).cap, 480000);
});
test("chit-chat and corrections retain established state", () => {
  const base = messages("S01");
  assert.deepEqual(
    legacy(extract(base)),
    legacy(
      extract([
        ...base,
        { id: "new", sender: "client", text: "Thanks, have a good weekend!" },
      ]),
    ),
  );
  const corrected = extract(
    [
      ...base,
      { id: "new", sender: "client", text: "Saturday at 10:00 works for us." },
    ],
    [{ id: "c1", field: "leadStage", value: "Qualifying" }],
  );
  assert.equal(corrected.leadStage, "Qualifying");
  assert.deepEqual(corrected.corrections, ["c1"]);
  assert.ok(corrected.conflicts.length);
});
test("rejections update active set and never silently widen filters", () => {
  const s = extract([
    ...messages("S01"),
    {
      id: "area",
      sender: "client",
      text: "Mudon would work. Please skip Arabian Ranches.",
    },
  ]);
  const b = { ...propose(s, 9), approved: true };
  assert.deepEqual(b.areas, ["Mudon"]);
  assert.ok(b.rejected.includes("Arabian Ranches"));
  const results = search(inventory, b);
  assert.ok(
    results.every(
      (r) =>
        r.property.location === "Mudon" && r.property.workspaceId === "demo",
    ),
  );
  assert.throws(
    () => search(inventory, { ...b, areas: ["Arabian Ranches"] }),
    /Rejected/,
  );
});
test("unknown required facts stay conditional and injected IDs never appear", () => {
  const b = { ...propose(extract(messages("S11")), 3), approved: true };
  const found = search(inventory, b);
  assert.ok(found.length);
  assert.ok(
    found.every((r) => inventory.some((p: any) => p.id === r.property.id)),
  );
  for (const r of found)
    if (r.property.petsAllowed === null) assert.equal(r.kind, "conditional");
  assert.ok(!found.some((r) => r.property.id === "SYN-P012"));
});
test("no match, unapproved search and stop policy fail closed", () => {
  const s = extract(messages("S12"));
  assert.deepEqual(search(inventory, { ...propose(s, 3), approved: true }), []);
  assert.throws(() => search(inventory, propose(s, 3)), /Approve/);
  const nurture = extract(messages("S10"));
  assert.match(nextAction(nurture, "2026-07-01"), /Wait until/);
  assert.match(nextAction(nurture, "2026-12-01"), /due/);
  assert.match(
    nextAction(
      extract([
        ...messages("S10"),
        { id: "stop", sender: "client", text: "Please stop contacting me." },
      ]),
      "2026-12-01",
    ),
    /stopped/,
  );
});

test("legacy CSV agreement is reproduced without changing source bytes", async () => {
  const { legacyBenchmark } = await import("../src/legacy");
  const result = legacyBenchmark();
  assert.equal(result.totalFieldMatches, 167);
  assert.equal(result.wholeConversationMatches, 24);
  assert.equal(
    result.sha256,
    "d75f6f8d031d4fb9b074c1983928f63235e4cd8eef6ebecc7120e95482c516da",
  );
});

test("v3 fixes negated selling while baseline stays reproducible", () => {
  const opening = [
    {
      id: "negated",
      sender: "client",
      text: "We are not selling. We need to rent a four-bedroom house in Mudon, up to 450k a year.",
    },
  ];
  assert.equal(extract(opening, [], "baseline").clientType, "Seller");
  assert.equal(extract(opening, [], "negated-selling").clientType, "Renter");
  assert.equal(
    extract(
      [
        {
          id: "positive",
          sender: "client",
          text: "We are selling our villa for 8 million.",
        },
      ],
      [],
      "negated-selling",
    ).clientType,
    "Seller",
  );
  assert.equal(
    extract(messages("S03"), [], "negated-selling").conflicts.length,
    1,
  );
});
