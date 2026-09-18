"use client";
import { motion, AnimatePresence } from "motion/react";
import {
  MessagesSquare,
  FlaskConical,
  Settings2,
  BedDouble,
  Trees,
  Waves,
  PawPrint,
  CalendarDays,
  Sparkles,
  Check,
  MapPin,
  CircleHelp,
  ShieldCheck,
} from "lucide-react";
export function BrandMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M12 10v15a5 5 0 0 0 5 5h12"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M23 10v9h8"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".45"
      />
    </svg>
  );
}
const navigation = [MessagesSquare, FlaskConical, Settings2];
export function NavIcon({ index }: { index: number }) {
  const Icon = navigation[index];
  return <Icon size={18} strokeWidth={1.7} aria-hidden="true" />;
}
export const leadTitles: Record<string, string> = {
  S01: "Family rental search",
  S02: "Villa owner · valuation",
  S03: "Apartment owner · letting",
  S04: "Town Square · offer",
  S05: "Mudon · family rental",
  S06: "A new conversation",
  S07: "Ranches or Mudon",
  S08: "Rental · monthly budget",
  S09: "A change of plans",
  S10: "December follow-up",
  S11: "Rental · pet permission",
  S12: "Ranches · firm budget",
  S13: "Renting, not selling",
};
export function Requirement({ name, value }: { name: string; value: any }) {
  const entries: Record<string, any> = {
    bedrooms: [BedDouble, `${value} bedrooms`],
    garden: [Trees, value ? "Garden" : "No garden"],
    pool: [Waves, value ? "Pool" : "No pool"],
    poolType: [Waves, `${value} pool`],
    dogs: [PawPrint, `${value} dogs`],
    moveBefore: [
      CalendarDays,
      `Before ${new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
    ],
    style: [Sparkles, String(value)],
    quiet: [ShieldCheck, "Quiet preferred"],
    metro: [MapPin, "Metro proximity unclear"],
  };
  const [Icon, label] = entries[name] || [
    CircleHelp,
    `${name}: ${String(value)}`,
  ];
  return (
    <span className="requirement">
      <Icon size={14} aria-hidden="true" />
      {label}
    </span>
  );
}
export function Transcript({
  messages,
  clock,
}: {
  messages: any[];
  clock: string;
}) {
  return (
    <AnimatePresence initial={false}>
      {messages.map((m) => (
        <motion.div
          key={m.id}
          id={"message-" + m.id}
          className={"message " + m.sender}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="message-author">
            {m.sender === "broker" ? "You" : "Client"}
          </span>
          <p>{m.text}</p>
          <small>
            {new Date(m.time || clock).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Dubai",
            })}
            {m.sender === "broker" && <Check size={13} aria-hidden="true" />}
          </small>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
export function PropertyDrawing({ index }: { index: number }) {
  return (
    <div
      className={"architecture architecture-" + (index % 3)}
      aria-hidden="true"
    >
      <svg viewBox="0 0 340 185">
        <defs>
          <pattern
            id={"grid" + index}
            width="18"
            height="18"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M18 0H0V18"
              fill="none"
              stroke="currentColor"
              opacity=".13"
              strokeWidth=".5"
            />
          </pattern>
        </defs>
        <rect width="340" height="185" fill={"url(#grid" + index + ")"} />
        <ellipse
          cx="173"
          cy="150"
          rx="117"
          ry="19"
          fill="currentColor"
          opacity=".07"
        />
        <path
          d="M61 134l105 31 120-45-107-30z"
          fill="currentColor"
          opacity=".09"
        />
        <path d="M79 87l84 27v42l-84-27z" fill="var(--building-side)" />
        <path d="M163 114l82-33v42l-82 33z" fill="var(--building-front)" />
        <path d="M79 87l83-33 83 27-82 33z" fill="var(--building-roof)" />
        <path d="M118 51l66 20v45l-66-20z" fill="var(--building-side)" />
        <path d="M184 71l45-18v44l-45 19z" fill="var(--building-front)" />
        <path d="M118 51l45-18 66 20-45 18z" fill="var(--building-roof)" />
        <path
          d="M128 65l18 6v24l-18-6zm27 8 18 6v24l-18-6zM91 103l21 7v23l-21-7z"
          fill="var(--building-glass)"
        />
        <path
          d="M194 78l23-9v22l-23 9zM177 120l24-10v28l-24 10zm34-14 23-9v28l-23 10z"
          fill="var(--building-glass)"
        />
        <path d="m240 141 29-11 27 8-29 12z" fill="var(--building-pool)" />
        <path
          d="M57 112v24m208-53v34"
          stroke="currentColor"
          opacity=".4"
          strokeWidth="3"
        />
        <circle cx="57" cy="103" r="12" fill="var(--building-tree)" />
        <circle cx="265" cy="75" r="15" fill="var(--building-tree)" />
        <circle cx="275" cy="84" r="10" fill="var(--building-tree)" />
      </svg>
      <span className="drawing-label">CONCEPT DRAWING</span>
    </div>
  );
}
export function Json({ value }: { value: any }) {
  return <pre>{JSON.stringify(value, null, 2)}</pre>;
}
export function download(data: any, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
export function ReferenceEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  let ref: any;
  try {
    ref = JSON.parse(value);
  } catch {
    ref = {
      clientType: null,
      leadStage: null,
      acceptedAreas: [],
      money: {
        meaning: "unknown",
        period: null,
        target: null,
        min: null,
        max: null,
      },
    };
  }
  const update = (key: string, v: any) =>
    onChange(JSON.stringify({ ...ref, [key]: v }, null, 2));
  return (
    <>
      <div className="form-grid">
        <label>
          Client intent
          <select
            value={ref.clientType || ""}
            onChange={(e) => update("clientType", e.target.value || null)}
          >
            <option value="">Unresolved</option>
            {["Buyer", "Seller", "Renter", "Landlord"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Furthest supported stage
          <select
            value={ref.leadStage || ""}
            onChange={(e) => update("leadStage", e.target.value || null)}
          >
            <option value="">Unresolved</option>
            {["Inquiry", "Qualifying", "Viewing", "Negotiation"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Areas the client accepted · separate with commas
        <input
          value={ref.acceptedAreas.join(", ")}
          onChange={(e) =>
            update(
              "acceptedAreas",
              e.target.value
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            )
          }
        />
      </label>
      <div className="form-grid">
        <label>
          What the money means
          <select
            value={ref.money.meaning}
            onChange={(e) =>
              update("money", { ...ref.money, meaning: e.target.value })
            }
          >
            {[
              "unknown",
              "target",
              "maximum",
              "range",
              "offer",
              "asking_price",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Per
          <select
            value={ref.money.period || ""}
            onChange={(e) =>
              update("money", { ...ref.money, period: e.target.value || null })
            }
          >
            <option value="">Unknown</option>
            {["year", "month", "purchase"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        {["target", "min", "max"].map((k) => (
          <label key={k}>
            {k} · AED
            <input
              type="number"
              min="0"
              value={ref.money[k] ?? ""}
              onChange={(e) =>
                update("money", {
                  ...ref.money,
                  [k]: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </label>
        ))}
      </div>
      <details>
        <summary>The structured answer being saved</summary>
        <Json value={ref} />
      </details>
    </>
  );
}
