"use client";

import { kb } from "@/modules/knowledge-base";
import { LEVEL_LABELS, LEVELS } from "@/modules/knowledge-base/levels";
import { MAX_NOTES_LENGTH, type InputIssue } from "@/modules/scoring";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { STEPS, type FormState, type StepId } from "./form-state";
import { FieldError } from "./field-error";

function driverAnswers(form: FormState) {
  return kb.drivers.map((d) => ({
    label: d.label,
    value: d.options.find((o) => o.id === form.drivers[d.id])?.label ?? "Not answered",
  }));
}

function attributeAnswers(form: FormState) {
  const set = kb.attributes.filter((a) => form.attributes[a.id] !== undefined);
  return [...set]
    .sort((a, b) => LEVELS.indexOf(form.attributes[b.id]!) - LEVELS.indexOf(form.attributes[a.id]!))
    .map((a) => `${a.name}: ${LEVEL_LABELS[form.attributes[a.id]!]}`);
}

function situationAnswers(form: FormState) {
  return kb.characteristics.flatMap((c) => {
    const v = form.characteristics[c.id];
    if (c.type === "boolean") return v === true ? [c.label] : [];
    const option = c.options.find((o) => o.id === (v ?? c.default));
    return v !== undefined && v !== c.default ? [`${c.label} ${option?.label}`] : [];
  });
}

export function StepReview({
  form,
  issues,
  onNotes,
  onUseAi,
  onEdit,
}: {
  form: FormState;
  issues: InputIssue[];
  onNotes: (notes: string) => void;
  onUseAi: (useAi: boolean) => void;
  onEdit: (step: StepId) => void;
}) {
  const over = form.notes.length > MAX_NOTES_LENGTH;
  const notesIssue = issues.find((i) => i.path === "notes");
  const situation = situationAnswers(form);
  const sections: { step: StepId; items: string[] }[] = [
    { step: 1, items: driverAnswers(form).map((d) => `${d.label} ${d.value}`) },
    { step: 2, items: attributeAnswers(form).concat("Everything else: Low") },
    { step: 3, items: situation.length ? situation : ["Nothing special selected"] },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="notes">Anything else we should know? (optional)</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => onNotes(e.target.value)}
          placeholder="E.g. we already use Kafka; the team knows Java well; we must launch before the exam period."
          aria-describedby="notes-count notes-privacy"
          aria-invalid={over}
          rows={4}
        />
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <p id="notes-privacy" className="max-w-prose text-muted-foreground">
            If AI is on, your notes are sent to an AI service (Google Gemini or Groq) to write the explanation. Free AI
            services may use this text to improve their products, so please don&apos;t include passwords, personal or
            confidential details.
          </p>
          <p id="notes-count" className={cn("tabular-nums", over ? "text-destructive" : "text-muted-foreground")}>
            {form.notes.length}/{MAX_NOTES_LENGTH}
          </p>
        </div>
        {notesIssue && <FieldError>{notesIssue.message}</FieldError>}
        <div className="flex items-center gap-2 pt-1">
          <Checkbox id="no-ai" checked={!form.useAi} onCheckedChange={(v) => onUseAi(v !== true)} />
          <Label htmlFor="no-ai" className="font-normal">
            Don&apos;t use AI for this request
          </Label>
        </div>
      </div>

      <section aria-labelledby="review-heading" className="space-y-3">
        <h3 id="review-heading" className="font-semibold">
          Your answers
        </h3>
        <dl className="divide-y rounded-lg border">
          {sections.map(({ step, items }) => (
            <div key={step} className="grid gap-2 p-3 sm:grid-cols-[10rem_1fr_auto] sm:items-start">
              <dt className="text-sm font-medium">{STEPS[step - 1]!.title}</dt>
              <dd className="text-sm text-muted-foreground">
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </dd>
              <dd>
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => onEdit(step)}>
                  Edit<span className="sr-only"> {STEPS[step - 1]!.title}</span>
                </Button>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
