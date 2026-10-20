import "server-only";
import type { KvStore } from "./store";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Per-client limits on /api/explain (AI_INTEGRATION §8): fixed windows, like @upstash/ratelimit's. */
export const RATE_LIMITS = [
  { name: "10m", windowMs: 10 * MINUTE, max: 10 },
  { name: "day", windowMs: DAY, max: 30 },
] as const;

/** Counts one request for `clientKey` and says whether it is within every limit. */
export async function allowRequest(store: KvStore, clientKey: string, now: number): Promise<boolean> {
  let allowed = true;
  for (const limit of RATE_LIMITS) {
    const window = Math.floor(now / limit.windowMs);
    const count = await store.incr(`rl:${limit.name}:${clientKey}:${window}`, limit.windowMs);
    if (count > limit.max) allowed = false;
  }
  return allowed;
}
