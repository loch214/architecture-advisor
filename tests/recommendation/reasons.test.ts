import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { buildResult, plainReasons } from "@/modules/recommendation";
import { goldenScenarios } from "../scoring/golden";
import { exampleA } from "../scoring/fixtures";

const ctx = { id: "r1", createdAt: "2026-10-21T00:00:00.000Z", appVersion: "test" };
const result = (id: string) =>
  buildResult(goldenScenarios.find((g) => g.id === id)!.input, kb, ctx, { status: "skipped", adjustments: [] });

describe("plainReasons", () => {
  it("explains the IDE pick with the plug-in rule and lists what being an installed app ruled out", () => {
    const r = plainReasons(result("G17"), kb);
    expect(r.top[0]).toMatch(/plug-ins/);
    expect(r.ruledOut).toHaveLength(1);
    expect(r.ruledOut[0]!.styleIds).toEqual(expect.arrayContaining(["microservices", "service-based"]));
    expect(r.ruledOut[0]!.why).toMatch(/only on each user.s own computer or phone/);
  });

  it("names the runner-up's biggest penalty", () => {
    const r = plainReasons(result("G19"), kb);
    expect(r.runnerUp?.why).toMatch(/one deployable unit/);
  });

  it("falls back to a balance-of-ratings reason and shows weak priorities as the trade-off", () => {
    const r = plainReasons(buildResult(exampleA, kb, ctx, { status: "skipped", adjustments: [] }), kb);
    expect(r.top.length).toBeGreaterThan(0);
    expect(r.tradeOff).toMatch(/Maintainability/);
  });

  it("is pure", () => {
    const res = result("G3");
    expect(plainReasons(res, kb)).toEqual(plainReasons(res, kb));
  });
});
