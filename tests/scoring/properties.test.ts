import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { kb, LEVELS, type Level } from "@/modules/knowledge-base";
import { score, type UserInput } from "@/modules/scoring";

const levelArb = fc.constantFrom(...LEVELS);

/** Random valid inputs: any levels (at least one High/Critical), any driver options, any characteristics. */
const inputArb: fc.Arbitrary<UserInput> = fc
  .record({
    attributes: fc.record(
      Object.fromEntries(kb.attributes.map((a) => [a.id, levelArb])) as Record<string, fc.Arbitrary<Level>>,
      {
        requiredKeys: [],
      },
    ),
    priority: fc.constantFrom(...kb.attributes.map((a) => a.id)),
    priorityLevel: fc.constantFrom<Level>("high", "critical"),
    drivers: fc.record(
      Object.fromEntries(kb.drivers.map((d) => [d.id, fc.constantFrom(...d.options.map((o) => o.id))])),
    ),
    characteristics: fc.record(
      Object.fromEntries(
        kb.characteristics.map((c) => [
          c.id,
          c.type === "boolean" ? fc.boolean() : fc.constantFrom(...c.options.map((o) => o.id)),
        ]),
      ) as Record<string, fc.Arbitrary<boolean | string>>,
      { requiredKeys: [] },
    ),
  })
  .map(({ attributes, priority, priorityLevel, drivers, characteristics }): UserInput => ({
    attributes: { ...attributes, [priority]: priorityLevel },
    drivers,
    characteristics: characteristics as UserInput["characteristics"],
    notes: "",
  }));

const RUNS = { numRuns: 300 };

describe("engine properties", () => {
  it("is deterministic: score(x) deep-equals score(x)", () => {
    fc.assert(
      fc.property(inputArb, (x) => {
        expect(score(x, kb)).toEqual(score(structuredClone(x), kb));
      }),
      RUNS,
    );
  });

  it("ranks every non-excluded style exactly once, with scores in 0–100", () => {
    fc.assert(
      fc.property(inputArb, (x) => {
        const r = score(x, kb);
        const ids = [...r.ranked.map((s) => s.styleId), ...r.excluded.map((e) => e.styleId)].sort();
        expect(ids).toEqual(kb.styles.map((s) => s.id).sort());
        expect(new Set(r.ranked.map((s) => s.styleId)).size).toBe(r.ranked.length);
        expect(r.ranked.map((s) => s.rank)).toEqual(r.ranked.map((_, i) => i + 1));
        for (const s of r.ranked) {
          for (const v of [s.base, s.final]) {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(100);
          }
        }
      }),
      RUNS,
    );
  });

  it("never moves a final score more than 30 points from its base", () => {
    fc.assert(
      fc.property(inputArb, (x) => {
        for (const s of score(x, kb).ranked) expect(Math.abs(s.final - s.base)).toBeLessThanOrEqual(30 + 1e-9);
      }),
      RUNS,
    );
  });

  it("never ranks an excluded style", () => {
    fc.assert(
      fc.property(inputArb, (x) => {
        const r = score(x, kb);
        const ranked = new Set(r.ranked.map((s) => s.styleId));
        for (const e of r.excluded) expect(ranked.has(e.styleId)).toBe(false);
      }),
      RUNS,
    );
  });

  it("raising an attribute's level never lowers the base of a style scoring above its own average on it", () => {
    const order: Level[] = ["none", "low", "medium", "high", "critical"];
    fc.assert(
      fc.property(inputArb, fc.constantFrom(...kb.attributes.map((a) => a.id)), (x, attr) => {
        const current = (x.attributes[attr] ?? "low") as Level;
        const idx = order.indexOf(current);
        if (idx === order.length - 1) return;
        const raised: UserInput = { ...x, attributes: { ...x.attributes, [attr]: order[idx + 1] } };
        const before = score(x, kb);
        const after = score(raised, kb);
        for (const s of before.ranked) {
          const style = kb.styles.find((k) => k.id === s.styleId)!;
          const avg = s.base / 25 + 1;
          if (style.scores[attr]!.value > avg) {
            const later = after.ranked.find((a) => a.styleId === s.styleId)!;
            expect(later.base).toBeGreaterThanOrEqual(s.base - 1e-9);
          }
        }
      }),
      RUNS,
    );
  });
});
