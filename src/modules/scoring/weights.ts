import { LEVEL_LABELS, LEVELS, type KnowledgeBase, type Level, type Rule } from "@/modules/knowledge-base/schema";
import type { AppliedFloor, Conflict, FloorSource, UserInput } from "./types";

const rank = (l: Level) => LEVELS.indexOf(l);
const higher = (a: Level, b: Level) => (rank(a) >= rank(b) ? a : b);

/**
 * Step 2 of the pipeline: effective level = max(user level, driver floors, rule floors).
 * Unset attributes count as "low". A conflict is recorded only when a floor beats a level the user actually chose.
 */
export function resolveWeights(input: UserInput, kb: KnowledgeBase, firingRules: Rule[]) {
  const floorSources = new Map<string, { level: Level; source: FloorSource }[]>();
  const addFloor = (attribute: string, level: Level, source: FloorSource) => {
    const list = floorSources.get(attribute) ?? [];
    list.push({ level, source });
    floorSources.set(attribute, list);
  };

  for (const d of kb.drivers) {
    const option = d.options.find((o) => o.id === input.drivers[d.id]);
    for (const [attribute, level] of Object.entries(option?.floors ?? {})) {
      addFloor(attribute, level, { kind: "driver", driverId: d.id, optionId: option!.id, label: option!.label });
    }
  }
  for (const rule of firingRules) {
    for (const e of rule.effects) {
      if (e.type === "floor") addFloor(e.attribute, e.level, { kind: "rule", ruleId: rule.id, label: rule.name });
    }
  }

  const levels: Record<string, Level> = {};
  const weights: Record<string, number> = {};
  const floors: AppliedFloor[] = [];
  const conflicts: Conflict[] = [];
  for (const a of kb.attributes) {
    const userLevel = input.attributes[a.id];
    const sources = floorSources.get(a.id) ?? [];
    const floor = sources.reduce<Level>((acc, s) => higher(acc, s.level), "none");
    const level = higher(userLevel ?? "low", floor);
    levels[a.id] = level;
    weights[a.id] = kb.meta.levels[level];
    if (sources.length > 0) floors.push({ attribute: a.id, level: floor, from: sources.map((s) => s.source) });
    if (userLevel !== undefined && rank(floor) > rank(userLevel)) {
      const from = sources.filter((s) => s.level === floor).map((s) => s.source);
      const because = from.map((s) => (s.kind === "driver" ? `"${s.label}"` : `the "${s.label}" rule`)).join(" and ");
      conflicts.push({
        attribute: a.id,
        userLevel,
        usedLevel: level,
        from,
        message: `You marked ${a.name} as ${LEVEL_LABELS[userLevel]}, but ${because} needs at least ${LEVEL_LABELS[floor]}. We used ${LEVEL_LABELS[level]}. Change that answer if it doesn't fit.`,
      });
    }
  }
  return { levels, weights, floors, conflicts };
}
