import { afterEach, describe, expect, it, vi } from "vitest";
import { COOLING_MS, runChain } from "@/modules/ai/chain";
import { buildPrompt } from "@/modules/ai/prompt";
import { ProviderError } from "@/modules/ai/providers/types";
import { MemoryStore } from "@/modules/platform/store";
import { exampleB } from "../scoring/fixtures";
import { ctxFor, fakeProvider, validReply } from "./helpers";

const ctx = ctxFor(exampleB);
const prompt = buildPrompt(ctx);
const ok = validReply(ctx);

function setup(...providers: ReturnType<typeof fakeProvider>[]) {
  let clock = 1_000_000;
  const now = () => clock;
  const store = new MemoryStore(now);
  return {
    store,
    advance: (ms: number) => (clock += ms),
    run: () => runChain(prompt, ctx, { providers: providers.map((p) => p.provider), store, now }),
  };
}

afterEach(() => vi.useRealTimers());

describe("provider chain", () => {
  it("uses the first provider when it answers", async () => {
    const a = fakeProvider("a", [ok]);
    const b = fakeProvider("b", [ok]);
    const r = await setup(a, b).run();
    expect(r).toMatchObject({ ok: true, provider: { id: "a" } });
    expect(b.calls).toHaveLength(0);
  });

  it.each(["server", "network", "empty", "rejected"] as const)("%s error → next provider, no retry", async (kind) => {
    const a = fakeProvider("a", [new ProviderError(kind, kind)]);
    const b = fakeProvider("b", [ok]);
    const r = await setup(a, b).run();
    expect(r).toMatchObject({ ok: true, provider: { id: "b" } });
    expect(a.calls).toHaveLength(1);
  });

  it("timeout → next provider", async () => {
    vi.useFakeTimers();
    const a = fakeProvider("a", ["hang"], 10_000);
    const b = fakeProvider("b", [ok]);
    const running = setup(a, b).run();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await running).toMatchObject({ ok: true, provider: { id: "b" }, attempts: [{ outcome: "timeout" }, {}] });
  });

  it("429 per minute → next provider, and the first rests for 60 s", async () => {
    const a = fakeProvider("a", [new ProviderError("rate-minute", "429"), ok]);
    const b = fakeProvider("b", [ok]);
    const s = setup(a, b);
    await s.run();
    expect((await s.run()).attempts[0]).toEqual({ provider: "a", outcome: "resting" });
    s.advance(COOLING_MS + 1);
    expect(await s.run()).toMatchObject({ ok: true, provider: { id: "a" } });
    expect(a.calls).toHaveLength(2);
  });

  it("429 daily → exhausted until the reset (Retry-After wins when given)", async () => {
    const a = fakeProvider("a", [new ProviderError("rate-daily", "429"), ok]);
    const b = fakeProvider("b", [ok]);
    const s = setup(a, b);
    await s.run();
    s.advance(3_599_000);
    expect((await s.run()).attempts[0].outcome).toBe("resting");
    s.advance(2_000);
    expect(await s.run()).toMatchObject({ provider: { id: "a" } });

    const c = fakeProvider("c", [new ProviderError("rate-daily", "429", 5_000), ok]);
    const s2 = setup(c, fakeProvider("d", [ok]));
    await s2.run();
    s2.advance(5_001);
    expect(await s2.run()).toMatchObject({ provider: { id: "c" } });
  });

  it("invalid reply → one repair retry on the same provider with the reason", async () => {
    const a = fakeProvider("a", ["not json", ok]);
    const r = await setup(a).run();
    expect(r).toMatchObject({ ok: true, provider: { id: "a" } });
    expect(a.calls[1]).toMatch(/Your previous reply was invalid: the reply held no JSON object/);
  });

  it("invalid twice → next provider", async () => {
    const a = fakeProvider("a", ["not json", { adjustments: [] }]);
    const b = fakeProvider("b", [ok]);
    const r = await setup(a, b).run();
    expect(r).toMatchObject({ ok: true, provider: { id: "b" } });
    expect(r.attempts.map((x) => x.outcome)).toEqual(["invalid", "invalid", "ok"]);
  });

  it("all fail → not ok; no providers → not ok", async () => {
    const r = await setup(fakeProvider("a", [new ProviderError("server", "")]), fakeProvider("b", ["x"])).run();
    expect(r.ok).toBe(false);
    expect((await setup().run()).ok).toBe(false);
  });

  it("respects the 20 s total budget", async () => {
    vi.useFakeTimers();
    const start = Date.now();
    const a = fakeProvider("a", ["hang"], 15_000);
    const b = fakeProvider("b", ["hang"], 15_000);
    const store = new MemoryStore();
    const running = runChain(prompt, ctx, { providers: [a.provider, b.provider], store, now: Date.now });
    await vi.advanceTimersByTimeAsync(20_000);
    const r = await running;
    expect(r.ok).toBe(false);
    expect(Date.now() - start).toBe(20_000);
    expect(b.calls).toHaveLength(1);
  });
});
