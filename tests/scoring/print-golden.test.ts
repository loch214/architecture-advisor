import { it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { score } from "@/modules/scoring";
import { goldenScenarios } from "./golden";
it.skipIf(!process.env.PRINT_GOLDEN)("print", () => {
  for (const g of goldenScenarios) {
    const r = score(g.input, kb);
    console.log(
      g.id,
      r.ranked
        .slice(0, 5)
        .map((s) => `${s.styleId} ${s.base.toFixed(1)}${s.modifier >= 0 ? "+" : ""}${s.modifier}=${s.final.toFixed(1)}`)
        .join(" | "),
      r.excluded.map((e) => "x:" + e.styleId).join(","),
    );
  }
});
