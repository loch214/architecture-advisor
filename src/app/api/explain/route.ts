import { createHash } from "node:crypto";
import { defaultDeps, explain } from "@/modules/ai";
import { kb } from "@/modules/knowledge-base";
import type { AiBlock } from "@/modules/recommendation";
import { checkInput, type UserInput } from "@/modules/scoring";
import { aiMode } from "@/modules/platform/env";
import { allowRequest } from "@/modules/platform/rate-limit";
import { sharedStore } from "@/modules/platform/store";

const MAX_BODY_BYTES = 16_000;

/** A hash of the caller's IP: enough to rate-limit, without keeping the address itself. */
function clientKey(request: Request): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/**
 * POST { input: UserInput } → { ai: AiBlock }. The browser already shows the rule result; this route only
 * ever adds the AI block. It validates the input itself, recomputes the rule result on the server and
 * never trusts scores sent by the client (AI_INTEGRATION §8–9).
 */
export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return Response.json({ error: "Body too large." }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const input = (body as { input?: unknown } | null)?.input;
  const { ok, issues } = checkInput(input, kb);
  if (!ok) return Response.json({ error: "Invalid input.", issues }, { status: 400 });

  const mode = aiMode();
  if (mode === "off") return Response.json({ ai: { status: "disabled", adjustments: [] } satisfies AiBlock });

  if (!(await allowRequest(sharedStore(), clientKey(request), Date.now())))
    return Response.json({ ai: { status: "rate_limited", adjustments: [] } satisfies AiBlock });

  try {
    return Response.json({ ai: await explain(input as UserInput, kb, defaultDeps(mode)) });
  } catch {
    // Never a stack trace: the rule result in the browser is complete without the AI.
    return Response.json({ ai: { status: "unavailable", adjustments: [] } satisfies AiBlock });
  }
}
