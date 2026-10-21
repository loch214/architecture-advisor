"use client";

import { InfoIcon, RefreshCwIcon, SparklesIcon } from "lucide-react";
import type { AiBlock } from "@/modules/recommendation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const MESSAGES: Partial<Record<AiBlock["status"], { title: string; body: string; retry?: boolean }>> = {
  disabled: {
    title: "AI not enabled yet",
    body: "This version gives rule-based results only. The ranking, trade-offs and reasons on this page are complete and come from our rule engine.",
  },
  skipped: {
    title: "AI turned off for this request",
    body: "You chose not to use AI, so nothing was sent anywhere. The ranking on this page comes from our rule engine and is complete.",
  },
  unavailable: {
    title: "AI explanation isn't available right now",
    body: "The ranking on this page comes from our rule engine and is complete.",
    retry: true,
  },
  rate_limited: {
    title: "You've reached the AI limit for now",
    body: "Rule-based results still work. Try the AI explanation again later.",
  },
};

/** One short line for screen readers when the AI part settles (read out by the result page's live region). */
export function aiAnnouncement(ai: AiBlock): string {
  return MESSAGES[ai.status]?.title ?? (ai.explanation ? "AI explanation ready." : "");
}

const REUSE_NOTES = {
  identical: "Explanation reused from an identical request.",
  similar: "Explanation adapted from a similar request.",
};

/** The AI panel. Every non-ok state is neutral (never red): the rule result is always complete. */
export function AiPanel({
  ai,
  pending,
  onRetry,
  nameOf = (id) => id,
}: {
  ai: AiBlock;
  pending: boolean;
  onRetry: () => void;
  nameOf?: (styleId: string) => string;
}) {
  if (pending) {
    return (
      <div role="status" className="space-y-3 rounded-lg border p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <SparklesIcon className="size-4" aria-hidden /> Writing an explanation… (usually 3–10 s)
        </p>
        {[100, 92, 80].map((w) => (
          <div key={w} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
        ))}
      </div>
    );
  }
  const message = MESSAGES[ai.status];
  if (message) {
    return (
      <Alert variant="info">
        <InfoIcon aria-hidden />
        <AlertTitle>{message.title}</AlertTitle>
        <AlertDescription>
          <p>{message.body}</p>
          {message.retry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
              <RefreshCwIcon aria-hidden /> Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  // ok / cached / adapted. AI text is always rendered as plain text.
  const e = ai.explanation;
  if (!e) return null;
  return (
    <div className="space-y-4 rounded-lg border p-4 text-sm">
      <p className="text-base">{e.summary}</p>
      <div className="space-y-1">
        <h3 className="font-medium">Why {nameOf(e.topPick.styleId)}</h3>
        <p>{e.topPick.why}</p>
      </div>
      {e.others.length > 0 && (
        <div className="space-y-1">
          <h3 className="font-medium">Why the others rank lower</h3>
          <ul className="space-y-1">
            {e.others.map((o) => (
              <li key={o.styleId}>
                <span className="font-medium">{nameOf(o.styleId)}: </span>
                <span className="text-muted-foreground">{o.why}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {e.cautions.length > 0 && (
        <div className="space-y-1">
          <h3 className="font-medium">Watch out for</h3>
          <ul className="list-disc space-y-1 pl-5">
            {e.cautions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {ai.provider && <>Explanation by {ai.provider}. </>}
        {ai.reuse && REUSE_NOTES[ai.reuse.tier]}
      </p>
    </div>
  );
}
