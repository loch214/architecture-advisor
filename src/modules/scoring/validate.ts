import { isLevel } from "@/modules/knowledge-base/levels";
import type { KnowledgeBase } from "@/modules/knowledge-base/schema";
import type { UserInput } from "./types";

export const MAX_NOTES_LENGTH = 1000;

export interface InputIssue {
  path: string;
  code: "invalid" | "unknown" | "missing" | "too-long" | "no-priority";
  message: string;
}

export class InvalidInputError extends Error {
  constructor(public readonly issues: InputIssue[]) {
    super(`Invalid input: ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`);
    this.name = "InvalidInputError";
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Checks an input against the KB's ids and the rules in SCORING_ENGINE "Input validation". */
export function checkInput(raw: unknown, kb: KnowledgeBase): { ok: boolean; issues: InputIssue[] } {
  const issues: InputIssue[] = [];
  const add = (path: string, code: InputIssue["code"], message: string) => issues.push({ path, code, message });

  if (!isRecord(raw)) {
    add("", "invalid", "Input must be an object.");
    return { ok: false, issues };
  }
  const { attributes, drivers, characteristics, notes } = raw;

  if (!isRecord(attributes)) add("attributes", "invalid", "Must be an object.");
  else {
    const known = new Set(kb.attributes.map((a) => a.id));
    for (const [id, level] of Object.entries(attributes)) {
      if (!known.has(id)) add(`attributes.${id}`, "unknown", "Unknown attribute.");
      else if (!isLevel(level)) add(`attributes.${id}`, "invalid", "Unknown importance level.");
    }
    if (!Object.values(attributes).some((l) => l === "high" || l === "critical")) {
      add(
        "attributes",
        "no-priority",
        "Mark at least one quality attribute as High or Critical so there's something to rank on.",
      );
    }
  }

  if (!isRecord(drivers)) add("drivers", "invalid", "Must be an object.");
  else {
    for (const d of kb.drivers) {
      const v = drivers[d.id];
      if (v === undefined) add(`drivers.${d.id}`, "missing", 'Please answer this question ("Not sure" is fine).');
      else if (!d.options.some((o) => o.id === v)) add(`drivers.${d.id}`, "invalid", "Unknown option.");
    }
    for (const id of Object.keys(drivers)) {
      if (!kb.drivers.some((d) => d.id === id)) add(`drivers.${id}`, "unknown", "Unknown question.");
    }
  }

  if (!isRecord(characteristics)) add("characteristics", "invalid", "Must be an object.");
  else {
    for (const [id, v] of Object.entries(characteristics)) {
      const c = kb.characteristics.find((x) => x.id === id);
      if (!c) add(`characteristics.${id}`, "unknown", "Unknown characteristic.");
      else if (c.type === "boolean" ? typeof v !== "boolean" : !c.options.some((o) => o.id === v)) {
        add(`characteristics.${id}`, "invalid", "Invalid value.");
      }
    }
  }

  if (typeof notes !== "string") add("notes", "invalid", "Must be text.");
  else if (notes.length > MAX_NOTES_LENGTH)
    add("notes", "too-long", `Keep notes under ${MAX_NOTES_LENGTH} characters.`);

  return { ok: issues.length === 0, issues };
}

export function assertValidInput(raw: unknown, kb: KnowledgeBase): asserts raw is UserInput {
  const { ok, issues } = checkInput(raw, kb);
  if (!ok) throw new InvalidInputError(issues);
}

/** Fills characteristic defaults (false / the KB default) so rules see every value. */
export function normaliseCharacteristics(input: UserInput, kb: KnowledgeBase): Record<string, string | boolean> {
  return Object.fromEntries(
    kb.characteristics.map((c) => [c.id, input.characteristics[c.id] ?? (c.type === "boolean" ? false : c.default)]),
  );
}
