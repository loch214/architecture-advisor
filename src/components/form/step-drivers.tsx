"use client";

import { kb } from "@/modules/knowledge-base";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/radio-group";
import type { InputIssue } from "@/modules/scoring";
import type { FormState } from "./form-state";
import { FieldError } from "./field-error";

/** "Not sure" is first in the KB (it's the neutral value) but reads best as the last choice. */
const ordered = <T extends { id: string }>(options: T[]) => [
  ...options.filter((o) => o.id !== "unsure"),
  ...options.filter((o) => o.id === "unsure"),
];

export function StepDrivers({
  form,
  issues,
  onChange,
}: {
  form: FormState;
  issues: InputIssue[];
  onChange: (drivers: FormState["drivers"]) => void;
}) {
  return (
    <div className="space-y-6">
      {kb.drivers.map((d) => {
        const issue = issues.find((i) => i.path === `drivers.${d.id}`);
        const helpId = `driver-${d.id}-help`;
        const errorId = `driver-${d.id}-error`;
        return (
          <fieldset key={d.id} className="space-y-2" aria-describedby={issue ? `${helpId} ${errorId}` : helpId}>
            <legend className="font-medium">{d.label}</legend>
            <p id={helpId} className="text-sm text-muted-foreground">
              {d.help}
            </p>
            <SegmentedControl
              value={form.drivers[d.id] ?? ""}
              onValueChange={(v) => onChange({ ...form.drivers, [d.id]: v })}
              aria-label={d.label}
              aria-invalid={!!issue}
            >
              {ordered(d.options).map((o) => (
                <SegmentedControlItem key={o.id} value={o.id}>
                  {o.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
            {issue && <FieldError id={errorId}>{issue.message}</FieldError>}
          </fieldset>
        );
      })}
    </div>
  );
}
