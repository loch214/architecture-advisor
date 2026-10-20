"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { kb } from "@/modules/knowledge-base";
import { LEVEL_LABELS, LEVELS, type Level } from "@/modules/knowledge-base/levels";
import type { AppliedFloor, Conflict, InputIssue } from "@/modules/scoring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { FormState } from "./form-state";
import { FieldError } from "./field-error";
import { InfoTip } from "./info-tip";

const rank = (l: Level) => LEVELS.indexOf(l);
const sourceLabel = (f: AppliedFloor["from"][number]) => (f.kind === "driver" ? f.label : `${f.label} rule`);

export function StepAttributes({
  form,
  issues,
  floors,
  conflicts,
  onChange,
}: {
  form: FormState;
  issues: InputIssue[];
  floors: AppliedFloor[];
  conflicts: Conflict[];
  onChange: (attributes: FormState["attributes"]) => void;
}) {
  const advancedSet = kb.attributes.some((a) => a.visibility === "advanced" && form.attributes[a.id] !== undefined);
  const [showAll, setShowAll] = useState(advancedSet);
  const criticalCount = Object.values(form.attributes).filter((l) => l === "critical").length;
  const tooMany = criticalCount > kb.meta.maxCriticalSoftLimit;
  const issue = issues[0];
  const visible = kb.attributes.filter((a) => showAll || a.visibility === "default");

  return (
    <div className="space-y-5">
      <p
        role="status"
        className={cn(
          "rounded-md px-3 py-2 text-sm",
          tooMany ? "bg-warning-muted text-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {tooMany ? `You have ${criticalCount} Critical attributes. ` : ""}
        Tip: pick at most {kb.meta.maxCriticalSoftLimit} Critical. Real architectures can&apos;t maximise everything.
      </p>
      {issue && <FieldError>{issue.message}</FieldError>}
      <ul className="divide-y">
        {visible.map((a) => {
          const userLevel = form.attributes[a.id];
          const shown = userLevel ?? "low";
          const floor = floors.find((f) => f.attribute === a.id);
          const conflict = conflicts.find((c) => c.attribute === a.id);
          const raised = floor && rank(floor.level) > rank(shown);
          return (
            <li key={a.id} className="grid gap-2 py-3 md:grid-cols-[1fr_auto] md:items-center md:gap-6">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1">
                  <span id={`attr-${a.id}`} className="font-medium">
                    {a.name}
                  </span>
                  <InfoTip label={a.name}>
                    <p>{a.help}</p>
                    <p className="text-muted-foreground">Example: {a.example}</p>
                  </InfoTip>
                </div>
                <p className="text-sm text-muted-foreground">{a.short}</p>
                {raised && (
                  <Badge variant={conflict ? "warning" : "info"} className="whitespace-normal text-left">
                    {conflict ? "Raised to" : "Implied:"} at least {LEVEL_LABELS[floor.level]} (from{" "}
                    {floor.from
                      .filter((f) => f.level === floor.level)
                      .map(sourceLabel)
                      .join(", ")}
                    )
                  </Badge>
                )}
              </div>
              <SegmentedControl
                value={shown}
                onValueChange={(v) => onChange({ ...form.attributes, [a.id]: v as Level })}
                aria-labelledby={`attr-${a.id}`}
                className="md:w-[30rem]"
              >
                {LEVELS.map((l) => (
                  <SegmentedControlItem key={l} value={l}>
                    {LEVEL_LABELS[l]}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </li>
          );
        })}
      </ul>
      {!showAll && (
        <div className="space-y-1">
          <Button variant="outline" onClick={() => setShowAll(true)} aria-describedby="more-attributes">
            <ChevronDownIcon aria-hidden />
            Show more attributes
          </Button>
          <p id="more-attributes" className="text-sm text-muted-foreground">
            {kb.attributes
              .filter((a) => a.visibility === "advanced")
              .map((a) => a.name)
              .join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
