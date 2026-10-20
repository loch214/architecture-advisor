import type { Prompt } from "../prompt";
import { ProviderError, type LlmProvider } from "./types";

export type MockScenario = "ok" | "reorder" | "invalid" | "slow" | "429" | "fail";

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
 * Like mockReply, but raises the rule engine's #2 by 5 points and names it the top pick, so the UI's
 * "AI changed the order" banner can be checked. Valid only when the top two are within 5 points (the
 * Startup MVP preset is a tie); otherwise validation rejects it and the chain falls back to rules-only.
 */
export function mockReorderReply(prompt: Prompt): Record<string, unknown> {
  const [first, second, ...rest] = prompt.ids.top;
  const reply = mockReply(prompt);
  const explanation = reply.explanation as Record<string, unknown>;
  return {
    ...reply,
    adjustments: [
      { styleId: second, delta: 5, reason: `Mock: ${second} suits these answers a little better.`, basis: "inputs" },
    ],
    explanation: {
      ...explanation,
      summary: `Mock explanation: ${second} moves ahead of ${first} after a small AI adjustment.`,
      topPick: { styleId: second, why: `${second} edges ahead after the mock adjustment.` },
      others: [first, ...rest]
        .slice(0, 4)
        .map((styleId) => ({ styleId, whyLower: `${styleId} fits a little less well.` })),
    },
  };
}

/**
 * The fixture provider for AI_MODE=mock (AI_INTEGRATION §11): ok, reorder (see above), invalid (never valid JSON), slow
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
        case "reorder":
          return mockReorderReply(prompt);
        default:
          return mockReply(prompt);
      }
    },
  };
}
