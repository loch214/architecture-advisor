import { describe, expect, it } from "vitest";
import { kb, type KnowledgeBase } from "@/modules/knowledge-base";
import {
  score,
  checkInput,
  evaluateCondition,
  resolveWeights,
  fitFor,
  compareStyles,
  InvalidInputError,
  ENGINE_VERSION,
} from "@/modules/scoring";
import { makeInput } from "./fixtures";

const base = makeInput({ attributes: { maintainability: "high" } });
const byId = (r: ReturnType<typeof score>, id: string) => r.ranked.find((s) => s.styleId === id);

/** A tiny two-attribute KB so hand calculations stay readable. */
function tinyKb(): KnowledgeBase {
  const t = structuredClone(kb);
  t.attributes = t.attributes.filter((a) => a.id === "simplicity" || a.id === "cost");
  t.styles = t.styles.slice(0, 2).map((s) => ({
    ...s,
    combinesWith: [],
    scores: { simplicity: s.scores.simplicity!, cost: s.scores.cost! },
  }));
  t.drivers = [
    {
      id: "budget",
      label: "Budget",
      help: "",
      options: [
        { id: "unsure", label: "Not sure", floors: {} },
        {
          id: "tight",
          label: "Tight",
          floors: { cost: "high" },
          source: { kind: "design", note: "t", reviewed: true },
        },
      ],
    },
  ];
  t.characteristics = [t.characteristics.find((c) => c.id === "plugins")!];
  t.rules = [];
  return t;
}

const tinyInput = {
  attributes: { simplicity: "high" as const },
  drivers: { budget: "unsure" },
  characteristics: {},
  notes: "",
};

describe("weights", () => {
  it("maps levels to 0/1/2/3/5 and treats unset attributes as low", () => {
    const { weights } = resolveWeights(
      makeInput({ attributes: { performance: "none", scalability: "medium", security: "high", cost: "critical" } }),
      kb,
      [],
    );
    expect(weights.performance).toBe(0);
    expect(weights.scalability).toBe(2);
    expect(weights.security).toBe(3);
    expect(weights.cost).toBe(5);
    expect(weights.simplicity).toBe(1);
  });

  it("uses the maximum of the user level and every floor", () => {
    const r = score(
      makeInput({ attributes: { maintainability: "high" }, drivers: { "team-size": "30+", lifespan: "5+" } }),
      kb,
    );
    // 30+ → maintainability ≥ medium; 5+ years → maintainability ≥ high. User High. Max = high.
    expect(r.effectiveLevels.maintainability).toBe("high");
    expect(r.effectiveLevels.modularity).toBe("high");
    expect(r.floors.find((f) => f.attribute === "maintainability")!.from.map((f) => f.label)).toEqual([
      "30+",
      "5+ years",
    ]);
  });

  it("records a conflict only when a floor beats a level the user chose", () => {
    const r = score(
      makeInput({ attributes: { scalability: "low", maintainability: "high" }, drivers: { growth: "rapid" } }),
      kb,
    );
    expect(r.conflicts).toHaveLength(1);
    expect(r.conflicts[0]).toMatchObject({ attribute: "scalability", userLevel: "low", usedLevel: "high" });
    expect(r.conflicts[0]!.message).toContain("Rapid growth");
    expect(r.conflicts[0]!.message).toContain("We used High");
    // elasticity, availability and deployability were raised too, but the user never set them.
    expect(r.effectiveLevels.elasticity).toBe("medium");
  });

  it("applies floors from rules and names the rule in the conflict", () => {
    const r = score(
      makeInput({
        attributes: { consistency: "low", maintainability: "high" },
        characteristics: { "strict-acid": true },
      }),
      kb,
    );
    expect(r.effectiveLevels.consistency).toBe("critical");
    expect(r.conflicts[0]!.from).toEqual([
      { kind: "rule", ruleId: "R11", label: "Strict ACID transactions", level: "critical" },
    ]);
  });
});

describe("base score", () => {
  it("normalises an all-1 style to 0 and an all-5 style to 100", () => {
    const t = tinyKb();
    t.styles[0]!.scores = {
      simplicity: { ...t.styles[0]!.scores.simplicity!, value: 1 },
      cost: { ...t.styles[0]!.scores.cost!, value: 1 },
    };
    t.styles[0]!.costLevel = 5;
    t.styles[1]!.scores = {
      simplicity: { ...t.styles[1]!.scores.simplicity!, value: 5 },
      cost: { ...t.styles[1]!.scores.cost!, value: 5 },
    };
    const r = score(tinyInput, t);
    expect(r.ranked.map((s) => [s.styleId, s.base])).toEqual([
      [t.styles[1]!.id, 100],
      [t.styles[0]!.id, 0],
    ]);
  });

  it("is a weighted average: (3·5 + 1·5) / 4 for layered on the tiny KB", () => {
    const t = tinyKb();
    const r = score(tinyInput, t);
    expect(byId(r, "layered")!.base).toBe(100);
    // modular monolith: simplicity 5, cost 5 → also 100; ties break on simplicity then id.
    expect(r.ranked.map((s) => s.styleId)).toEqual(["layered", "modular-monolith"]);
  });

  it("contributions add up to the weighted average", () => {
    const r = score(base, kb);
    for (const s of r.ranked) {
      const avg = Object.values(s.contributions).reduce((a, b) => a + b, 0);
      expect((avg - 1) * 25).toBeCloseTo(s.base, 3);
    }
  });
});

