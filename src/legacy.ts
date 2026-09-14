import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
export function legacyBenchmark() {
  const raw = readFileSync("libbie-mvp-handoff/reference/part1-data.csv");
  const lines = raw.toString().trim().split(/\r?\n/),
    headers = lines.shift()!.split(",");
  const rows = lines.map((line) =>
    Object.fromEntries(line.split(",").map((v, i) => [headers[i], v])),
  );
  const fields = ["client_type", "lead_stage", "locations", "budget"];
  const normalized = (v: string, k: string) =>
    k === "locations"
      ? JSON.stringify(
          [
            ...new Set(
              v
                .split("|")
                .map((x) => x.trim().toLowerCase())
                .filter(Boolean),
            ),
          ].sort(),
        )
      : k === "budget"
        ? v.trim() === ""
          ? null
          : Number(v)
        : v;
  const matches = Object.fromEntries(
    fields.map((f) => [
      f,
      rows.filter(
        (r) => normalized(r["human_" + f], f) === normalized(r["pred_" + f], f),
      ).length,
    ]),
  );
  return {
    sha256: createHash("sha256").update(raw).digest("hex"),
    rows: rows.length,
    fieldMatches: matches,
    totalFieldMatches: Object.values(matches).reduce((a, b) => a + b, 0),
    totalFields: rows.length * 4,
    wholeConversationMatches: rows.filter((r) =>
      fields.every(
        (f) => normalized(r["human_" + f], f) === normalized(r["pred_" + f], f),
      ),
    ).length,
    warning:
      "Agreement with imperfect supplied labels. No conversations in CSV. No new model predictions supplied.",
  };
}
