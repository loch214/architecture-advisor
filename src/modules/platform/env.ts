import "server-only";

export type AiMode = "off" | "mock" | "live";

/** AI_MODE=off|mock|live (AI_INTEGRATION §11). Anything else, including unset, means off. */
export function aiMode(): AiMode {
  const v = process.env.AI_MODE;
  return v === "mock" || v === "live" ? v : "off";
}

export interface AiEnv {
  gemini: { apiKey: string; model: string };
  groq: { apiKey: string; model: string };
  /** CACHE_IDENTICAL_REUSE=false makes identical requests go to the AI too (AI_INTEGRATION §7). */
  identicalReuse: boolean;
  /** AI_DAILY_BUDGET: AI requests per day across all users before falling back to rules-only. */
  dailyBudget: number;
  /** AI_MOCK=ok|invalid|slow|429|fail picks the fixture used with AI_MODE=mock. */
  mockScenario: string;
}

/**
 * Server-only AI settings. Keys come from the environment (cloud environment settings, Vercel, or
 * .env.local); they never have a NEXT_PUBLIC_ prefix and never reach the browser.
 */
export function aiEnv(): AiEnv {
  const e = process.env;
  const budget = Number(e.AI_DAILY_BUDGET);
  return {
    gemini: { apiKey: e.GEMINI_API_KEY ?? "", model: e.GEMINI_MODEL || "gemini-3.5-flash-lite" },
    groq: { apiKey: e.GROQ_API_KEY ?? "", model: e.GROQ_MODEL || "openai/gpt-oss-120b" },
    identicalReuse: e.CACHE_IDENTICAL_REUSE !== "false",
    dailyBudget: Number.isInteger(budget) && budget > 0 ? budget : 1300,
    mockScenario: e.AI_MOCK || "ok",
  };
}
