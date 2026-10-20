import { describe, expect, it } from "vitest";
import { kb, rawKnowledgeBase, findIntegrityProblems, listSources, isUnreviewed } from "@/modules/knowledge-base";
import { assertValidKnowledgeBase } from "@/modules/knowledge-base/check";
import { KnowledgeBaseSchema, AttributeSchema, StyleSchema, RuleSchema } from "@/modules/knowledge-base/schema";

describe("knowledge base files", () => {
  it("every file passes its Zod schema", () => {
    const result = KnowledgeBaseSchema.safeParse(rawKnowledgeBase);
    expect(result.success ? [] : result.error.issues).toEqual([]);
  });

  it("passes the build-time check used by next.config.ts", () => {
    expect(() => assertValidKnowledgeBase()).not.toThrow();
  });

  it("has no cross-reference or derived-value problems", () => {
    expect(findIntegrityProblems(kb)).toEqual([]);
  });

  it("has the 13 scored attributes and 13 ranked styles from the KB draft", () => {
    expect(kb.attributes).toHaveLength(13);
    expect(kb.styles.map((s) => s.id)).toEqual([
      "layered",
      "modular-monolith",
      "microkernel",
      "pipeline",
      "service-based",
      "event-driven",
      "space-based",
      "microservices",
      "soa",
      "serverless",
      "cell-based",
      "peer-to-peer",
      "edge",
    ]);
  });

  it("every style has an integer 1–5 score for every attribute", () => {
    for (const style of kb.styles) {
      for (const a of kb.attributes) {
        const value = style.scores[a.id]?.value;
        expect(Number.isInteger(value), `${style.id}.${a.id}`).toBe(true);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(5);
      }
    }
  });

  it("cost score equals 6 − costLevel", () => {
    for (const style of kb.styles) expect(style.scores.cost!.value, style.id).toBe(6 - style.costLevel);
  });

  it("every rule has a user-facing explanation and a source", () => {
    for (const rule of kb.rules) {
      expect(rule.explanation.length, rule.id).toBeGreaterThan(10);
      expect(rule.source, rule.id).toBeDefined();
    }
  });

  it("every driver has a Not sure option", () => {
    for (const d of kb.drivers) expect(d.options[0]!.id, d.id).toBe("unsure");
  });

  it("aliases are lower-case so matching stays deterministic", () => {
    const aliases = [...kb.styles, ...kb.patterns, ...kb.glossary].flatMap((x) => x.aliases);
    for (const a of aliases) expect(a, a).toBe(a.toLowerCase());
  });

  it("no source cites course material (only published books and articles)", () => {
    const text = JSON.stringify(rawKnowledgeBase).toLowerCase();
    expect(text).not.toMatch(/lecture|\bl\d{2}\b|slides? \d/);
  });
});

describe("schema rejects bad data", () => {
  it("rejects a score outside 1–5", () => {
    const style = structuredClone(rawKnowledgeBase.styles[0]!);
    style.scores.simplicity.value = 6;
    expect(StyleSchema.safeParse(style).success).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(AttributeSchema.safeParse({ ...rawKnowledgeBase.attributes[0], extra: 1 }).success).toBe(false);
  });

  it("rejects a rule with otherwise but no otherwiseExplanation", () => {
    const rule = structuredClone(rawKnowledgeBase.rules.find((r) => r.id === "R7")!) as Record<string, unknown>;
    delete rule.otherwiseExplanation;
    expect(RuleSchema.safeParse(rule).success).toBe(false);
  });

  it("integrity check catches drift and dangling ids", () => {
    const broken = structuredClone(kb);
    broken.styles[0]!.costLevel = 3;
    broken.styles[1]!.patterns.push("no-such-pattern");
    delete (broken.styles[2]!.scores as Record<string, unknown>).security;
    broken.rules[0]!.effects.push({ type: "modify", style: "no-such-style", points: 1 });
    broken.rules[1]!.when = { eq: ["driver.experience", "wizard"] };
    const problems = findIntegrityProblems(broken);
    expect(problems).toEqual(
      expect.arrayContaining([
        expect.stringContaining("cost score"),
        expect.stringContaining('unknown pattern "no-such-pattern"'),
        expect.stringContaining('missing score for "security"'),
        expect.stringContaining('unknown style "no-such-style"'),
        expect.stringContaining('"wizard" is not a valid value'),
      ]),
    );
  });
});

describe("score matrix", () => {
  it("matches the snapshot (any KB score change shows up as a visible diff)", () => {
    const matrix = Object.fromEntries(
      kb.styles.map((s) => [s.id, kb.attributes.map((a) => `${a.id}=${s.scores[a.id]!.value}`).join(" ")]),
    );
    expect(matrix).toMatchSnapshot();
  });
});

describe("release gate", () => {
  const releaseMode = process.env.KB_RELEASE_GATE === "1" || process.env.NODE_ENV === "production";
  const unreviewed = listSources(kb).filter((s) => isUnreviewed(s.source));

  it.runIf(releaseMode)("no unreviewed general-knowledge or design source ships to production", () => {
    expect(unreviewed.map((u) => u.where)).toEqual([]);
  });

  it.skipIf(releaseMode)("in development, unreviewed sources are only reported", () => {
    expect(Array.isArray(unreviewed)).toBe(true);
  });

  it("detects an unreviewed source", () => {
    expect(isUnreviewed({ kind: "general", reviewed: false })).toBe(true);
    expect(isUnreviewed({ kind: "design", note: "x", reviewed: true })).toBe(false);
    expect(isUnreviewed({ kind: "book", ref: "RF2" })).toBe(false);
  });
});
