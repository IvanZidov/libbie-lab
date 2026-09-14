export type Message = {
  id: string;
  sender: string;
  text: string;
  time?: string;
};
export type Snapshot = {
  clientType: string | null;
  leadStage: string | null;
  areas: { name: string; status: string; evidence: string }[];
  money: {
    meaning: string;
    period: string | null;
    target: number | null;
    min: number | null;
    max: number | null;
    rawText: string;
  };
  requirements: Record<string, any>;
  evidence: Record<string, { messageId: string; quote: string }>;
  goalChange: boolean;
  conflicts: string[];
  stop: boolean;
  nurture: string | null;
  corrections: string[];
};
const areas = [
  "Arabian Ranches",
  "Mudon",
  "Nad Al Sheba",
  "Bluewaters",
  "Town Square",
  "Villanova",
  "Serena",
];
export function extract(
  messages: Message[],
  corrections: any[] = [],
  variant = "baseline",
): Snapshot {
  const s: Snapshot = {
    clientType: null,
    leadStage: null,
    areas: [],
    money: {
      meaning: "unknown",
      period: null,
      target: null,
      min: null,
      max: null,
      rawText: "",
    },
    requirements: {},
    evidence: {},
    goalChange: false,
    conflicts: [],
    stop: false,
    nurture: null,
    corrections: [],
  };
  const stage = (v: string) => {
    if (
      ["Inquiry", "Qualifying", "Viewing", "Negotiation"].indexOf(v) >
      ["Inquiry", "Qualifying", "Viewing", "Negotiation"].indexOf(
        s.leadStage || "",
      )
    )
      s.leadStage = v;
  };
  messages.forEach((m, i) => {
    const t = m.text.toLowerCase(),
      prev = messages[i - 1]?.text.toLowerCase() || "";
    const ev = (k: string) =>
      (s.evidence[k] = { messageId: m.id, quote: m.text });
    if (m.sender !== "client") {
      for (const a of areas)
        if (t.includes(a.toLowerCase()) && !s.areas.some((x) => x.name === a))
          s.areas.push({ name: a, status: "unconfirmed", evidence: m.id });
      return;
    }
    let role = null;
    // v3 removes explicit negated selling clauses only for intent detection.
    // Keep original text for amounts and evidence, and preserve v1/v2 for comparison.
    const intentText =
      variant === "negated-selling"
        ? t.replace(/\b(?:not|never)\s+(?:looking\s+to\s+)?sell(?:ing)?\b/g, "")
        : t;
    if (/sell|only selling/.test(intentText) && !/keeping/.test(t))
      role = "Seller";
    else if (/what rent could i get|renting out|let my|let out/.test(t))
      role = "Landlord";
    else if (/\brent\b|rental|a year|per year|a month/.test(t)) role = "Renter";
    else if (/\bbuy\b|\boffer\b/.test(t)) role = "Buyer";
    if (role) {
      if (s.clientType && role !== s.clientType) {
        s.goalChange = true;
        s.areas = [];
        s.money = {
          meaning: "unknown",
          period: null,
          target: null,
          min: null,
          max: null,
          rawText: "",
        };
      }
      s.clientType = role;
      ev("clientType");
      stage("Qualifying");
    }
    for (const a of areas) {
      if (
        !t.includes(a.toLowerCase()) &&
        !(role === "Landlord" && prev.includes(a.toLowerCase()))
      )
        continue;
      const rejected = new RegExp("(skip|rule out|not|exclude) " + a, "i").test(
        m.text,
      );
      s.areas = s.areas.filter((x) => x.name !== a);
      s.areas.push({
        name: a,
        status: rejected ? "rejected" : "accepted",
        evidence: m.id,
      });
      ev("areas");
    }
    const nums = [
      ...t.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(million|k\b|aed)/g),
    ].map(
      (x) =>
        Number(x[1].replaceAll(",", "")) *
        (x[2] === "million" ? 1e6 : x[2] === "k" ? 1e3 : 1),
    );
    if (nums.length) {
      let meaning = /between/.test(t)
        ? "range"
        : /up to|maximum|limit/.test(t)
          ? "maximum"
          : /offer/.test(t)
            ? "offer"
            : s.clientType === "Seller"
              ? "asking_price"
              : "target";
      s.money = {
        meaning,
        period: /month/.test(t)
          ? "month"
          : /year/.test(t)
            ? "year"
            : s.clientType === "Seller" || s.clientType === "Buyer"
              ? "purchase"
              : null,
        target: ["target", "offer", "asking_price"].includes(meaning)
          ? nums[0]
          : null,
        min: meaning === "range" ? nums[0] : null,
        max:
          meaning === "range"
            ? nums[1]
            : meaning === "maximum"
              ? nums[0]
              : null,
        rawText: m.text,
      };
      ev("money");
    }
    const beds = t.match(/(\d|five|four)[ -]bed/);
    if (beds) {
      s.requirements.bedrooms =
        beds[1] === "five" ? 5 : beds[1] === "four" ? 4 : Number(beds[1]);
      ev("bedrooms");
    }
    for (const key of ["garden", "pool"])
      if (t.includes(key)) {
        s.requirements[key] = true;
        ev(key);
      }
    if (t.includes("private pool")) s.requirements.poolType = "private";
    if (/two dogs|2 dogs/.test(t)) {
      s.requirements.dogs = 2;
      ev("dogs");
    }
    if (/mid-august/.test(t)) {
      s.requirements.moveBefore = "2026-08-15";
      ev("moveBefore");
    }
    if (/quiet/.test(t)) s.requirements.quiet = "preferred";
    if (/metro/.test(t)) s.requirements.metro = "walking threshold unresolved";
    if (/feel like a home|warm and homely/.test(t)) {
      s.requirements.style = "warm and homely";
      ev("style");
    }
    if (/viewed/.test(t)) {
      stage("Viewing");
      ev("leadStage");
    }
    if (
      /works|agreed|yes/.test(t) &&
      /saturday|view|value|10:00/.test(t + " " + prev)
    ) {
      stage("Viewing");
      ev("leadStage");
    }
    if (/offer\s+\d/.test(t)) {
      stage("Negotiation");
      ev("leadStage");
    }
    if (/stop contacting|do not contact/.test(t)) {
      s.stop = true;
      ev("stop");
    }
    if (/december/.test(t)) {
      s.nurture = "2026-12-01";
      ev("nurture");
    }
  });
  if (
    ["candidate", "negated-selling"].includes(variant) &&
    s.clientType === "Landlord"
  )
    s.conflicts.push(
      "Stage boundary needs adjudication: Inquiry or Qualifying.",
    );
  for (const c of corrections) {
    const old = (s as any)[c.field];
    if (JSON.stringify(old) !== JSON.stringify(c.value))
      s.conflicts.push(`${c.field}: extraction differs from human correction`);
    (s as any)[c.field] = c.value;
    s.corrections.push(c.id);
  }
  return s;
}
export function legacy(s: Snapshot) {
  return {
    client_type: s.clientType,
    lead_stage: s.leadStage,
    locations_of_interest: s.areas
      .filter((a) => a.status === "accepted")
      .map((a) => a.name)
      .sort(),
    budget:
      s.money.meaning === "range" ? null : (s.money.max ?? s.money.target),
    status:
      !s.clientType || s.money.meaning === "range" ? "unresolved" : "resolved",
  };
}
export function propose(s: Snapshot, revision: number) {
  return {
    revision,
    transaction: s.clientType === "Buyer" ? "sale" : "rent",
    propertyType: "house",
    bedrooms: s.requirements.bedrooms ?? null,
    minPrice: (s.money.min ?? 0) * (s.money.period === "month" ? 12 : 1),
    cap:
      (s.money.max ?? s.money.target ?? 0) *
      (s.money.period === "month" ? 12 : 1),
    areas: s.areas.filter((a) => a.status === "accepted").map((a) => a.name),
    proposedAreas: s.areas
      .filter((a) => a.status === "unconfirmed")
      .map((a) => a.name),
    rejected: s.areas.filter((a) => a.status === "rejected").map((a) => a.name),
    garden: !!s.requirements.garden,
    pool: !!s.requirements.pool,
    poolType: s.requirements.poolType ?? null,
    dogs: s.requirements.dogs ?? 0,
    moveBefore: s.requirements.moveBefore ?? null,
    style: "warm and homely",
    unknownPolicy: "conditional",
    approved: false,
  };
}
export function search(properties: any[], b: any) {
  if (!b.approved || !b.cap || !b.areas.length)
    throw Error("Approve a positive working price cap and at least one area.");
  if (b.areas.some((a: string) => b.rejected.includes(a)))
    throw Error("Rejected areas cannot be searched. Correct the lead first.");
  return properties
    .filter(
      (p) =>
        p.workspaceId === "demo" &&
        p.status === "active" &&
        p.transaction === b.transaction &&
        p.propertyType === b.propertyType &&
        (!b.bedrooms || p.bedrooms === b.bedrooms) &&
        b.areas.includes(p.location) &&
        !b.rejected.includes(p.location) &&
        p.price.currency === "AED" &&
        p.price.amount * (p.price.period === "month" ? 12 : 1) <= b.cap &&
        p.price.amount * (p.price.period === "month" ? 12 : 1) >=
          (b.minPrice ?? 0) &&
        (!b.garden || p.garden) &&
        (!b.pool || p.pool) &&
        (!b.poolType || p.poolType === b.poolType) &&
        (!b.dogs || p.petsAllowed !== false) &&
        (!b.moveBefore || !p.availableFrom || p.availableFrom <= b.moveBefore),
    )
    .map((p) => {
      const unknowns = [
        ...(b.dogs && p.petsAllowed === null
          ? ["Pet permission unverified"]
          : []),
        ...(!p.availableFrom ? ["Availability unverified"] : []),
      ];
      const bright = /bright|open|airy/i.test(b.style);
      const knownStyle = bright || /warm|homely|cosy|cozy/i.test(b.style);
      const warm =
        knownStyle &&
        (bright
          ? /bright|open|airy|glass/i
          : /warm|wood|homely|reading nook/i
        ).test(p.description);
      return {
        property: p,
        unknowns,
        fit: warm
          ? `Description supports ${bright ? "bright, open" : "warm, homely"} style`
          : "Style uncertain",
        styleEvidence: p.description,
        kind: unknowns.length ? "conditional" : "verified",
        score: warm ? 1 : 0,
      };
    })
    .filter((p) => b.unknownPolicy !== "exclude" || p.kind === "verified")
    .sort((a, b) => b.score - a.score);
}
export function nextAction(s: Snapshot, clock: string) {
  if (s.stop) return "Contact stopped. No draft or send suggestions.";
  if (s.nurture && clock < s.nurture)
    return `Wait until ${s.nurture}. No earlier listings requested.`;
  if (s.nurture)
    return "Requested follow-up is due. Review a contextual update.";
  if (s.clientType === "Seller")
    return "Confirm the valuation appointment and prepare listing details.";
  if (s.clientType === "Landlord")
    return "Clarify the owner’s plans and proposed asking rent.";
  if (!s.clientType)
    return "Ask how you can help. Property intent is unresolved.";
  return "Confirm the area, verify pet permission and agree a viewing time.";
}
