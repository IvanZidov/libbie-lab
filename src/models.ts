import { z } from "zod";
import { readFileSync } from "node:fs";
import { all, put, id, hash } from "./repository";
export const replySchema = z
  .object({ text: z.string().max(6000), end: z.boolean() })
  .strict()
  .refine((x) => x.end || x.text.trim().length > 0, "Empty client reply");
export function simulatorInput(s: any, l: any) {
  return {
    persona: s.privatePersona,
    transcript: l.messages.map(({ id, sender, text }: any) => ({
      id,
      sender,
      text,
    })),
    clock: l.clock,
  };
}
export function assistantInput(l: any) {
  return {
    transcript: l.messages.map(({ id, sender, text }: any) => ({
      id,
      sender,
      text,
    })),
    snapshot: l.snapshot,
  };
}
export async function generate(
  role: "simulator" | "assistant",
  input: any,
  context: { runId: string; version: string },
  transport: typeof fetch = fetch,
) {
  const model =
    process.env[role === "simulator" ? "SIMULATOR_MODEL" : "RUNTIME_MODEL"];
  if (
    process.env.MODEL_PROVIDER !== "openai" ||
    !process.env.MODEL_API_KEY ||
    !model
  )
    throw Error(
      "Live provider is not configured. Set MODEL_PROVIDER=openai, MODEL_API_KEY and the role model on the server.",
    );
  const prompt = readFileSync(`prompts/${role}-v1.txt`, "utf8");
  let repair = false;
  let last = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (
      all("modelCall").filter((c) => c.runId === context.runId).length >=
      Number(process.env.MAX_MODEL_CALLS_PER_RUN || 40)
    )
      throw Error("Model call limit reached.");
    const call = {
      id: id(),
      role,
      runId: context.runId,
      version: context.version,
      model,
      promptHash: hash({ prompt, model }),
      inputHash: hash(input),
      attempt,
      at: new Date().toISOString(),
    };
    const started = performance.now();
    try {
      const response = await transport("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.MODEL_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(
          Number(process.env.MODEL_TIMEOUT_MS || 20000),
        ),
        body: JSON.stringify({
          model,
          store: false,
          instructions:
            prompt +
            (repair
              ? " Return valid JSON matching the exact schema. The previous response failed validation."
              : ""),
          input: JSON.stringify(input),
          max_output_tokens: Number(
            process.env.MAX_MODEL_OUTPUT_TOKENS || 2000,
          ),
          text: {
            format: {
              type: "json_schema",
              name: "simulation_reply",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  end: { type: "boolean" },
                },
                required: ["text", "end"],
                additionalProperties: false,
              },
            },
          },
        }),
      });
      if (!response.ok) {
        put("modelCall", {
          ...call,
          status: "failed",
          httpStatus: response.status,
          latencyMs: performance.now() - started,
        });
        if ((response.status === 429 || response.status >= 500) && attempt < 2)
          continue;
        throw Error(
          `Provider request failed (HTTP ${response.status}). No scripted fallback was used.`,
        );
      }
      const body: any = await response.json();
      const text = (body.output || [])
        .flatMap((o: any) => o.content || [])
        .filter((c: any) => c.type === "output_text")
        .map((c: any) => c.text)
        .join("");
      let output;
      try {
        if (body.status !== "completed")
          throw Error("Incomplete provider response");
        output = replySchema.parse(JSON.parse(text));
      } catch {
        put("modelCall", {
          ...call,
          status: "invalid_output",
          latencyMs: performance.now() - started,
          requestId: body.id,
          actualModel: body.model,
          usage: body.usage ?? null,
        });
        if (!repair && attempt < 2) {
          repair = true;
          continue;
        }
        throw Error(
          "Provider returned invalid or incomplete output after schema repair.",
        );
      }
      const record = put("modelCall", {
        ...call,
        status: "completed",
        latencyMs: performance.now() - started,
        requestId: body.id,
        actualModel: body.model,
        usage: body.usage ?? null,
        cost: null,
        output,
      });
      return { ...record, output };
    } catch (e: any) {
      last =
        e.name === "TimeoutError"
          ? "Provider timed out. No reply was appended."
          : e.message;
      if (!all("modelCall").some((c) => c.id === call.id))
        put("modelCall", {
          ...call,
          status: "failed",
          error: last,
          latencyMs: performance.now() - started,
        });
      if ((e.name === "TimeoutError" || e.name === "TypeError") && attempt < 2)
        continue;
      throw Error(last);
    }
  }
  throw Error(last || "Provider retry budget exhausted");
}
