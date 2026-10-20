import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { nextMidnight, sdkProvider } from "./sdk";

/** Primary provider: Google Gemini Flash-Lite, 10 s timeout (AI_INTEGRATION §1). */
export function geminiProvider({ apiKey, model }: { apiKey: string; model: string }) {
  const google = createGoogleGenerativeAI({ apiKey });
  return sdkProvider({
    id: "gemini",
    label: "Google Gemini",
    model,
    timeoutMs: 10_000,
    languageModel: google(model),
    dailyResetAt: (now) => nextMidnight("America/Los_Angeles", now),
  });
}
