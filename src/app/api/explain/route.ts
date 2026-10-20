import { kb } from "@/modules/knowledge-base";
import type { AiBlock } from "@/modules/recommendation";
import { checkInput } from "@/modules/scoring";
import { aiMode } from "@/modules/platform/env";

/**
 * POST { input: UserInput } → { ai: AiBlock }. The browser already shows the rule result; this route only
 * ever adds the AI block. It validates the input itself and never trusts scores sent by the client.
 * Phase 5 adds: rate limit, server-side score(), cache, provider chain (AI_INTEGRATION §1–8).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const input = (body as { input?: unknown } | null)?.input;
  const { ok, issues } = checkInput(input, kb);
  if (!ok) return Response.json({ error: "Invalid input.", issues }, { status: 400 });

  const ai: AiBlock =
    aiMode() === "off"
      ? { status: "disabled", adjustments: [] }
      : // The provider chain isn't built yet, so any other mode reports "unavailable" (rules-only).
        { status: "unavailable", adjustments: [] };
  return Response.json({ ai });
}
