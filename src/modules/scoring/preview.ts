import type { KnowledgeBase } from "@/modules/knowledge-base/schema";
import { evaluateCondition } from "./conditions";
import type { AppliedFloor, Conflict, UserInput } from "./types";
import { normaliseCharacteristics } from "./validate";
import { resolveWeights } from "./weights";

export type PartialInput = Pick<UserInput, "attributes" | "characteristics"> & {
  drivers: Partial<Record<string, string>>;
};

/**
 * Floors and conflicts for a form that may still be half filled in (UI_UX "implied by your answers" chips).
 * Unanswered drivers count as "Not sure"; no validation, so it works at every step.
 */
export function previewFloors(
  input: PartialInput,
  kb: KnowledgeBase,
): { floors: AppliedFloor[]; conflicts: Conflict[] } {
  const drivers = Object.fromEntries(kb.drivers.map((d) => [d.id, input.drivers[d.id] ?? "unsure"]));
  const full: UserInput = { attributes: input.attributes, drivers, characteristics: input.characteristics, notes: "" };
  const chars = normaliseCharacteristics(full, kb);
  const firing = kb.rules.filter((r) => evaluateCondition(r.when, drivers, chars));
  const { floors, conflicts } = resolveWeights(full, kb, firing);
  return { floors, conflicts };
}
