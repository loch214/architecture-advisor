import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { checkInput, score } from "@/modules/scoring";
import { presets } from "@/components/form/presets";
import { goldenScenarios } from "../scoring/golden";

const golden = (id: string) => goldenScenarios.find((g) => g.id === id)!;
const mirrors: Record<string, string> = { student: "G1", startup: "G10", iot: "G4", ticketing: "G3", enterprise: "G6" };

describe("presets", () => {
  it.each(presets)("$title is a valid input", (p) => {
    expect(checkInput(p.input, kb)).toEqual({ ok: true, issues: [] });
  });

  it.each(Object.entries(mirrors))("%s uses golden scenario %s's input and gets its expected pick", (presetId, gId) => {
    const preset = presets.find((p) => p.id === presetId)!;
    expect(preset.input).toEqual(golden(gId).input);
    expect(golden(gId).expectedTop).toContain(score(preset.input, kb).ranked[0]!.styleId);
  });

  it("Growing SaaS recommends a domain-partitioned distributed style", () => {
    const top = score(presets.find((p) => p.id === "saas")!.input, kb).ranked[0]!.styleId;
    expect(["service-based", "microservices"]).toContain(top);
  });
});
