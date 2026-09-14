import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// Separate scratch database: this command never annotates or changes the demo workspace.
process.env.LIBBIE_DB = join(
  mkdtempSync(join(tmpdir(), "libbie-demonstration-")),
  "demo.db",
);
async function main() {
  const { act } = await import("./service");
  const { evaluate } = await import("./evaluation");
  act({ action: "loadImprovement", key: crypto.randomUUID(), data: {} });
  const before = evaluate("v1", "v2"),
    after = evaluate("v1", "v3");
  mkdirSync("reports", { recursive: true });
  writeFileSync(
    "reports/improvement-demo.json",
    JSON.stringify(
      {
        notice:
          "Scripted development evidence only. No human annotations created.",
        before,
        after,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      {
        before: before.gate,
        after: after.gate,
        cases: after.total,
        fixed: after.fixed,
        regressions: after.regressions,
        reviewed: after.reviewed,
      },
      null,
      2,
    ),
  );
}
main();
