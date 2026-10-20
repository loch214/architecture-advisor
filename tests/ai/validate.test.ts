import { describe, expect, it } from "vitest";
import { buildPrompt } from "@/modules/ai/prompt";
import { parseReply, sanitize, validateReply } from "@/modules/ai/validate";
import { exampleB } from "../scoring/fixtures";
import { goldenScenarios } from "../scoring/golden";
import { ctxFor, validReply } from "./helpers";

const golden = (id: string) => goldenScenarios.find((g) => g.id === id)!.input;
const ctx = ctxFor({ ...exampleB, notes: "We already run Kafka in production and the team knows it well." });
const ids = buildPrompt(ctx).ids;
const check = (reply: unknown) => validateReply(reply, ctx, ids);
const reason = (reply: unknown) => {
  const v = check(reply);
  return v.ok ? "ok" : v.reason;
};

describe("response schema", () => {
  it("accepts a valid reply and strips unknown keys", () => {
    const v = check({ ...validReply(ctx), extra: "x" });
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.response).not.toHaveProperty("extra");
  });

  it("rejects missing fields and wrong types", () => {
    const r = validReply(ctx);
    expect(reason({ adjustments: [] })).toMatch(/^explanation/);
    expect(reason({ ...r, adjustments: "none" })).toMatch(/^adjustments/);
  });

  it.each([0, 6, -7, 2.5])("rejects delta %s", (delta) => {
    const r = validReply(ctx);
    r.adjustments = [{ styleId: ctx.top[1], delta, reason: "Because of the inputs given.", basis: "inputs" }];
    expect(check(r).ok).toBe(false);
  });

  it("rejects more than 3 adjustments, duplicate ids, unknown ids and excluded styles", () => {
    const adj = (styleId: string) => ({ styleId, delta: 1, reason: "Matches the stated inputs.", basis: "inputs" });
    const r = validReply(ctx);
    r.adjustments = ctx.top.slice(1, 5).map(adj);
    expect(reason(r)).toMatch(/adjustments/);
    r.adjustments = [adj(ctx.top[1]), adj(ctx.top[1])];
    expect(reason(r)).toMatch(/once/);
    r.adjustments = [adj("cqrs-style")];
    expect(check(r).ok).toBe(false);
    const g9 = ctxFor(golden("G9"));
    expect(g9.rules.excluded.map((e) => e.styleId)).toEqual(["serverless"]);
    const r9 = validReply(g9);
    r9.adjustments = [adj("serverless")];
    expect(validateReply(r9, g9, buildPrompt(g9).ids).ok).toBe(false);
  });
});

describe("parsing", () => {
  it("reads JSON in fences or after prose, and reports empty, truncated or missing JSON", () => {
    const json = JSON.stringify(validReply(ctx));
    expect(check("```json\n" + json + "\n```").ok).toBe(true);
    expect(check("Here is the answer: " + json).ok).toBe(true);
    expect(reason(json.slice(0, -20))).toMatch(/not valid JSON/);
    expect(reason("")).toMatch(/empty/);
    expect(reason("no json here")).toMatch(/no JSON/);
    expect(parseReply(null).ok).toBe(false);
  });
});

describe("consistency", () => {
  it("topPick must be #1 after adjustments", () => {
    const r = validReply(ctx);
    r.explanation.topPick.styleId = ctx.top[1];
    r.explanation.others = r.explanation.others.filter((o) => o.styleId !== ctx.top[1]);
    expect(reason(r)).toMatch(/topPick must be/);
  });

  it("others must not contain topPick or repeat a style", () => {
    const r = validReply(ctx);
    r.explanation.others = [{ styleId: ctx.top[0], whyLower: "x" }];
    expect(reason(r)).toMatch(/must not include topPick/);
    r.explanation.others = [
      { styleId: ctx.top[1], whyLower: "x" },
      { styleId: ctx.top[1], whyLower: "y" },
    ];
    expect(reason(r)).toMatch(/repeat/);
  });

  it("an adjustment based on notes must quote only what the notes say", () => {
    const r = validReply(ctx);
    r.adjustments = [{ styleId: ctx.top[1], delta: 2, reason: 'Notes say "we use RabbitMQ daily".', basis: "notes" }];
    expect(reason(r)).toMatch(/not in the notes/);
    r.adjustments[0].reason = 'Notes say "already run Kafka in production".';
    // A small boost to #2 doesn't pass #1 here, so topPick stays valid.
    expect(reason(r)).toBe("ok");
    const noNotes = ctxFor(exampleB);
    expect(validateReply(r, noNotes, buildPrompt(noNotes).ids)).toMatchObject({ ok: false });
  });

  it("mentions must answer every matched item, once", () => {
    const c = ctxFor({ ...exampleB, notes: "Should we use CQRS here?" });
    const p = buildPrompt(c);
    expect(p.ids.mentions.length).toBeGreaterThan(0);
    const r = validReply(c);
    expect(validateReply(r, c, p.ids).ok).toBe(true);
    r.explanation.mentions = [];
    expect(validateReply(r, c, p.ids)).toMatchObject({ ok: false, reason: expect.stringMatching(/must answer/) });
    const answer = { id: p.ids.mentions[0], answer: "CQRS splits reads and writes." };
    r.explanation.mentions = [answer, answer];
    expect(validateReply(r, c, p.ids).ok).toBe(false);
  });
});

describe("clamp and apply", () => {
  it("re-sorts with the engine's tie-break: a boost that overtakes #1 needs a new topPick", () => {
    // G10 ties service-based and serverless at 58; the tie-break puts service-based first.
    const g10 = ctxFor(golden("G10"));
    const g10Ids = buildPrompt(g10).ids;
    expect(g10.top.slice(0, 2)).toEqual(["service-based", "serverless"]);
    const r = validReply(g10);
    r.adjustments = [{ styleId: "serverless", delta: 1, reason: "Spiky traffic suits pay-per-use.", basis: "inputs" }];
    expect(validateReply(r, g10, g10Ids)).toMatchObject({ ok: false, reason: expect.stringMatching(/serverless/) });
    r.explanation.topPick.styleId = "serverless";
    r.explanation.others = r.explanation.others.map((o) =>
      o.styleId === "serverless" ? { ...o, styleId: "service-based" } : o,
    );
    expect(validateReply(r, g10, g10Ids)).toMatchObject({ ok: true, adjustments: [{ delta: 1 }] });
  });

  it("clamps deltas itself even when the schema is bypassed", async () => {
    const { finalScores } = await import("@/modules/recommendation");
    const { kb } = await import("@/modules/knowledge-base");
    const final = finalScores(ctx.rules, [{ styleId: ctx.top[4], delta: 999, reason: "x", basis: "inputs" }], kb);
    expect(final.every((f) => f.finalScore <= 100)).toBe(true);
  });
});

describe("sanitising", () => {
  it("strips HTML, script blocks and markdown links", () => {
    expect(sanitize('Use <b>layers</b><script>alert("x")</script> [docs](https://evil.example) now')).toBe(
      "Use layers docs now",
    );
    const r = validReply(ctx);
    r.explanation.summary = "<img src=x onerror=alert(1)>Plain [link](javascript:alert(1)) text";
    const v = check(r);
    expect(v.ok && v.explanation.summary).toBe("Plain link text");
  });
});
