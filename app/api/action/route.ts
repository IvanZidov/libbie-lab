import { after } from "next/server";
import { enqueue, work } from "../../../src/jobs";
import { act, state } from "../../../src/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  after(work);
  return Response.json({
    ok: true,
    data: state(new URL(req.url).searchParams.get("view") || "Workspace"),
  });
}
export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== req.headers.get("host"))
      return Response.json(
        { ok: false, error: "Cross-origin mutation blocked" },
        { status: 403 },
      );
    const input = await req.json();
    const result =
      process.env.APP_MODE === "live" &&
      ["step", "draft"].includes(input.action)
        ? enqueue(input)
        : act(input);
    after(work);
    return Response.json({ ok: true, data: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed";
    return Response.json(
      { ok: false, error: message },
      { status: message.includes("conflict") ? 409 : 400 },
    );
  }
}
