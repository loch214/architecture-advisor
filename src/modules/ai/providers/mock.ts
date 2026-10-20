import type { Prompt } from "../prompt";
import { ProviderError, type LlmProvider } from "./types";

export type MockScenario = "ok" | "invalid" | "slow" | "429" | "fail";

/** A valid reply for any prompt: no adjustments, the rule order explained (used by AI_MODE=mock). */
export function mockReply(prompt: Prompt): Record<string, unknown> {
  const [top, ...others] = prompt.ids.top;
  return {
    adjustments: [],
    explanation: {
      summary: `Mock explanation: ${top} ranks first because it best matches what you marked as most important.`,
      topPick: { styleId: top, why: `${top} has the highest rule score for your priorities.` },
      others: others
        .slice(0, 4)
        .map((styleId) => ({ styleId, whyLower: `${styleId} fits your priorities less well.` })),
      cautions: ["This is a mock reply (AI_MODE=mock); no AI service was called."],
      notesUsed: [],
      mentions: prompt.ids.mentions.map((id) => ({ id, answer: `Mock answer about ${id}.` })),
    },
    ...(prompt.ids.withReuse ? { reuse: { fits: true, changes: [] } } : {}),
  };
}

/**
 * The fixture provider for AI_MODE=mock (AI_INTEGRATION §11): ok, invalid (never valid JSON), slow
 * (waits until the chain's timeout), 429 (per-minute limit) or fail (HTTP 503). It spends no quota.
 */
export function mockProvider(scenario: string): LlmProvider {
  return {
    id: "mock",
    label: "Mock AI",
    model: `mock-${scenario}`,
    timeoutMs: 2_000,
    dailyResetAt: (now) => now + 60_000,
    async generate(prompt, signal) {
      switch (scenario) {
        case "invalid":
          return "Sorry, I can't produce JSON today.";
        case "slow":
          return new Promise((_, reject) =>
            signal.addEventListener("abort", () => reject(new ProviderError("timeout", "timed out"))),
          );
        case "429":
          throw new ProviderError("rate-minute", "HTTP 429 (per-minute limit)");
        case "fail":
          throw new ProviderError("server", "HTTP 503");
        default:
          return mockReply(prompt);
      }
    },
  };
}
