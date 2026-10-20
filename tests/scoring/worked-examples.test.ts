import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { score } from "@/modules/scoring";
import { exampleA, exampleB } from "./fixtures";

const row = (result: ReturnType<typeof score>, id: string) => {
  const r = result.ranked.find((s) => s.styleId === id);
  if (!r) throw new Error(`${id} not ranked`);
  return r;
};
const one = (n: number) => Math.round(n * 10) / 10;

describe("worked example A: student group project", () => {
  const result = score(exampleA, kb);

  it("resolves the documented effective weights (Σw = 25)", () => {
    expect(result.effectiveWeights).toEqual({
      simplicity: 3,
      modularity: 1,
      maintainability: 3,
      testability: 2,
      deployability: 2,
      evolvability: 1,
      performance: 1,
      scalability: 1,
      elasticity: 0,
      availability: 1,
      cost: 5,
      security: 2,
      consistency: 3,
    });
  });

  it("computes the modular monolith base as 84 / 25 → 59.0", () => {
    expect(one(row(result, "modular-monolith").base)).toBe(59.0);
  });

  it.each([
    // rank, style, base, rules, final
    [1, "modular-monolith", 59.0, 10, 69.0],
    [2, "layered", 52.0, 5, 57.0],
    [3, "service-based", 66.0, -10, 56.0],
    [4, "event-driven", 53.0, -5, 48.0],
    [5, "pipeline", 62.0, -15, 47.0],
    [6, "microkernel", 62.0, -15, 47.0],
    [7, "serverless", 48.0, -10, 38.0],
    [8, "microservices", 52.0, -15, 37.0],
    [9, "cell-based", 44.0, -25, 19.0],
    [10, "space-based", 35.0, -20, 15.0],
    [11, "peer-to-peer", 38.0, -30, 8.0],
    [12, "soa", 18.0, -10, 8.0],
    [13, "edge", 31.0, -30, 1.0],
  ])("#%i %s: base %f, rules %i, final %f", (rank, id, base, mod, final) => {
    const r = row(result, id);
    expect(r.rank).toBe(rank);
    expect(one(r.base)).toBe(base);
    expect(r.modifier).toBe(mod);
    expect(one(r.final)).toBe(final);
  });

  it("breaks the pipeline/microkernel tie on simplicity", () => {
    expect(row(result, "pipeline").rank).toBeLessThan(row(result, "microkernel").rank);
  });

  it("caps peer-to-peer and edge at −30", () => {
    expect(row(result, "peer-to-peer").modifierUncapped).toBe(-30);
    expect(row(result, "edge").modifierUncapped).toBe(-30);
    expect(row(result, "edge").modifier).toBe(-30);
  });

  it("fires R1, R18 and the otherwise branches of R6/R7/R8/R14/R16/R17", () => {
    expect(result.firedRules.map((r) => `${r.ruleId}:${r.branch}`)).toEqual([
      "R1:when",
      "R6:otherwise",
      "R7:otherwise",
      "R8:otherwise",
      "R14:otherwise",
      "R16:otherwise",
      "R17:otherwise",
      "R18:when",
    ]);
  });
});

describe("worked example B: concert ticketing platform", () => {
  const result = score(exampleB, kb);

  it("has Σw = 32", () => {
    expect(Object.values(result.effectiveWeights).reduce((a, b) => a + b, 0)).toBe(32);
  });

  it.each([
    [1, "space-based", 65.6, 15, 80.6],
    [2, "serverless", 65.6, 5, 70.6],
    [3, "microservices", 69.5, 0, 69.5],
    [4, "event-driven", 68.8, 0, 68.8],
    [5, "cell-based", 70.3, -10, 60.3],
    [6, "service-based", 53.1, 0, 53.1],
  ])("#%i %s: base %f, rules %i, final %f", (rank, id, base, mod, final) => {
    const r = row(result, id);
    expect(r.rank).toBe(rank);
    expect(one(r.base)).toBe(base);
    expect(r.modifier).toBe(mod);
    expect(one(r.final)).toBe(final);
  });

  it.each([
    ["peer-to-peer", 38.6],
    ["soa", 35.9],
    ["edge", 34.7],
    ["modular-monolith", 29.7],
    ["layered", 24.2],
    ["microkernel", 19.4],
    ["pipeline", 14.7],
  ])("%s final %f", (id, final) => {
    expect(one(row(result, id).final)).toBe(final);
  });

  it("fires R6 and the otherwise branches of R7/R8/R14/R16/R17", () => {
    expect(result.firedRules.map((r) => `${r.ruleId}:${r.branch}`)).toEqual([
      "R6:when",
      "R7:otherwise",
      "R8:otherwise",
      "R14:otherwise",
      "R16:otherwise",
      "R17:otherwise",
    ]);
  });
});
