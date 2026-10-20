import type { KvStore } from "@/modules/platform/store";
import type { AiContext } from "./context";
import { repairPrompt, type Prompt } from "./prompt";
import { ProviderError, type LlmProvider } from "./providers/types";
import { validateReply, type Validation } from "./validate";

/** The whole AI step gives up after 20 s and the user keeps the rules-only result (AI_INTEGRATION §1). */
export const AI_BUDGET_MS = 20_000;
/** How long a provider rests after a per-minute 429. */
export const COOLING_MS = 60_000;

export interface ChainDeps {
  providers: LlmProvider[];
  store: KvStore;
  now: () => number;
  budgetMs?: number;
}

export type Attempt = { provider: string; outcome: string };

export type ChainResult =
  | ({ ok: true; provider: LlmProvider; latencyMs: number; attempts: Attempt[] } & Extract<Validation, { ok: true }>)
  | { ok: false; attempts: Attempt[] };

const breakerKey = (id: string) => `breaker:${id}`;

/** Calls the provider, aborting it (and not waiting for it) after `ms`. */
async function callWithTimeout(provider: LlmProvider, prompt: Prompt, ms: number): Promise<unknown> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ProviderError("timeout", "timed out"));
    }, ms);
  });
  try {
    return await Promise.race([provider.generate(prompt, controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Gemini → Groq → rules-only (AI_INTEGRATION §1–2). Timeouts, 5xx, network errors and empty replies go
 * straight to the next provider; a 429 also rests the provider (60 s, or until the daily reset); an
 * invalid reply gets one repair retry on the same provider. Breaker state lives in the store, so it is
 * shared across instances once the store is Redis.
 */
export async function runChain(prompt: Prompt, ctx: AiContext, deps: ChainDeps): Promise<ChainResult> {
  const { store, now } = deps;
  const budgetMs = deps.budgetMs ?? AI_BUDGET_MS;
  const start = now();
  const attempts: Attempt[] = [];

  for (const provider of deps.providers) {
    const restingUntil = await store.get<number>(breakerKey(provider.id));
    if (restingUntil !== undefined && restingUntil > now()) {
      attempts.push({ provider: provider.id, outcome: "resting" });
      continue;
    }
    let current = prompt;
    for (let attempt = 0; attempt < 2; attempt++) {
      const remaining = budgetMs - (now() - start);
      if (remaining <= 0) {
        attempts.push({ provider: provider.id, outcome: "budget" });
        return { ok: false, attempts };
      }
      const t0 = now();
      try {
        const raw = await callWithTimeout(provider, current, Math.min(provider.timeoutMs, remaining));
        const v = validateReply(raw, ctx, prompt.ids);
        if (v.ok) {
          attempts.push({ provider: provider.id, outcome: "ok" });
          return { ...v, provider, latencyMs: now() - t0, attempts };
        }
        // Only "invalid" is recorded: the reason can quote the notes, and attempts get logged.
        attempts.push({ provider: provider.id, outcome: "invalid" });
        current = repairPrompt(prompt, v.reason);
      } catch (error) {
        const e = error instanceof ProviderError ? error : new ProviderError("network", "unknown error");
        attempts.push({ provider: provider.id, outcome: e.kind });
        if (e.kind === "rate-minute") {
          const ms = e.retryAfterMs ?? COOLING_MS;
          await store.set(breakerKey(provider.id), now() + ms, ms);
        } else if (e.kind === "rate-daily") {
          const until = e.retryAfterMs ? now() + e.retryAfterMs : provider.dailyResetAt(now());
          await store.set(breakerKey(provider.id), until, Math.max(1, until - now()));
        }
        break;
      }
    }
  }
  return { ok: false, attempts };
}