describe("rules", () => {
  it("applies when-branch effects only when the condition holds", () => {
    const off = score(base, kb);
    const on = score(
      makeInput({ attributes: { maintainability: "high" }, characteristics: { "async-events": true } }),
      kb,
    );
    expect(byId(off, "event-driven")!.ruleEffects).not.toContainEqual({ ruleId: "R4", points: 15 });
    expect(byId(on, "event-driven")!.ruleEffects).toContainEqual({ ruleId: "R4", points: 15 });
    expect(byId(on, "serverless")!.ruleEffects).toContainEqual({ ruleId: "R4", points: 5 });
  });

  it("applies the otherwise branch when the condition is false", () => {
    const r = score(base, kb);
    expect(byId(r, "pipeline")!.ruleEffects).toContainEqual({ ruleId: "R7", points: -15 });
    const on = score(
      makeInput({ attributes: { maintainability: "high" }, characteristics: { "sequential-processing": true } }),
      kb,
    );
    expect(byId(on, "pipeline")!.ruleEffects).toContainEqual({ ruleId: "R7", points: 20 });
  });

  it("excludes styles with a reason and never ranks them", () => {
    const r = score(
      makeInput({ attributes: { maintainability: "high" }, characteristics: { hosting: "on-prem" } }),
      kb,
    );
    expect(byId(r, "serverless")).toBeUndefined();
    expect(r.excluded).toEqual([
      { styleId: "serverless", ruleIds: ["R9"], reasons: [kb.rules.find((x) => x.id === "R9")!.explanation] },
    ]);
    expect(r.ranked).toHaveLength(kb.styles.length - 1);
  });

  it("excludes serverless for VM-only hosting too", () => {
    const r = score(makeInput({ attributes: { maintainability: "high" }, characteristics: { hosting: "vms" } }), kb);
    expect(r.excluded.map((e) => e.styleId)).toEqual(["serverless"]);
  });

  it("caps the rule total at ±30 per style", () => {
    const r = score(
      makeInput({
        attributes: { maintainability: "high" },
        drivers: { experience: "beginner", "team-size": "1-3" },
        characteristics: { hosting: "on-prem", "strict-acid": true },
      }),
      kb,
    );
    const cell = byId(r, "cell-based")!;
    // R1 −15, R1b −5, R9 −20, R11 −5, R14 otherwise −10 = −55
    expect(cell.modifierUncapped).toBe(-55);
    expect(cell.modifier).toBe(-30);
  });

  it("caps positive totals too", () => {
    const t = structuredClone(kb);
    t.rules.push({
      id: "R99",
      name: "Test bonus",
      explanation: "Test-only rule that adds a lot of points.",
      when: { eq: ["char.plugins", true] },
      effects: [{ type: "modify", style: "microkernel", points: 20 }],
      source: { kind: "design", note: "test", reviewed: true },
    });
    const r = score(makeInput({ attributes: { maintainability: "high" }, characteristics: { plugins: true } }), t);
    expect(byId(r, "microkernel")!.modifierUncapped).toBe(45);
    expect(byId(r, "microkernel")!.modifier).toBe(30);
  });

  it("clamps the final score into 0–100", () => {
    const r = score(base, kb);
    for (const s of r.ranked) {
      expect(s.final).toBeGreaterThanOrEqual(0);
      expect(s.final).toBeLessThanOrEqual(100);
    }
    const t = structuredClone(kb);
    t.rules.push({
      id: "R99",
      name: "Test penalty",
      explanation: "Test-only rule that removes a lot of points.",
      when: { eq: ["char.plugins", false] },
      effects: [{ type: "modify", style: "soa", points: -30 }],
      source: { kind: "design", note: "test", reviewed: true },
    });
    const soa = byId(score(makeInput({ attributes: { simplicity: "critical", cost: "critical" } }), t), "soa")!;
    expect(soa.base + soa.modifier).toBeLessThan(0);
    expect(soa.final).toBe(0);
  });

  it("turns note effects into notes, and warning notes into warnings", () => {
    const r = score(makeInput({ attributes: { maintainability: "high" }, drivers: { "qa-scope": "different" } }), kb);
    expect(r.notes.map((n) => n.ruleId)).toEqual(["N1"]);
    expect(r.warnings.map((w) => w.ruleId)).toEqual(["N3"]);
    expect(r.notes.map((n) => n.ruleId)).not.toContain("N3");
  });

  it("does not warn about missing info once budget, team or experience is known", () => {
    const r = score(makeInput({ attributes: { maintainability: "high" }, drivers: { budget: "moderate" } }), kb);
    expect(r.warnings).toEqual([]);
  });
});

