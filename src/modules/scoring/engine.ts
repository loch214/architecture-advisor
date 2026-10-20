import type { KnowledgeBase, Rule, Effect } from "@/modules/knowledge-base/schema";
import { evaluateCondition } from "./conditions";
import { assertValidInput, normaliseCharacteristics } from "./validate";
import { resolveWeights } from "./weights";
import type { FiredRule, Fit, RuleResult, StyleResult, UserInput, Warning } from "./types";

export const ENGINE_VERSION = "1.0.0";

/** Rounds away floating-point noise so equal sums compare equal in the tie-break. Display rounding is the UI's job. */
const tidy = (n: number) => Math.round(n * 1e6) / 1e6;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function fitFor(final: number): Fit {
  if (final >= 75) return "strong";
  if (final >= 60) return "good";
  if (final >= 45) return "possible";
  return "weak";
}

type Sortable = { styleId: string; final: number; base: number };

/** final desc → base desc → simplicity desc (prefer the simpler option) → id asc. */
export function compareStyles(a: Sortable, b: Sortable, simplicity: (id: string) => number): number {
  return (
    b.final - a.final ||
    b.base - a.base ||
    simplicity(b.styleId) - simplicity(a.styleId) ||
    (a.styleId < b.styleId ? -1 : a.styleId > b.styleId ? 1 : 0)
  );
}

/**
 * The pure scoring engine (SCORING_ENGINE.md): no network, clock, randomness or global state.
 * Same input + same KB ⇒ deep-equal output, in the browser and on the server.
 */
export function score(input: UserInput, kb: KnowledgeBase): RuleResult {
  assertValidInput(input, kb);
  const chars = normaliseCharacteristics(input, kb);

  // Evaluate every rule once; conditions only read drivers and characteristics.
  const evaluated = kb.rules.map((rule) => {
    const holds = evaluateCondition(rule.when, input.drivers, chars);
    const effects: Effect[] = holds ? rule.effects : (rule.otherwise ?? []);
    return { rule, branch: holds ? ("when" as const) : ("otherwise" as const), effects };
  });
  const fired = evaluated.filter((e) => e.effects.length > 0);

  // Step 2: weights (rule floors first, then modifiers).
  const firingRules: Rule[] = fired.filter((f) => f.branch === "when").map((f) => f.rule);
  const { levels, weights, floors, conflicts } = resolveWeights(input, kb, firingRules);
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  // Step 4: exclusions and point modifiers.
  const excludedBy = new Map<string, Rule[]>();
  const points = new Map<string, { ruleId: string; points: number }[]>();
  const notes: RuleResult["notes"] = [];
  const warnings: Warning[] = [];
  for (const { rule, effects } of fired) {
    for (const e of effects) {
      if (e.type === "exclude") excludedBy.set(e.style, [...(excludedBy.get(e.style) ?? []), rule]);
      else if (e.type === "modify")
        points.set(e.style, [...(points.get(e.style) ?? []), { ruleId: rule.id, points: e.points }]);
      else if (e.type === "note") {
        if (e.warning) warnings.push({ code: "rule-warning", message: e.message, ruleId: rule.id });
        else notes.push({ ruleId: rule.id, message: e.message });
      }
    }
  }

  const cap = kb.meta.modifierCapPerStyle;
  const unsorted = kb.styles
    .filter((s) => !excludedBy.has(s.id))
    .map((s) => {
      // Step 3: weighted average of KB scores (1–5), normalised to 0–100.
      const contributions: Record<string, number> = {};
      let sum = 0;
      for (const a of kb.attributes) {
        const part = weights[a.id]! * s.scores[a.id]!.value;
        sum += part;
        contributions[a.id] = tidy(part / totalWeight);
      }
      const base = tidy(((sum / totalWeight - 1) / 4) * 100);
      const ruleEffects = points.get(s.id) ?? [];
      const modifierUncapped = ruleEffects.reduce((acc, e) => acc + e.points, 0);
      const modifier = clamp(modifierUncapped, -cap, cap);
      // Step 5: final score.
      const final = tidy(clamp(base + modifier, 0, 100));
      return {
        styleId: s.id,
        base,
        modifier,
        modifierUncapped,
        final,
        contributions,
        ruleEffects,
        firedRuleIds: [...new Set(ruleEffects.map((e) => e.ruleId))],
      };
    });

  const simplicity = (id: string) => kb.styles.find((s) => s.id === id)!.scores.simplicity?.value ?? 0;
  const ranked: StyleResult[] = unsorted
    .sort((a, b) => compareStyles(a, b, simplicity))
    .map((s, i) => ({ ...s, rank: i + 1, fit: fitFor(s.final) }));

  const criticalCount = Object.values(input.attributes).filter((l) => l === "critical").length;
  if (criticalCount > kb.meta.maxCriticalSoftLimit) {
    warnings.unshift({
      code: "too-many-critical",
      message: `You marked ${criticalCount} attributes as Critical. Real architectures can't maximise everything; try keeping it to ${kb.meta.maxCriticalSoftLimit}.`,
    });
  }

  const firedRules: FiredRule[] = fired.map(({ rule, branch, effects }) => ({
    ruleId: rule.id,
    name: rule.name,
    branch,
    explanation: branch === "when" ? rule.explanation : rule.otherwiseExplanation!,
    effects,
  }));

  const attributeOrder = kb.attributes.map((a) => a.id);
  const topAttributes = attributeOrder
    .filter((a) => weights[a]! >= kb.meta.levels.high)
    .sort((a, b) => weights[b]! - weights[a]! || attributeOrder.indexOf(a) - attributeOrder.indexOf(b));

  return {
    kbVersion: kb.meta.kbVersion,
    engineVersion: ENGINE_VERSION,
    effectiveLevels: levels,
    effectiveWeights: weights,
    floors,
    ranked,
    excluded: [...excludedBy.entries()].map(([styleId, rules]) => ({
      styleId,
      ruleIds: rules.map((r) => r.id),
      reasons: rules.map((r) => r.explanation),
    })),
    firedRules,
    notes,
    conflicts,
    warnings,
    topAttributes,
  };
}
