import type { Prompt } from "../prompt";

/** Why a provider call failed; decides what the chain does next (AI_INTEGRATION §2). */
export type FailureKind = "timeout" | "network" | "server" | "rejected" | "rate-minute" | "rate-daily" | "empty";

export class ProviderError extends Error {
  constructor(
    readonly kind: FailureKind,
    message: string,
    /** From a Retry-After header, when the provider sent one. */
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/** The port every AI provider adapter implements (ports and adapters, AI_INTEGRATION §1). */
export interface LlmProvider {
  id: string;
  /** Shown in small print under the explanation. */
  label: string;
  model: string;
  timeoutMs: number;
  /** Returns the raw reply (object or text); the caller validates it. Throws ProviderError on failure. */
  generate(prompt: Prompt, signal: AbortSignal): Promise<unknown>;
  /** When a daily quota resets, if the provider didn't say (epoch ms). */
  dailyResetAt(now: number): number;
}
