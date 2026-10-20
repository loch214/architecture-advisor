import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { previewFloors, score } from "@/modules/scoring";
import { exampleA } from "./fixtures";

describe("previewFloors (live floor chips in the form)", () => {
  it("returns nothing for an empty, partly answered form", () => {
    expect(previewFloors({ attributes: {}, drivers: {}, characteristics: {} }, kb)).toEqual({
      floors: [],
      conflicts: [],
    });
  });

  it("treats unanswered drivers as 'Not sure' and still shows floors from answered ones", () => {
    const { floors } = previewFloors({ attributes: {}, drivers: { growth: "rapid" }, characteristics: {} }, kb);
    expect(floors.map((f) => f.attribute)).toContain("scalability");
    expect(floors.every((f) => f.from.every((s) => s.kind !== "driver" || s.driverId === "growth"))).toBe(true);
  });

  it("includes floors set by rules (strict ACID → consistency Critical)", () => {
    const { floors } = previewFloors({ attributes: {}, drivers: {}, characteristics: { "strict-acid": true } }, kb);
    expect(floors).toContainEqual(
      expect.objectContaining({
        attribute: "consistency",
        level: "critical",
        from: [expect.objectContaining({ kind: "rule", ruleId: "R11" })],
      }),
    );
  });

  it("reports a conflict only when a floor beats a level the user set", () => {
    const set = previewFloors(
      { attributes: { cost: "low" }, drivers: { budget: "very-limited" }, characteristics: {} },
      kb,
    );
    expect(set.conflicts.map((c) => c.attribute)).toEqual(["cost"]);
    const unset = previewFloors({ attributes: {}, drivers: { budget: "very-limited" }, characteristics: {} }, kb);
    expect(unset.conflicts).toEqual([]);
  });

  it("matches the engine for a complete input", () => {
    const full = score(exampleA, kb);
    expect(previewFloors(exampleA, kb)).toEqual({ floors: full.floors, conflicts: full.conflicts });
  });
});
