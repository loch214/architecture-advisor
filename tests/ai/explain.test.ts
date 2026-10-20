import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { differences, entryFor, jaccard, notesTokens } from "@/modules/ai/cache";
import { explain, type ExplainDeps } from "@/modules/ai/explain";
import { mockReply } from "@/modules/ai/providers/mock";
import { ProviderError } from "@/modules/ai/providers/types";
import { MemoryStore } from "@/modules/platform/store";
import type { UserInput } from "@/modules/scoring";
import { exampleA, exampleB } from "../scoring/fixtures";
import { ctxFor, fakeProvider, validReply } from "./helpers";

const answering = (id = "a") => fakeProvider(id, [(p: Parameters<typeof mockReply>[0]) => mockReply(p)]);

function deps(over: Partial<ExplainDeps> = {}, provider = answering()) {
  return {
    provider,
    deps: {
      providers: [provider.provider],
      store: new MemoryStore(),
      now: () => 0,
      identicalReuse: true,
      dailyBudget: 100,
      ...over,
    },
  };
}

const withNotes = (notes: string): UserInput => ({ ...exampleB, notes });

describe("explain", () => {
  it("returns ok with provider details, adjustments and explanation", async () => {
    const { deps: d } = deps();
    const ai = await explain(exampleB, kb, d);
    expect(ai).toMatchObject({ status: "ok", provider: "a", model: "a-model", promptVersion: "1", adjustments: [] });
    expect(ai.explanation?.topPick.styleId).toBe("space-based");
    expect(ai.explanation?.others[0]).toHaveProperty("why");
  });

  it("returns unavailable when every provider fails, and stores nothing", async () => {
    const failing = fakeProvider("a", [new ProviderError("server", "503")]);
    const { deps: d } = deps({}, failing);
    expect((await explain(exampleB, kb, d)).status).toBe("unavailable");
    expect((await explain(exampleB, kb, d)).status).toBe("unavailable");
    expect(failing.calls).toHaveLength(2);
  });

  it("stops at the global daily budget", async () => {
    const { deps: d } = deps({ dailyBudget: 1, identicalReuse: false });
    expect((await explain(exampleB, kb, d)).status).toBe("ok");
    expect((await explain(withNotes("other"), kb, d)).status).toBe("unavailable");
  });
});

describe("cache T1 (identical)", () => {
  it("reuses an identical request without calling the AI; whitespace and case in notes don't matter", async () => {
    const { deps: d, provider } = deps();
    await explain(withNotes("We use Kafka a lot"), kb, d);
    const again = await explain(withNotes("  we use KAFKA   a lot "), kb, d);
    expect(again).toMatchObject({ status: "cached", reuse: { tier: "identical" }, provider: "a" });
    expect(provider.calls).toHaveLength(1);
  });

  it("a different input or a prompt/KB version bump misses", async () => {
    const { deps: d, provider } = deps();
    await explain(exampleB, kb, d);
    await explain({ ...exampleB, attributes: { ...exampleB.attributes, cost: "high" } }, kb, d);
    const bumped = { ...kb, meta: { ...kb.meta, kbVersion: "9.9.9" } };
    await explain(exampleB, bumped, d);
    expect(provider.calls).toHaveLength(3);
  });

  it("re-validates a stored answer against the fresh rule result", async () => {
    const { deps: d, provider } = deps();
    const ctx = ctxFor(exampleB);
    const stale = validReply(ctx);
    stale.explanation.topPick.styleId = ctx.top[1]; // no longer consistent
    await d.store.set(
      `ai:t1:${entryFor(ctx, stale as never, "x", "y", 0).identicalKey}`,
      entryFor(ctx, stale as never, "x", "y", 0),
      1e9,
    );
    expect((await explain(exampleB, kb, d)).status).toBe("ok");
    expect(provider.calls).toHaveLength(1);
  });

  it("CACHE_IDENTICAL_REUSE=false sends identical requests to the AI with the old answer as reference", async () => {
    const { deps: d, provider } = deps({ identicalReuse: false });
    await explain(exampleB, kb, d);
    const again = await explain(exampleB, kb, d);
    expect(again).toMatchObject({ status: "adapted", reuse: { tier: "identical", fits: true } });
    expect(provider.calls[1]).toMatch(/REFERENCE: /);
  });
});

