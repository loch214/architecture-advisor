import "server-only";
import { aiEnv, type AiMode } from "@/modules/platform/env";
import { sharedStore } from "@/modules/platform/store";
import type { ExplainDeps } from "./explain";
import { geminiProvider } from "./providers/gemini";
import { groqProvider } from "./providers/groq";
import { mockProvider } from "./providers/mock";
import type { LlmProvider } from "./providers/types";

export { explain, type ExplainDeps } from "./explain";
export { PROMPT_VERSION } from "./prompt";

/** Gemini → Groq, skipping a provider whose key isn't set; AI_MODE=mock uses the fixture provider. */
export function providersFor(mode: Exclude<AiMode, "off">): LlmProvider[] {
  const env = aiEnv();
  if (mode === "mock") return [mockProvider(env.mockScenario)];
  const providers: LlmProvider[] = [];
  if (env.gemini.apiKey) providers.push(geminiProvider(env.gemini));
  if (env.groq.apiKey) providers.push(groqProvider(env.groq));
  return providers;
}

/** Production wiring: real clock, this instance's store, settings from the environment. */
export function defaultDeps(mode: Exclude<AiMode, "off">): ExplainDeps {
  const env = aiEnv();
  return {
    providers: providersFor(mode),
    store: sharedStore(),
    now: Date.now,
    identicalReuse: env.identicalReuse,
    dailyBudget: env.dailyBudget,
    log: (entry) => console.info(JSON.stringify({ event: "ai", ...entry })),
  };
}
