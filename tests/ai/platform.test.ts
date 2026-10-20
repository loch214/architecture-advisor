import { describe, expect, it } from "vitest";
import { allowRequest } from "@/modules/platform/rate-limit";
import { MemoryStore } from "@/modules/platform/store";

describe("memory store", () => {
  it("expires keys, counts and keeps the most recent list items", async () => {
    let t = 0;
    const s = new MemoryStore(() => t);
    await s.set("k", 1, 100);
    expect(await s.get("k")).toBe(1);
    t = 100;
    expect(await s.get("k")).toBeUndefined();
    expect([await s.incr("c", 50), await s.incr("c", 50)]).toEqual([1, 2]);
    for (const v of [1, 2, 3]) await s.pushRecent("l", v, 2, 1000);
    expect(await s.list("l")).toEqual([3, 2]);
  });
});

describe("rate limit", () => {
  it("allows 10 per 10 minutes, then blocks the 11th; a new window allows again", async () => {
    let t = 0;
    const s = new MemoryStore(() => t);
    const results = [];
    for (let i = 0; i < 11; i++) results.push(await allowRequest(s, "ip", t));
    expect(results.filter(Boolean)).toHaveLength(10);
    expect(results[10]).toBe(false);
    expect(await allowRequest(s, "other-ip", t)).toBe(true);
    t = 10 * 60_000;
    expect(await allowRequest(s, "ip", t)).toBe(true);
  });

  it("allows 30 per day", async () => {
    const s = new MemoryStore(() => 0);
    let allowed = 0;
    for (let w = 0; w < 4; w++)
      for (let i = 0; i < 10; i++) if (await allowRequest(s, "ip", w * 600_000 + i)) allowed++;
    expect(allowed).toBe(30);
  });
});
