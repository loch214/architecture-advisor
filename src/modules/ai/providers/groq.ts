import "server-only";
import { createGroq } from "@ai-sdk/groq";
import { nextMidnight, sdkProvider } from "./sdk";

/**
 * Fallback provider: Groq (gpt-oss-120b), 8 s timeout (AI_INTEGRATION §1). Strict JSON schema is off
 * because Groq's strict mode doesn't support every keyword we use (lengths, bounds); our own validation
 * covers them. Low reasoning effort keeps replies fast and inside the 8K tokens/minute free limit.
 */
export function groqProvider({ apiKey, model }: { apiKey: string; model: string }) {
  const groq = createGroq({ apiKey });
  return sdkProvider({
    id: "groq",
    label: "Groq",
    model,
    timeoutMs: 8_000,
    languageModel: groq(model),
    providerOptions: { groq: { strictJsonSchema: false, reasoningEffort: "low" } },
    // Groq doesn't publish a reset time; a 429 usually carries Retry-After, which the chain prefers.
    dailyResetAt: (now) => nextMidnight("UTC", now),
  });
}
