"use client";

import { ChevronRightIcon, DownloadIcon, PencilIcon, PrinterIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { kb } from "@/modules/knowledge-base";
import type { AdvisorResult } from "@/modules/recommendation";
import { fitFor } from "@/modules/scoring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AiPanel } from "./ai-panel";
import { FIT_LABELS, fmt, signed } from "./format";
import { RankedList } from "./ranked-list";
import { Adjustments, Excluded, Heads, HowCalculated, Mentions, Patterns } from "./result-details";
import { Section } from "./section";
import { TradeoffTable } from "./tradeoff-table";

function downloadJson(result: AdvisorResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `architecture-advice-${result.createdAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResultView({
  result,
  aiPending,
  onEdit,
  onStartOver,
  onRetryAi,
}: {
  result: AdvisorResult;
  aiPending: boolean;
  onEdit: () => void;
  onStartOver: () => void;
  onRetryAi: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  const top = result.final[0]!;
  const topStyle = kb.styles.find((s) => s.id === top.styleId);
  const name = result.snapshot.styles[top.styleId]!.name;

  return (
    <article aria-labelledby="result-heading" className="space-y-10">
      <header className="space-y-4">
        <p className="text-sm text-muted-foreground">Top recommendation</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1
            id="result-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-3xl font-semibold tracking-tight outline-none"
          >
            {name}
          </h1>
          <Badge variant="secondary" className="text-sm">
            {FIT_LABELS[fitFor(top.finalScore)]} · {fmt(top.finalScore)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Rule score {fmt(top.ruleScore)} · AI adjustment {signed(top.aiDelta)} · Final {fmt(top.finalScore)}
        </p>
        {topStyle && <p className="max-w-prose">{topStyle.summary}</p>}
        <div className="no-print flex flex-wrap gap-2">
          <Button variant="outline" onClick={onEdit}>
            <PencilIcon aria-hidden /> Edit answers
          </Button>
          <Button variant="outline" onClick={() => downloadJson(result)}>
            <DownloadIcon aria-hidden /> Download JSON
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <PrinterIcon aria-hidden /> Print
          </Button>
          <Button variant="ghost" onClick={onStartOver}>
            <RotateCcwIcon aria-hidden /> Start over
          </Button>
        </div>
      </header>

      <Heads result={result} />

      <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
        <Section id="ranked-heading" title="Ranked styles" description="Bars show the final score out of 100.">
          <RankedList result={result} />
        </Section>
        <Section id="ai-heading" title="AI explanation">
          <AiPanel ai={result.ai} pending={aiPending} onRetry={onRetryAi} />
        </Section>
      </div>

      <Section
        id="tradeoff-heading"
        title="Trade-off comparison"
        description="Straight from our knowledge base: how the leading styles compare on what you said matters."
      >
        <TradeoffTable result={result} />
      </Section>

      <Adjustments result={result} />
      <Excluded result={result} />
      <Patterns result={result} />
      <Mentions result={result} />

      <Collapsible>
        <CollapsibleTrigger className="group flex items-center gap-1 text-lg font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <ChevronRightIcon className="size-5 transition-transform group-data-[state=open]:rotate-90" aria-hidden />
          How this was calculated
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <HowCalculated result={result} />
        </CollapsibleContent>
      </Collapsible>
    </article>
  );
}
