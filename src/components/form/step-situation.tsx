"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { kb } from "@/modules/knowledge-base";
import type { Characteristic } from "@/modules/knowledge-base/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/radio-group";
import type { FormState } from "./form-state";

type Chars = FormState["characteristics"];

function CheckCard({ c, chars, onChange }: { c: Characteristic; chars: Chars; onChange: (c: Chars) => void }) {
  const id = `char-${c.id}`;
  return (
    <li>
      <label
        htmlFor={id}
        className="flex h-full cursor-pointer gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50 has-[[data-state=checked]]:border-primary/60 has-[[data-state=checked]]:bg-accent/40"
      >
        <Checkbox
          id={id}
          checked={chars[c.id] === true}
          onCheckedChange={(v) => onChange({ ...chars, [c.id]: v === true })}
          aria-describedby={`${id}-help`}
          className="mt-0.5"
        />
        <span className="space-y-1">
          <span className="block text-sm font-medium">{c.label}</span>
          <span id={`${id}-help`} className="block text-sm text-muted-foreground">
            {c.help}
          </span>
        </span>
      </label>
    </li>
  );
}

function Choice({
  c,
  chars,
  onChange,
}: {
  c: Characteristic & { type: "choice" };
  chars: Chars;
  onChange: (c: Chars) => void;
}) {
  const ordered = [...c.options.filter((o) => o.id !== "unsure"), ...c.options.filter((o) => o.id === "unsure")];
  return (
    <fieldset className="space-y-2" aria-describedby={`char-${c.id}-help`}>
      <legend className="font-medium">{c.label}</legend>
      <p id={`char-${c.id}-help`} className="text-sm text-muted-foreground">
        {c.help}
      </p>
      <SegmentedControl
        value={(chars[c.id] as string | undefined) ?? c.default}
        onValueChange={(v) => onChange({ ...chars, [c.id]: v })}
        aria-label={c.label}
      >
        {ordered.map((o) => (
          <SegmentedControlItem key={o.id} value={o.id}>
            {o.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    </fieldset>
  );
}

export function StepSituation({ form, onChange }: { form: FormState; onChange: (c: Chars) => void }) {
  const chars = form.characteristics;
  const workload = kb.characteristics.filter((c) => c.group === "workload");
  const constraints = kb.characteristics.filter((c) => c.group === "constraint");
  const rareChecked = workload.some((c) => c.rare && chars[c.id] === true);
  const [showRare, setShowRare] = useState(rareChecked);
  const booleans = (list: Characteristic[]) =>
    list
      .filter((c) => c.type === "boolean")
      .map((c) => <CheckCard key={c.id} c={c} chars={chars} onChange={onChange} />);
  const choices = (list: Characteristic[]) =>
    list.flatMap((c) => (c.type === "choice" ? [<Choice key={c.id} c={c} chars={chars} onChange={onChange} />] : []));

  return (
    <div className="space-y-8">
      <section aria-labelledby="workload-heading" className="space-y-3">
        <h3 id="workload-heading" className="font-semibold">
          What does the system do? <span className="font-normal text-muted-foreground">(tick any that apply)</span>
        </h3>
        <ul className="grid gap-2 sm:grid-cols-2">{booleans(workload.filter((c) => !c.rare))}</ul>
        {showRare ? (
          <ul className="grid gap-2 sm:grid-cols-2" aria-label="More situations">
            {booleans(workload.filter((c) => c.rare))}
          </ul>
        ) : (
          <Button variant="outline" onClick={() => setShowRare(true)}>
            <ChevronDownIcon aria-hidden />
            More situations
          </Button>
        )}
      </section>
      {choices(workload)}
      <section aria-labelledby="constraints-heading" className="space-y-4">
        <h3 id="constraints-heading" className="font-semibold">
          Constraints
        </h3>
        {choices(constraints)}
        <ul className="grid gap-2 sm:grid-cols-2">{booleans(constraints)}</ul>
      </section>
    </div>
  );
}
