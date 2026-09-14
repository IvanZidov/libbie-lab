import { evaluate } from "./evaluation";
import { writeFileSync, mkdirSync } from "node:fs";
const report = evaluate();
mkdirSync("reports", { recursive: true });
writeFileSync("reports/scripted-replay.json", JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      id: report.id,
      gate: report.gate,
      cases: report.total,
      reviewed: report.reviewed,
      failures: report.rows
        .filter((r: any) => !r.results[1].passed)
        .map((r: any) => [r.caseId, r.results[1].errors]),
    },
    null,
    2,
  ),
);