describe("cache T2 (similar)", () => {
  const base = withNotes("We run Kafka in production and the team knows event streaming well");

  it("sends a similar scenario's answer as a reference with the diff list", async () => {
    const { deps: d, provider } = deps();
    await explain(base, kb, d);
    const similar = { ...base, drivers: { ...base.drivers, "time-to-market": "relaxed" } };
    const ai = await explain(similar, kb, d);
    expect(ai).toMatchObject({ status: "adapted", reuse: { tier: "similar", fits: true } });
    expect(provider.calls[1]).toMatch(/Differences between the scenarios: time-to-market: Not sure -> No rush/);
  });

  it("fits:true with a failing consistency check is invalid (repair, then next provider)", async () => {
    const bad = fakeProvider("a", [
      (p: Parameters<typeof mockReply>[0]) => mockReply(p),
      (p: Parameters<typeof mockReply>[0]) => {
        const r = mockReply(p) as ReturnType<typeof validReply>;
        r.explanation.topPick.styleId = p.ids.top[1];
        return r;
      },
    ]);
    const { deps: d } = deps({}, bad);
    await explain(base, kb, d);
    const ai = await explain({ ...base, drivers: { ...base.drivers, "time-to-market": "relaxed" } }, kb, d);
    expect(ai.status).toBe("unavailable");
    expect(bad.calls).toHaveLength(3);
  });

  it("an adjustment whose quoted reason isn't in the new notes is rejected", async () => {
    const ctx = ctxFor(withNotes("We run RabbitMQ in production with a team that knows messaging"));
    const r = validReply(ctx);
    r.adjustments = [{ styleId: ctx.top[2], delta: 1, reason: 'Notes say "run Kafka in production".', basis: "notes" }];
    const { validateReply } = await import("@/modules/ai/validate");
    const { buildPrompt } = await import("@/modules/ai/prompt");
    expect(validateReply(r, ctx, buildPrompt(ctx).ids).ok).toBe(false);
  });

  describe("similarity test", () => {
    const stored = (input: UserInput) => {
      const c = ctxFor(input);
      return entryFor(c, validReply(c) as never, "a", "m", 0);
    };
    const entry = stored(base);
    const diff = (input: UserInput) => differences(ctxFor(input), entry);

    it("weights within one level pass; two levels apart fail", () => {
      expect(diff({ ...base, attributes: { ...base.attributes, security: "high" } })).toEqual([
        "importance of security: Medium -> High",
      ]);
      expect(diff({ ...base, attributes: { ...base.attributes, security: "none" } })).toBeUndefined();
    });

    it("two driver changes pass; three fail", () => {
      const two = { ...base.drivers, "time-to-market": "relaxed", "change-rate": "sometimes" };
      expect(diff({ ...base, drivers: two })).toHaveLength(2);
      expect(diff({ ...base, drivers: { ...two, experience: "some" } })).toBeUndefined();
    });

    it("notes need Jaccard ≥ 0.6 and the same mentions", () => {
      expect(jaccard(["a", "b", "c", "d", "e"], ["a", "b", "c", "d", "f"])).toBeCloseTo(4 / 6);
      expect(jaccard([], [])).toBe(1);
      expect(diff(withNotes("We run Kafka in production; the team knows event streaming very well"))).toEqual([
        "the notes are worded differently",
      ]);
      expect(diff(withNotes("Completely different text about a mobile shopping app"))).toBeUndefined();
      expect(diff(withNotes(base.notes + " and CQRS"))).toBeUndefined();
      expect(notesTokens("The team, THE team!")).toEqual(["team"]);
    });

    it("both empty notes match; a different top-3 order lands in another bucket", async () => {
      const empty = entryFor(ctxFor(exampleB), validReply(ctxFor(exampleB)) as never, "a", "m", 0);
      expect(differences(ctxFor(exampleB), empty)).toEqual([]);
      const { bucketKey } = await import("@/modules/ai/cache");
      expect(ctxFor(exampleA).top.slice(0, 3)).not.toEqual(ctxFor(exampleB).top.slice(0, 3));
      expect(bucketKey(ctxFor(exampleA))).not.toBe(bucketKey(ctxFor(exampleB)));
    });
  });
});
