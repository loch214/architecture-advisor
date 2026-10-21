import type { KnowledgeBase } from "@/modules/knowledge-base/schema";
import type { StyleId } from "@/modules/scoring";
import type { AdvisorResult } from "./types";

/** The plain-language "why" behind a result, built only from the rule result (works with AI off). */
export interface PlainReasons {
  /** Why the top pick fits: rules that favoured it, then the priorities it rates well on. */
  top: string[];
  /** A priority the top pick is weak on, so the trade-off is visible up front. */
  tradeOff?: string;
  /** Styles removed by a rule, grouped by that rule. */
  ruledOut: { styleIds: StyleId[]; why: string }[];
  /** Why the runner-up came second. */
  runnerUp?: { styleId: StyleId; why: string };
}

const list = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

/** Pure: the same result always gives the same reasons. */
export function plainReasons(result: AdvisorResult, kb: KnowledgeBase): PlainReasons {
  const { rules, snapshot } = result;
  // A fired rule's explanation already matches the branch that fired.
  const explanationOf = new Map(rules.firedRules.map((r) => [r.ruleId, r.explanation]));
  const textOf = (ruleId: string) => explanationOf.get(ruleId);
  const nameOf = (attr: string) => kb.attributes.find((a) => a.id === attr)?.name ?? attr;
  const ranked = (id: StyleId) => rules.ranked.find((s) => s.styleId === id);

  const topId = result.final[0]!.styleId;
  const scores = snapshot.styles[topId]!.scores;
  const top: string[] = [];
  for (const e of ranked(topId)?.ruleEffects ?? []) {
    const text = e.points > 0 ? textOf(e.ruleId) : undefined;
    if (text) top.push(text);
  }
  const strong = rules.topAttributes.filter((a) => (scores[a] ?? 0) >= 4).map(nameOf);
  if (strong.length > 0) top.push(`It rates well on what you marked as most important: ${list(strong)}.`);
  if (top.length === 0) top.push("It has the best overall balance of ratings for the priorities you set.");

  const weak = rules.topAttributes.filter((a) => (scores[a] ?? 5) <= 2).map(nameOf);
  const tradeOff = weak.length > 0 ? `It is weaker on ${list(weak)}, which you also rated as important.` : undefined;

  const groups = new Map<string, StyleId[]>();
  for (const x of rules.excluded) {
    const key = x.ruleIds[0] ?? "";
    groups.set(key, [...(groups.get(key) ?? []), x.styleId]);
  }
  const ruledOut = [...groups].map(([ruleId, styleIds]) => ({ styleIds, why: textOf(ruleId) ?? "" }));

  const second = result.final[1];
  let runnerUp: PlainReasons["runnerUp"];
  if (second) {
    const penalties = (ranked(second.styleId)?.ruleEffects ?? [])
      .filter((e) => e.points < 0)
      .sort((a, b) => a.points - b.points)
      .map((e) => textOf(e.ruleId))
      .filter((t): t is string => !!t);
    runnerUp = {
      styleId: second.styleId,
      why:
        penalties[0] ??
        `Its ratings fit your priorities less well (${second.finalScore.toFixed(1)} vs ${result.final[0]!.finalScore.toFixed(1)}).`,
    };
  }
  return { top, tradeOff, ruledOut, runnerUp };
}
