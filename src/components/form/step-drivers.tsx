"use client";

import { useRef } from "react";
import { CircleCheckIcon } from "lucide-react";
import { kb } from "@/modules/knowledge-base";
import { RadioCard, RadioGroup, SegmentedControl, SegmentedControlItem } from "@/components/ui/radio-group";
import type { InputIssue } from "@/modules/scoring";
import type { FormState } from "./form-state";
import { FieldError } from "./field-error";

/** "Not sure" is first in the KB (it's the neutral value) but reads best as the last choice. */
const ordered = <T extends { id: string }>(options: T[]) => [
  ...options.filter((o) => o.id !== "unsure"),
  ...options.filter((o) => o.id === "unsure"),
];

/** Brings the next unanswered question into view (only as far as needed), without moving keyboard focus. */
function revealNext(el: HTMLElement | undefined) {
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
}

export function StepDrivers({
  form,
  issues,
  onChange,
}: {
  form: FormState;
  issues: InputIssue[];
  onChange: (drivers: FormState["drivers"]) => void;
}) {
  const fieldsets = useRef(new Map<string, HTMLFieldSetElement>());
  const answered = kb.drivers.filter((d) => form.drivers[d.id]).length;
  const choose = (id: string, value: string) => {
    const first = !form.drivers[id];
    onChange({ ...form.drivers, [id]: value });
    if (!first) return;
    const after = kb.drivers.slice(kb.drivers.findIndex((d) => d.id === id) + 1);
    const nextOpen = after.find((d) => !form.drivers[d.id]);
    if (nextOpen) revealNext(fieldsets.current.get(nextOpen.id));
  };
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {answered} of {kb.drivers.length} answered
      </p>
      {kb.drivers.map((d) => {
        const issue = issues.find((i) => i.path === `drivers.${d.id}`);
        const helpId = `driver-${d.id}-help`;
        const errorId = `driver-${d.id}-error`;
        return (
          <fieldset
            key={d.id}
            ref={(el) => {
              if (el) fieldsets.current.set(d.id, el);
              else fieldsets.current.delete(d.id);
            }}
            className="scroll-mt-4 space-y-2"
            aria-describedby={issue ? `${helpId} ${errorId}` : helpId}
          >
            <legend className="flex items-center gap-1.5 font-medium">
              {d.label}
              {form.drivers[d.id] && (
                <>
                  <CircleCheckIcon className="size-4 text-primary" aria-hidden />
                  <span className="sr-only">(answered)</span>
                </>
              )}
            </legend>
            <p id={helpId} className="text-sm text-muted-foreground">
              {d.help}
            </p>
            {d.options.some((o) => o.description) ? (
              // Options that need an example on screen are cards, so nobody has to guess what they mean.
              <RadioGroup
                value={form.drivers[d.id] ?? ""}
                onValueChange={(v) => choose(d.id, v)}
                aria-label={d.label}
                aria-invalid={!!issue}
                className="gap-2 sm:grid-cols-2"
              >
                {ordered(d.options).map((o) => (
                  <RadioCard key={o.id} value={o.id} label={o.label} description={o.description} />
                ))}
              </RadioGroup>
            ) : (
              <SegmentedControl
                value={form.drivers[d.id] ?? ""}
                onValueChange={(v) => choose(d.id, v)}
                aria-label={d.label}
                aria-invalid={!!issue}
              >
                {ordered(d.options).map((o) => (
                  <SegmentedControlItem key={o.id} value={o.id}>
                    {o.label}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            )}
            {issue && <FieldError id={errorId}>{issue.message}</FieldError>}
          </fieldset>
        );
      })}
    </div>
  );
}
