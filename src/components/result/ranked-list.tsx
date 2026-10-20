"use client";

import { ChevronRightIcon } from "lucide-react";
import { kb } from "@/modules/knowledge-base";
import type { AdvisorResult } from "@/modules/recommendation";
import { fitFor } from "@/modules/scoring";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FIT_LABELS, fmt, signed, signedInt } from "./format";

const SHOWN_BY_DEFAULT = 5;

function WhyThisScore({ result, styleId }: { result: AdvisorResult; styleId: string }) {
  const style = result.rules.ranked.find((s) => s.styleId === styleId)!;
  const weights = result.rules.effectiveWeights;
  const parts = kb.attributes
    .filter((a) => (weights[a.id] ?? 0) > 0)
    .map((a) => ({
      id: a.id,
      name: a.name,
      value: style.contributions[a.id] ?? 0,
      score: result.snapshot.styles[styleId]!.scores[a.id],
    }))
    .sort((a, b) => b.value - a.value);
  const total = parts.reduce((s, p) => s + p.value, 0);
  const firedById = new Map(result.rules.firedRules.map((r) => [r.ruleId, r]));
  return (
    <div className="space-y-4 rounded-lg bg-muted/50 p-4 text-sm">
      <p>
        <strong>Base score {fmt(style.base)}</strong> is the weighted average of this style&apos;s 1–5 ratings, using
        your priorities as weights, rescaled to 0–100. Each bar below is one attribute&apos;s share of that average.
      </p>
      <ul className="space-y-1.5">
        {parts.map((p) => (
          <li key={p.id} className="grid grid-cols-[9rem_1fr_3.5rem] items-center gap-2">
            <span className="truncate">{p.name}</span>
            <span className="h-2 rounded-full bg-primary/10" aria-hidden>
              <span className="block h-2 rounded-full bg-primary/70" style={{ width: `${(p.value / total) * 100}%` }} />
            </span>
            <span className="text-right tabular-nums text-muted-foreground">{p.score}/5</span>
          </li>
        ))}
      </ul>
      {style.ruleEffects.length > 0 ? (
        <div className="space-y-1">
          <p>
            <strong>Rules: {signedInt(style.modifier)} points</strong>
            {style.modifier !== style.modifierUncapped &&
              ` (${signedInt(style.modifierUncapped)} before the ±${kb.meta.modifierCapPerStyle} cap)`}
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {style.ruleEffects.map((e) => (
              <li key={e.ruleId}>
                {signedInt(e.points)}: {firedById.get(e.ruleId)?.explanation}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No rules changed this score.</p>
      )}
    </div>
  );
}

export function RankedList({ result }: { result: AdvisorResult }) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? result.final : result.final.slice(0, SHOWN_BY_DEFAULT);
  return (
    <div className="space-y-2">
      <ol className="space-y-2">
        {rows.map((f) => {
          const name = result.snapshot.styles[f.styleId]!.name;
          return (
            <li key={f.styleId} className="rounded-lg border">
              <Collapsible>
                <div className="grid grid-cols-[2rem_1fr] gap-x-2 gap-y-1 p-3 sm:grid-cols-[2rem_14rem_1fr_auto] sm:items-center">
                  <span className="text-lg font-semibold tabular-nums text-muted-foreground">{f.rank}</span>
                  <span className="font-medium">{name}</span>
                  <span
                    className="relative col-start-2 h-2.5 rounded-full bg-muted sm:col-start-auto"
                    role="img"
                    aria-label={`Final score ${fmt(f.finalScore)} out of 100${f.aiDelta !== 0 ? `, rule score ${fmt(f.ruleScore)}` : ""}`}
                  >
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
                      style={{ width: `${f.finalScore}%` }}
                    />
                    {f.aiDelta !== 0 && (
                      <span
                        className="absolute inset-y-[-3px] w-0.5 bg-foreground"
                        style={{ left: `${f.ruleScore}%` }}
                      />
                    )}
                  </span>
                  <span className="col-start-2 flex items-center gap-2 sm:col-start-auto">
                    <span className="font-semibold tabular-nums">{fmt(f.finalScore)}</span>
                    {f.aiDelta !== 0 && <Badge variant="info">AI {signed(f.aiDelta)}</Badge>}
                    <Badge variant="outline">{FIT_LABELS[fitFor(f.finalScore)]}</Badge>
                  </span>
                </div>
                <CollapsibleTrigger className="group flex w-full items-center gap-1 border-t px-3 py-2 text-left text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50">
                  <ChevronRightIcon
                    className="size-4 transition-transform group-data-[state=open]:rotate-90"
                    aria-hidden
                  />
                  Why this score?<span className="sr-only"> ({name})</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-3">
                  <WhyThisScore result={result} styleId={f.styleId} />
                </CollapsibleContent>
              </Collapsible>
            </li>
          );
        })}
      </ol>
      {result.final.length > SHOWN_BY_DEFAULT && (
        <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show top 5 only" : `Show all ${result.final.length} styles`}
        </Button>
      )}
    </div>
  );
}
