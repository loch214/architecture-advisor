"use client";

import {
  ArrowDownUpIcon,
  ChevronRightIcon,
  CompassIcon,
  DownloadIcon,
  LinkIcon,
  PencilIcon,
  PrinterIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { kb } from "@/modules/knowledge-base";
import { plainReasons, topPickChange, type AdvisorResult } from "@/modules/recommendation";
import { fitFor } from "@/modules/scoring";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { encodeShareHash } from "@/components/form/share-link";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AiPanel, aiAnnouncement } from "./ai-panel";
import { FIT_LABELS, fmt, signed, styleName } from "./format";
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

/** "Copy link" (FR-37): copies a URL that reopens this rule result; shows the link to copy by hand if the clipboard is blocked. */
function CopyLink({ result }: { result: AdvisorResult }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const url = () => `${window.location.origin}${window.location.pathname}${encodeShareHash(result.input)}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setState("copied");
    } catch {
      setState("failed");
    }
  };
  const hasNotes = result.input.notes.trim() !== "";
  return (
    <>
      <Button variant="outline" onClick={() => void copy()}>
        <LinkIcon aria-hidden /> {state === "copied" ? "Link copied" : "Copy link"}
      </Button>
      <p className="sr-only" aria-live="polite">
        {state === "copied" ? "Link copied." : ""}
      </p>
      {state !== "idle" && (
        <div className="order-last basis-full space-y-1 text-sm text-muted-foreground">
          {state === "failed" && (
            <label className="block space-y-1">
              <span>Your browser blocked copying. Copy this link instead:</span>
              <input
                readOnly
                value={url()}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded-md border bg-background px-2 py-1 font-mono text-xs text-foreground"
              />
            </label>
          )}
          <p>
            Anyone with the link sees this rule-based result; the AI explanation is fetched again.
            {hasNotes && " Your notes are not included in the link."}
          </p>
        </div>
      )}
    </>
  );
}

/** "Why this fits": the rule engine's reasons in plain words, shown with or without AI. */
function WhyItFits({ result }: { result: AdvisorResult }) {
  const r = plainReasons(result, kb);
  const name = styleName(result, result.final[0]!.styleId);
  return (
    <Section id="why-heading" title={`Why ${name} fits your project`}>
      <div className="space-y-3 rounded-lg border p-4 text-sm">
        <ul className="list-disc space-y-1.5 pl-5">
          {r.top.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {r.tradeOff && (
          <p>
            <span className="font-medium">Trade-off: </span>
            {r.tradeOff}
          </p>
        )}
        {r.runnerUp && (
          <p>
            <span className="font-medium">Why not {styleName(result, r.runnerUp.styleId)} (#2): </span>
            {r.runnerUp.why}
          </p>
        )}
        {r.ruledOut.map((g) => (
          <p key={g.styleIds.join()}>
            <span className="font-medium">Ruled out: {g.styleIds.map((id) => styleName(result, id)).join(", ")}. </span>
            {g.why}
          </p>
        ))}
      </div>
    </Section>
  );
}

export function ResultView({
  result,
  aiPending,
  example,
  onEdit,
  onStartOver,
  onRetryAi,
}: {
  result: AdvisorResult;
  aiPending: boolean;
  /** Set when this result is one of the home page's examples. */
  example?: string;
  onEdit: () => void;
  onStartOver: () => void;
  onRetryAi: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  const top = result.final[0]!;
  const topStyle = kb.styles.find((s) => s.id === top.styleId);
  const name = result.snapshot.styles[top.styleId]!.name;
  const change = aiPending ? undefined : topPickChange(result);

  return (
    <article aria-labelledby="result-heading" className="space-y-10">
      {example && (
        <Alert variant="info" className="no-print">
          <CompassIcon aria-hidden />
          <AlertTitle>Example: {example}</AlertTitle>
          <AlertDescription>
            <p>This result comes from ready-made answers. Change them to fit your project, or start from scratch.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" onClick={onStartOver}>
                Start my own
              </Button>
              <Button size="sm" variant="outline" onClick={onEdit}>
                Edit these answers
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
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
        {top.aiDelta !== 0 && (
          <p className="text-sm text-muted-foreground">
            Rule score {fmt(top.ruleScore)} · AI adjustment {signed(top.aiDelta)} · Final {fmt(top.finalScore)}
          </p>
        )}
        {topStyle && <p className="max-w-prose">{topStyle.summary}</p>}
        <div className="no-print flex flex-wrap gap-2">
          <Button variant="outline" onClick={onEdit}>
            <PencilIcon aria-hidden /> Edit answers
          </Button>
          <Button variant="outline" onClick={onStartOver}>
            <RotateCcwIcon aria-hidden /> Start over
          </Button>
          <CopyLink result={result} />
          <Button variant="outline" onClick={() => downloadJson(result)}>
            <DownloadIcon aria-hidden /> Download JSON
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <PrinterIcon aria-hidden /> Print
          </Button>
        </div>
      </header>

      <p className="sr-only" aria-live="polite">
        {aiPending ? "" : [aiAnnouncement(result.ai), change && "AI changed the order."].filter(Boolean).join(" ")}
      </p>

      {change && (
        <Alert variant="info">
          <ArrowDownUpIcon aria-hidden />
          <AlertTitle>AI changed the order</AlertTitle>
          <AlertDescription>
            Our rule engine ranked {styleName(result, change.ruleTop)} first. The AI&apos;s small adjustments (at most 5
            points per style) moved {styleName(result, change.finalTop)} to the top. Both scores are shown below, and
            the AI explanation says why.
          </AlertDescription>
        </Alert>
      )}

      <WhyItFits result={result} />
      <Heads result={result} />

      <Section
        id="ai-heading"
        title="In plain words (AI)"
        description="An optional AI explanation of the ranking. The ranking itself comes from the rules."
      >
        <AiPanel ai={result.ai} pending={aiPending} onRetry={onRetryAi} nameOf={(id) => styleName(result, id)} />
      </Section>

      <Section id="ranked-heading" title="All styles, ranked" description="Bars show the final score out of 100.">
        <RankedList result={result} />
      </Section>

      <Section
        id="tradeoff-heading"
        title="Trade-off comparison"
        description="Straight from our knowledge base: how the leading styles compare on what you said matters."
      >
        <TradeoffTable result={result} />
      </Section>

      <Patterns result={result} />
      <Mentions result={result} />

      <Collapsible>
        <CollapsibleTrigger className="group flex items-center gap-1 text-lg font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <ChevronRightIcon className="size-5 transition-transform group-data-[state=open]:rotate-90" aria-hidden />
          Full scoring details
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-10 pt-3">
          <Adjustments result={result} />
          <Excluded result={result} />
          <HowCalculated result={result} />
        </CollapsibleContent>
      </Collapsible>
    </article>
  );
}
