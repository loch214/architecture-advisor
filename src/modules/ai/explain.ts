import type { KnowledgeBase } from "@/modules/knowledge-base";
import type { KvStore } from "@/modules/platform/store";
import type { AiBlock } from "@/modules/recommendation";
import type { UserInput } from "@/modules/scoring";
import { entryFor, findIdentical, findSimilar, saveEntry } from "./cache";
import { runChain, type Attempt } from "./chain";
import { makeContext } from "./context";
import { buildPrompt, PROMPT_VERSION, type Reference } from "./prompt";
import type { LlmProvider } from "./providers/types";
import { validateReply } from "./validate";

export interface ExplainDeps {
  providers: LlmProvider[];
  store: KvStore;
  now: () => number;
  /** false: identical requests go to the AI as a reference too (CACHE_IDENTICAL_REUSE=false). */
  identicalReuse: boolean;
  /** AI requests per UTC day across all users (AI_INTEGRATION §8). */
  dailyBudget: number;
  /** Gets only provider, latency, status and cache tier: never notes or AI text (AI_INTEGRATION §9.5). */
  log?: (entry: { status: AiBlock["status"]; provider?: string; latencyMs?: number; attempts?: Attempt[] }) => void;
}

const DAY_MS = 24 * 3600 * 1000;
const unavailable: AiBlock = { status: "unavailable", adjustments: [], promptVersion: PROMPT_VERSION };

/**
 * The AI step for one validated input: recompute the rule result, try the cache (T1 identical → reuse,
 * T2 similar → reference draft), then the provider chain. Any failure gives "unavailable": the rule
 * result the user already sees stays complete.
 */
export async function explain(input: UserInput, kb: KnowledgeBase, deps: ExplainDeps): Promise<AiBlock> {
  const { store, now, log = () => {} } = deps;
  const ctx = makeContext(input, kb);

  // T1: identical request. The stored answer is re-checked against the fresh rule result.
  const identical = await findIdentical(store, ctx);
  let reference: (Reference & { tier: "identical" | "similar" }) | undefined;
  if (identical) {
    const v = validateReply(identical.response, ctx, buildPrompt(ctx).ids);
    if (v.ok && deps.identicalReuse) {
      log({ status: "cached", provider: identical.provider });
      return {
        status: "cached",
        reuse: { tier: "identical" },
        provider: identical.provider,
        model: identical.model,
        promptVersion: PROMPT_VERSION,
        adjustments: v.adjustments,
        explanation: v.explanation,
      };
    }
    if (v.ok) reference = { response: identical.response, differences: [], tier: "identical" };
  }

  const used = await store.incr(`ai-budget:${Math.floor(now() / DAY_MS)}`, DAY_MS);
  if (used > deps.dailyBudget) {
    log({ status: "unavailable" });
    return unavailable;
  }

  if (!reference) {
    const similar = await findSimilar(store, ctx);
    if (similar) reference = { ...similar, tier: "similar" };
  }

  const prompt = buildPrompt(ctx, reference);
  const result = await runChain(prompt, ctx, deps);
  if (!result.ok) {
    log({ status: "unavailable", attempts: result.attempts });
    return unavailable;
  }

  await saveEntry(store, entryFor(ctx, result.response, result.provider.label, result.provider.model, now()), ctx);
  const status = reference ? "adapted" : "ok";
  log({ status, provider: result.provider.id, latencyMs: result.latencyMs, attempts: result.attempts });
  return {
    status,
    ...(reference && { reuse: { tier: reference.tier, ...result.response.reuse } }),
    provider: result.provider.label,
    model: result.provider.model,
    promptVersion: PROMPT_VERSION,
    latencyMs: result.latencyMs,
    adjustments: result.adjustments,
    explanation: result.explanation,
  };
}
