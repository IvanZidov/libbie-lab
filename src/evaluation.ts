import { all, get, put, id, hash, sourceHash } from "./repository";
import { extract, legacy, propose, search } from "./domain";
export function evaluate(baseline = "v1", candidate = "v2") {
  const start = performance.now(),
    versions = [get(baseline, "version"), get(candidate, "version")],
    cases = all("scenario");
  const rows = cases.map((s) => {
    const messages = s.publicOpening.map((m: any, i: number) => ({
      ...m,
      id: `${s.id}-${i}`,
    }));
    const reference = all("annotation")
      .filter((a) => a.scenarioId === s.id)
      .at(-1);
    const validated = reference?.status === "accepted";
    const expected = validated
      ? reference.value
      : s.evaluatorOnly.expectedAtOpening;
    const results = versions.map((v) => {
      const t = performance.now(),
        actual = extract(messages, [], v.variant);
      const checks: Record<string, boolean> = {};
      for (const key of ["clientType", "leadStage"])
        if (key in expected)
          checks[key] = (actual as any)[key] === expected[key];
      if (expected.acceptedAreas)
        checks.areas =
          JSON.stringify(
            actual.areas
              .filter((a) => a.status === "accepted")
              .map((a) => a.name)
              .sort(),
          ) === JSON.stringify([...expected.acceptedAreas].sort());
      if (expected.money)
        for (const key of ["meaning", "period", "min", "max", "target"])
          if (key in expected.money)
            checks["money." + key] =
              (actual.money as any)[key] === expected.money[key];
      if (expected.requirements)
        for (const [key, value] of Object.entries(expected.requirements))
          checks["requirement." + key] =
            key === "petsAllowedRequired"
              ? actual.requirements.dogs > 0
              : actual.requirements[key] === value;
      const b = propose(actual, messages.length);
      if (b.areas.length && b.cap) {
        b.approved = true;
        const found = search(all("property"), b);
        checks.authorizedIds = found.every(
          (x) => x.property.workspaceId === "demo",
        );
        checks.budget = found.every(
          (x) =>
            x.property.price.amount *
              (x.property.price.period === "month" ? 12 : 1) <=
            b.cap,
        );
        checks.petUnknown = found.every(
          (x) =>
            !b.dogs ||
            x.property.petsAllowed !== null ||
            x.kind === "conditional",
        );
        if (s.id === "S12") checks.noMatch = found.length === 0;
      }
      const chat = extract(
        [
          ...messages,
          {
            id: "thanks",
            sender: "client",
            text: "Thanks, have a good weekend!",
          },
        ],
        [],
        v.variant,
      );
      checks.chitChat =
        JSON.stringify(legacy(actual)) === JSON.stringify(legacy(chat));
      return {
        version: v.id,
        actual,
        checks,
        passed: Object.values(checks).every(Boolean),
        latencyMs: performance.now() - t,
        errors: Object.keys(checks).filter((k) => !checks[k]),
      };
    });
    return {
      caseId: s.id,
      title: s.title,
      family: s.familyId,
      reviewed: validated,
      inputHash: hash(messages),
      expected,
      results,
      regression: results[0].passed && !results[1].passed,
    };
  });
  const fieldMetrics = versions.map((v, i) => ({
    version: v.id,
    fields: Object.fromEntries(
      ["clientType", "leadStage", "areas"].map((field) => {
        const measured = rows.filter((r) => field in r.results[i].checks);
        return [
          field,
          {
            matched: measured.filter((r) => r.results[i].checks[field]).length,
            total: measured.length,
          },
        ];
      }),
    ),
    wholeCases: rows.filter((r) => r.results[i].passed).length,
  }));
  const invariantChecks = {
    correctionPrecedence:
      extract(
        [
          {
            id: "x",
            sender: "client",
            text: "I need to rent in Mudon, up to 500k a year.",
          },
        ],
        [{ id: "c", field: "clientType", value: "Seller" }],
      ).clientType === "Seller",
    unapprovedSearchBlocked: (() => {
      try {
        search(all("property"), { approved: false });
        return false;
      } catch {
        return true;
      }
    })(),
  };
  put("dataset", {
    id: "dataset-" + hash(rows.map((r) => [r.caseId, r.inputHash, r.expected])),
    split: "development",
    exposure: "implementation-exposed",
    members: rows.map((r) => ({
      caseId: r.caseId,
      familyId: r.family,
      hash: r.inputHash,
      reviewed: r.reviewed,
      reference: r.expected,
    })),
    at: new Date().toISOString(),
  });
  const failed =
      !Object.values(invariantChecks).every(Boolean) ||
      rows.some((r) => !r.results[1].passed),
    reviewed = rows.filter((r) => r.reviewed).length;
  return put("evaluation", {
    id: id(),
    baseline,
    candidate,
    versionHashes: versions.map((v) => v.hash),
    datasetHash: hash(rows.map((r) => [r.caseId, r.inputHash, r.expected])),
    inventoryHash: hash(all("property")),
    fieldMetrics,
    invariantChecks,
    sourceHash: sourceHash(),
    mode: "scripted replay",
    status: "completed",
    gate: failed
      ? "failed_gates"
      : reviewed < 12 || reviewed !== rows.length
        ? "insufficient_evidence"
        : "passed_demo_gates",
    reviewed,
    total: rows.length,
    rows,
    regressions: rows.filter((r) => r.regression).length,
    fixed: rows.filter((r) => !r.results[0].passed && r.results[1].passed)
      .length,
    latencyMs: performance.now() - start,
    cost: null,
    usage: null,
    uncertainty: `${new Set(rows.map((r) => r.family)).size} synthetic scenario families, exposed during development. No production inference or independent human review.`,
    exposure: "Development fixtures, exposed during implementation",
    at: new Date().toISOString(),
  });
}
