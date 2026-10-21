import { isLevel, type Level } from "@/modules/knowledge-base/levels";
import type { KnowledgeBase } from "@/modules/knowledge-base/schema";
import { checkInput, type InputIssue, type UserInput } from "@/modules/scoring";

/**
 * Everything the form holds. `attributes` only has levels the user actually clicked (unset shows as "Low"),
 * which is what lets the engine say "you chose X, but…". Drivers start unanswered.
 */
export interface FormState {
  attributes: Partial<Record<string, Level>>;
  drivers: Partial<Record<string, string>>;
  characteristics: Record<string, boolean | string>;
  notes: string;
  /** "Don't use AI for this request" unticked. Kept outside UserInput: the engine never sees it. */
  useAi: boolean;
}

export const STEPS = [
  { id: 1, title: "Your project & team", short: "Project" },
  { id: 2, title: "What matters most", short: "Priorities" },
  { id: 3, title: "Your system's shape", short: "Shape" },
  { id: 4, title: "Anything else? + review", short: "Review" },
] as const;
export type StepId = (typeof STEPS)[number]["id"];

const STEP_PATHS: Record<StepId, string> = { 1: "drivers", 2: "attributes", 3: "characteristics", 4: "notes" };

export const emptyForm = (): FormState => ({
  attributes: {},
  drivers: {},
  characteristics: {},
  notes: "",
  useAi: true,
});

export const fromInput = (input: UserInput): FormState => ({
  attributes: { ...input.attributes },
  drivers: { ...input.drivers },
  characteristics: { ...input.characteristics },
  notes: input.notes,
  useAi: true,
});

/** The engine input. Only call once `issuesFor` is empty for every step. */
export const toUserInput = (s: FormState): UserInput => ({
  attributes: s.attributes,
  drivers: s.drivers as Record<string, string>,
  characteristics: s.characteristics,
  notes: s.notes,
});

/** The engine's own validator, split by step so each step shows only its messages. */
export function issuesFor(step: StepId, s: FormState, kb: KnowledgeBase): InputIssue[] {
  const prefix = STEP_PATHS[step];
  return checkInput(toUserInput(s), kb).issues.filter((i) => i.path === prefix || i.path.startsWith(`${prefix}.`));
}

export const firstInvalidStep = (s: FormState, kb: KnowledgeBase): StepId | undefined =>
  STEPS.find((step) => issuesFor(step.id, s, kb).length > 0)?.id;

const STORAGE_KEY = "architecture-advisor:form";
const STORAGE_VERSION = 1;

export interface SavedForm {
  form: FormState;
  step: StepId;
}

export function serialiseForm(saved: SavedForm, kb: KnowledgeBase): string {
  return JSON.stringify({ v: STORAGE_VERSION, kb: kb.meta.kbVersion, ...saved });
}

/**
 * Keeps only answers the current KB knows. Anything else (an id removed in a KB update, a hand-edited
 * value) is dropped rather than trusted, so a stale save or an old shared link can never crash the form.
 */
export function sanitiseForm(f: Partial<FormState>, kb: KnowledgeBase): FormState {
  return {
    attributes: Object.fromEntries(
      Object.entries(f.attributes ?? {}).filter(
        ([id, level]) => kb.attributes.some((a) => a.id === id) && isLevel(level),
      ),
    ) as FormState["attributes"],
    drivers: Object.fromEntries(
      Object.entries(f.drivers ?? {}).filter(([id, v]) =>
        kb.drivers.some((d) => d.id === id && d.options.some((o) => o.id === v)),
      ),
    ),
    characteristics: Object.fromEntries(
      Object.entries(f.characteristics ?? {}).filter(([id, v]) => {
        const c = kb.characteristics.find((x) => x.id === id);
        return c && (c.type === "boolean" ? typeof v === "boolean" : c.options.some((o) => o.id === v));
      }),
    ),
    notes: typeof f.notes === "string" ? f.notes : "",
    useAi: f.useAi !== false,
  };
}

/** Reads saved answers back, cleaned with `sanitiseForm`. */
export function restoreForm(raw: string | null, kb: KnowledgeBase): SavedForm | undefined {
  if (!raw) return undefined;
  try {
    const data = JSON.parse(raw) as { v?: number; form?: Partial<FormState>; step?: number };
    if (data.v !== STORAGE_VERSION || typeof data.form !== "object" || data.form === null) return undefined;
    const form = sanitiseForm(data.form, kb);
    const step = STEPS.some((s) => s.id === data.step) ? (data.step as StepId) : 1;
    return { form, step };
  } catch {
    return undefined;
  }
}

export const loadSavedForm = (kb: KnowledgeBase): SavedForm | undefined => {
  try {
    return restoreForm(window.localStorage.getItem(STORAGE_KEY), kb);
  } catch {
    return undefined;
  }
};

export const saveForm = (saved: SavedForm, kb: KnowledgeBase) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, serialiseForm(saved, kb));
  } catch {
    // Storage full or blocked (private mode): answers just won't survive a refresh.
  }
};

export const clearSavedForm = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
};
