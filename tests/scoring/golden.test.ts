import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { score, type RuleResult } from "@/modules/scoring";
import { goldenScenarios } from "./golden";

const ids = (r: RuleResult, n: number) => r.ranked.slice(0, n).map((s) => s.styleId);

/** Extra expectations per scenario ("Also expected" column of TESTING_STRATEGY §2). */
const extra: Record<string, (r: RuleResult) => void> = {
  G1: (r) => expect(ids(r, 3).some((id) => id === "layered" || id === "service-based")).toBe(true),
  G3: (r) =>
    expect(
      ids(r, 4).filter((id) => ["serverless", "microservices", "event-driven"].includes(id)).length,
    ).toBeGreaterThan(0),
  G6: (r) => expect(ids(r, 5)).toContain("modular-monolith"),
  G9: (r) => {
    expect(r.excluded.map((e) => e.styleId)).toContain("serverless");
    expect(ids(r, 3)).not.toContain("event-driven");
  },
  G10: (r) => expect(r.conflicts.map((c) => c.attribute)).toContain("scalability"),
  G11: (r) => expect(r.ranked[1]!.styleId).toBe("microservices"),
  G12: (r) => expect(r.excluded.map((e) => e.styleId)).toContain("serverless"),
  G14: (r) => expect(ids(r, 2)).toContain("edge"),
  G15: (r) => expect(r.ranked[1]!.styleId).toBe("modular-monolith"),
  G16: (r) => expect(r.warnings.map((w) => w.ruleId)).toContain("N3"),
  // An installed app ships as one program: no style that splits it into network services may appear.
  G17: (r) =>
    expect(r.excluded.map((e) => e.styleId)).toEqual(expect.arrayContaining(["microservices", "service-based"])),
  G18: (r) => expect(r.notes.map((n) => n.ruleId)).toContain("N1"),
  G19: (r) => expect(ids(r, 2)).not.toContain("microservices"),
  G22: (r) => expect(r.excluded.map((e) => e.styleId)).toContain("microservices"),
};

describe("golden scenarios", () => {
  it("covers all 22 scenarios", () => {
    expect(goldenScenarios.map((g) => g.id)).toEqual(Array.from({ length: 22 }, (_, i) => `G${i + 1}`));
  });

  it.each(goldenScenarios)("$id $title", ({ id, input, expectedTop }) => {
    const r = score(input, kb);
    if (expectedTop.length > 0) expect(expectedTop).toContain(r.ranked[0]!.styleId);
    extra[id]?.(r);
  });
});