describe("conditions", () => {
  const input = makeInput({ drivers: { growth: "rapid" }, characteristics: { plugins: true } });
  const chars = { plugins: true, hosting: "unsure" };
  it.each([
    [{ eq: ["driver.growth", "rapid"] }, true],
    [{ eq: ["driver.growth", "stable"] }, false],
    [{ in: ["driver.growth", ["stable", "rapid"]] }, true],
    [{ all: [{ eq: ["char.plugins", true] }, { eq: ["driver.growth", "rapid"] }] }, true],
    [{ all: [{ eq: ["char.plugins", true] }, { eq: ["driver.growth", "stable"] }] }, false],
    [{ any: [{ eq: ["char.plugins", false] }, { eq: ["driver.growth", "rapid"] }] }, true],
    [{ any: [{ eq: ["char.plugins", false] }, { eq: ["char.hosting", "vms"] }] }, false],
    [{ not: { eq: ["char.plugins", true] } }, false],
    [{ eq: ["char.edge", true] }, false],
  ] as const)("%j → %s", (cond, expected) => {
    expect(evaluateCondition(cond as never, input.drivers, chars)).toBe(expected);
  });
});

describe("ordering", () => {
  const s = (styleId: string, final: number, base: number) => ({ styleId, final, base });
  const simplicity = (id: string) => ({ a: 3, b: 5, c: 5 })[id] ?? 0;
  it("sorts by final, then base, then simplicity, then id", () => {
    const sorted = [s("c", 50, 40), s("a", 60, 10), s("b", 50, 40), s("d", 50, 45)].sort((x, y) =>
      compareStyles(x, y, simplicity),
    );
    expect(sorted.map((x) => x.styleId)).toEqual(["a", "d", "b", "c"]);
  });

  it("assigns fit labels at 75 / 60 / 45", () => {
    expect([75, 74.9, 60, 59.9, 45, 44.9].map(fitFor)).toEqual([
      "strong",
      "good",
      "good",
      "possible",
      "possible",
      "weak",
    ]);
  });
});

describe("result shape", () => {
  it("reports versions and the top attributes, highest first", () => {
    const r = score(
      makeInput({ attributes: { cost: "critical", security: "high", maintainability: "high", testability: "medium" } }),
      kb,
    );
    expect(r.kbVersion).toBe(kb.meta.kbVersion);
    expect(r.engineVersion).toBe(ENGINE_VERSION);
    expect(r.topAttributes).toEqual(["cost", "security", "maintainability"]);
  });

  it("warns when more than 3 attributes are Critical", () => {
    const r = score(
      makeInput({
        attributes: { cost: "critical", security: "critical", performance: "critical", availability: "critical" },
        drivers: { budget: "moderate" },
      }),
      kb,
    );
    expect(r.warnings.map((w) => w.code)).toEqual(["too-many-critical"]);
  });

  it("never reads the notes", () => {
    expect(score({ ...base, notes: "use microservices!" }, kb)).toEqual(score(base, kb));
  });
});

describe("validation", () => {
  it("accepts a minimal valid input", () => {
    expect(checkInput(base, kb)).toEqual({ ok: true, issues: [] });
  });

  it("requires at least one High or Critical attribute", () => {
    const res = checkInput(makeInput({ attributes: { cost: "medium" } }), kb);
    expect(res.ok).toBe(false);
    expect(res.issues.map((i) => i.code)).toContain("no-priority");
  });

  it("rejects unknown attribute, driver, option and characteristic ids", () => {
    const res = checkInput(
      {
        ...base,
        attributes: { ...base.attributes, speed: "high" } as never,
        drivers: { ...base.drivers, mood: "happy", growth: "explosive" },
        characteristics: { teleport: true, hosting: "mars", plugins: "yes" },
      },
      kb,
    );
    expect(res.ok).toBe(false);
    expect(res.issues.map((i) => i.path).sort()).toEqual(
      [
        "attributes.speed",
        "characteristics.hosting",
        "characteristics.plugins",
        "characteristics.teleport",
        "drivers.growth",
        "drivers.mood",
      ].sort(),
    );
  });

  it("requires every driver to be answered", () => {
    const drivers = { ...base.drivers };
    delete drivers.budget;
    const res = checkInput({ ...base, drivers }, kb);
    expect(res.issues).toContainEqual(expect.objectContaining({ path: "drivers.budget", code: "missing" }));
  });

  it("rejects notes over 1,000 characters and malformed input", () => {
    expect(checkInput({ ...base, notes: "x".repeat(1001) }, kb).issues[0]!.code).toBe("too-long");
    expect(checkInput(null, kb).ok).toBe(false);
    expect(checkInput({ ...base, attributes: { maintainability: "huge" } }, kb).ok).toBe(false);
  });

  it("score() throws InvalidInputError on invalid input", () => {
    expect(() => score(makeInput({ attributes: {} }), kb)).toThrow(InvalidInputError);
  });
});
