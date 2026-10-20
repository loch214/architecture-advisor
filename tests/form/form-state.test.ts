import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import {
  emptyForm,
  firstInvalidStep,
  fromInput,
  issuesFor,
  restoreForm,
  serialiseForm,
  toUserInput,
} from "@/components/form/form-state";
import { presets } from "@/components/form/presets";

describe("step validation (reuses the engine's checkInput)", () => {
  it("an empty form fails steps 1 and 2 only, with step-specific messages", () => {
    const f = emptyForm();
    expect(issuesFor(1, f, kb).length).toBe(kb.drivers.length);
    expect(issuesFor(1, f, kb).every((i) => i.path.startsWith("drivers."))).toBe(true);
    expect(issuesFor(2, f, kb).map((i) => i.code)).toEqual(["no-priority"]);
    expect(issuesFor(3, f, kb)).toEqual([]);
    expect(issuesFor(4, f, kb)).toEqual([]);
    expect(firstInvalidStep(f, kb)).toBe(1);
  });

  it("flags notes over 1,000 characters on step 4", () => {
    const f = { ...fromInput(presets[0]!.input), notes: "x".repeat(1001) };
    expect(issuesFor(4, f, kb).map((i) => i.code)).toEqual(["too-long"]);
    expect(firstInvalidStep(f, kb)).toBe(4);
  });

  it("a preset round-trips through the form unchanged", () => {
    for (const p of presets) {
      expect(toUserInput(fromInput(p.input))).toEqual(p.input);
      expect(firstInvalidStep(fromInput(p.input), kb)).toBeUndefined();
    }
  });
});

describe("saving answers (local storage)", () => {
  it("restores what was saved", () => {
    const saved = { form: { ...fromInput(presets[1]!.input), useAi: false }, step: 3 as const };
    expect(restoreForm(serialiseForm(saved, kb), kb)).toEqual(saved);
  });

  it("ignores missing, broken or old-format data", () => {
    expect(restoreForm(null, kb)).toBeUndefined();
    expect(restoreForm("{not json", kb)).toBeUndefined();
    expect(restoreForm(JSON.stringify({ v: 0, form: {} }), kb)).toBeUndefined();
  });

  it("drops ids and values the current KB doesn't know", () => {
    const raw = JSON.stringify({
      v: 1,
      step: 9,
      form: {
        attributes: { scalability: "high", removed: "high", cost: "extreme" },
        drivers: { budget: "moderate", "team-size": "1000" },
        characteristics: { plugins: true, hosting: "mars", gone: true },
        notes: 42,
      },
    });
    expect(restoreForm(raw, kb)).toEqual({
      form: {
        attributes: { scalability: "high" },
        drivers: { budget: "moderate" },
        characteristics: { plugins: true },
        notes: "",
        useAi: true,
      },
      step: 1,
    });
  });
});
