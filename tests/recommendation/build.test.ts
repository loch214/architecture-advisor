import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { buildResult, finalScores, topPickChange, withAi, type AiBlock } from "@/modules/recommendation";
import { score } from "@/modules/scoring";
import { exampleA, exampleB } from "../scoring/fixtures";

const ctx = { id: "00000000-0000-4000-8000-000000000000", createdAt: "2026-10-20T00:00:00.000Z", appVersion: "0.1.0" };
const disabled: AiBlock = { status: "disabled", adjustments: [] };

describe("buildResult", () => {
  it("wraps the engine result with versions, context and an AI block", () => {
    const r = buildResult(exampleA, kb, ctx, disabled);
    expect(r.id).toBe(ctx.id);
    expect(r.createdAt).toBe(ctx.createdAt);
    expect(r.versions).toEqual({ app: "0.1.0", kb: kb.meta.kbVersion, engine: r.rules.engineVersion });
    expect(r.rules).toEqual(score(exampleA, kb));
    expect(r.ai).toEqual(disabled);
  });

  it("is pure: same input and context give a deep-equal result", () => {
    expect(buildResult(exampleB, kb, ctx, disabled)).toEqual(buildResult(exampleB, kb, ctx, disabled));
  });

  it("with no AI adjustments, final scores equal rule scores in rule order", () => {
    const r = buildResult(exampleB, kb, ctx, disabled);
    expect(r.final.map((f) => [f.styleId, f.finalScore, f.aiDelta])).toEqual(
      r.rules.ranked.map((s) => [s.styleId, s.final, 0]),
    );
  });

  it("snapshots every style's KB scores and marks flagged estimates", () => {
    const r = buildResult(exampleA, kb, ctx, disabled);
    expect(Object.keys(r.snapshot.styles)).toHaveLength(kb.styles.length);
    expect(r.snapshot.styles["modular-monolith"]!.scores.simplicity).toBe(5);
    expect(r.snapshot.styles["modular-monolith"]!.estimated).toEqual([]);
    expect(r.snapshot.styles.pipeline!.estimated.length).toBeGreaterThan(0);
  });

  it("matches glossary mentions in the notes", () => {
    const r = buildResult({ ...exampleB, notes: "We already run Kafka and want CQRS." }, kb, ctx, disabled);
    expect(r.mentions.map((m) => m.id)).toEqual(expect.arrayContaining(["cqrs"]));
  });
});

describe("finalScores / withAi", () => {
  it("applies AI deltas and re-sorts (worked example B: microservices +4 moves to #2)", () => {
    const rules = score(exampleB, kb);
    const final = finalScores(
      rules,
      [{ styleId: "microservices", delta: 4, reason: "Kubernetes", basis: "notes" }],
      kb,
    );
    expect(final.slice(0, 2).map((f) => f.styleId)).toEqual(["space-based", "microservices"]);
    // Displayed as 69.5 → 73.5 (SCORING_ENGINE example B); stored unrounded.
    expect(final[1]).toMatchObject({ aiDelta: 4, rank: 2 });
    expect(Math.round(final[1]!.finalScore * 10) / 10).toBe(73.5);
  });

  it("withAi replaces the AI block and recomputes final scores without touching the rule result", () => {
    const r = buildResult(exampleB, kb, ctx, disabled);
    const ai: AiBlock = {
      status: "ok",
      adjustments: [{ styleId: "serverless", delta: -5, reason: "x", basis: "inputs" }],
    };
    const merged = withAi(r, ai, kb);
    expect(merged.rules).toBe(r.rules);
    expect(merged.final.find((f) => f.styleId === "serverless")).toMatchObject({ aiDelta: -5, finalScore: 65.625 });
  });
});

describe("topPickChange", () => {
  it("is undefined when the AI kept the rule engine's #1", () => {
    const r = buildResult(exampleB, kb, ctx, disabled);
    const ai: AiBlock = {
      status: "ok",
      adjustments: [{ styleId: "serverless", delta: 5, reason: "x", basis: "inputs" }],
    };
    expect(topPickChange(withAi(r, ai, kb))).toBeUndefined();
  });

  it("names both styles when a different style ends up first", () => {
    const r = buildResult(exampleB, kb, ctx, disabled);
    const swapped = { ...r, final: [r.final[1]!, r.final[0]!, ...r.final.slice(2)] };
    expect(topPickChange(swapped)).toEqual({ ruleTop: "space-based", finalTop: "serverless" });
  });
});
