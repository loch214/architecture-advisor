import "server-only";

/**
 * The small key-value store the AI layer needs for its cache, rate limits and circuit breaker. Shaped like
 * Redis (GET/SET with TTL, INCR, LPUSH+LTRIM) so an Upstash adapter can be added later (Q25) without
 * touching callers. Until then each server instance keeps its own in-memory copy.
 */
export interface KvStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
  /** Adds 1 and returns the new count; the TTL is set when the key is created. */
  incr(key: string, ttlMs: number): Promise<number>;
  /** Puts `value` first in a list and keeps the `max` most recent. */
  pushRecent<T>(key: string, value: T, max: number, ttlMs: number): Promise<void>;
  list<T>(key: string): Promise<T[]>;
}

export class MemoryStore implements KvStore {
  private readonly entries = new Map<string, { value: unknown; expiresAt: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  private read(key: string): unknown {
    const e = this.entries.get(key);
    if (!e) return undefined;
    if (e.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return e.value;
  }

  private write(key: string, value: unknown, ttlMs: number) {
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
  }

  async get<T>(key: string) {
    return this.read(key) as T | undefined;
  }

  async set<T>(key: string, value: T, ttlMs: number) {
    this.write(key, value, ttlMs);
  }

  async incr(key: string, ttlMs: number) {
    const current = this.read(key);
    if (typeof current !== "number") {
      this.write(key, 1, ttlMs);
      return 1;
    }
    this.entries.get(key)!.value = current + 1;
    return current + 1;
  }

  async pushRecent<T>(key: string, value: T, max: number, ttlMs: number) {
    const current = (this.read(key) as T[] | undefined) ?? [];
    this.write(key, [value, ...current].slice(0, max), ttlMs);
  }

  async list<T>(key: string) {
    return (this.read(key) as T[] | undefined) ?? [];
  }
}

let shared = new MemoryStore();

/** The store for this server instance. */
export const sharedStore = (): KvStore => shared;

/** Tests only: forget everything (cache, counters, breaker state). */
export function resetSharedStore() {
  shared = new MemoryStore();
}
