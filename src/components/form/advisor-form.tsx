"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CircleAlertIcon } from "lucide-react";
import { kb } from "@/modules/knowledge-base";
import { previewFloors } from "@/modules/scoring";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { STEPS, firstInvalidStep, issuesFor, type FormState, type StepId } from "./form-state";
import { StepAttributes } from "./step-attributes";
import { StepDrivers } from "./step-drivers";
import { StepReview } from "./step-review";
import { StepSituation } from "./step-situation";

const STEP_INTROS: Record<StepId, string> = {
  1: 'Business drivers shape which styles are realistic. Every question has a "Not sure" option.',
  2: "Rate how much each quality attribute matters. Anything you leave alone counts as Low.",
  3: "Some styles fit specific situations. Tick what applies; leave the rest.",
  4: "Add any context the questions missed, check your answers, then get your recommendation.",
};

export function AdvisorForm({
  form,
  step,
  onFormChange,
  onStepChange,
  onSubmit,
}: {
  form: FormState;
  step: StepId;
  onFormChange: (f: FormState) => void;
  onStepChange: (s: StepId) => void;
  onSubmit: () => void;
}) {
  // Messages appear only after the user tries to move on, not while they're still filling the step in.
  const [attempted, setAttempted] = useState<Set<StepId>>(new Set());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const issues = useMemo(() => issuesFor(step, form, kb), [step, form]);
  const shownIssues = attempted.has(step) ? issues : [];
  const { floors, conflicts } = useMemo(() => previewFloors(form, kb), [form]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const goTo = (s: StepId) => {
    onStepChange(s);
    window.scrollTo({ top: 0 });
  };

  const next = () => {
    if (issues.length > 0) {
      setAttempted((a) => new Set(a).add(step));
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    if (step < 4) goTo((step + 1) as StepId);
    else {
      const invalid = firstInvalidStep(form, kb);
      if (invalid) {
        setAttempted((a) => new Set(a).add(invalid));
        goTo(invalid);
      } else onSubmit();
    }
  };

  const current = STEPS[step - 1]!;
  return (
    <section aria-labelledby="step-heading" className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Step {step} of {STEPS.length}
        </p>
        <Progress value={(step / STEPS.length) * 100} aria-label={`Step ${step} of ${STEPS.length}`} />
        <ol className="hidden gap-4 text-sm sm:flex" aria-label="Steps">
          {STEPS.map((s) => (
            <li key={s.id} aria-current={s.id === step ? "step" : undefined}>
              <button
                type="button"
                onClick={() => goTo(s.id)}
                className={s.id === step ? "font-medium" : "text-muted-foreground hover:text-foreground"}
              >
                {s.id}. {s.short}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className="space-y-1">
        <h2
          id="step-heading"
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight outline-none"
        >
          {current.title}
        </h2>
        <p className="text-muted-foreground">{STEP_INTROS[step]}</p>
      </div>

      {shownIssues.length > 0 && (
        <Alert variant="destructive" ref={summaryRef} tabIndex={-1} className="outline-none">
          <CircleAlertIcon aria-hidden />
          <AlertTitle>
            {shownIssues.length === 1 ? "One thing to fix" : `${shownIssues.length} things to fix`} before moving on
          </AlertTitle>
          <AlertDescription>
            {step === 1
              ? 'Answer every question below ("Not sure" is fine).'
              : shownIssues.map((i) => <span key={i.path}>{i.message}</span>)}
          </AlertDescription>
        </Alert>
      )}

      {step === 1 && (
        <StepDrivers form={form} issues={shownIssues} onChange={(drivers) => onFormChange({ ...form, drivers })} />
      )}
      {step === 2 && (
        <StepAttributes
          form={form}
          issues={shownIssues}
          floors={floors}
          conflicts={conflicts}
          onChange={(attributes) => onFormChange({ ...form, attributes })}
        />
      )}
      {step === 3 && (
        <StepSituation form={form} onChange={(characteristics) => onFormChange({ ...form, characteristics })} />
      )}
      {step === 4 && (
        <StepReview
          form={form}
          issues={shownIssues}
          onNotes={(notes) => onFormChange({ ...form, notes })}
          onUseAi={(useAi) => onFormChange({ ...form, useAi })}
          onEdit={goTo}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <Button variant="outline" onClick={() => goTo((step - 1) as StepId)} disabled={step === 1}>
          <ArrowLeftIcon aria-hidden />
          Back
        </Button>
        <Button size="lg" onClick={next}>
          {step < 4 ? "Next" : "Get recommendation"}
          {step < 4 && <ArrowRightIcon aria-hidden />}
        </Button>
      </div>
    </section>
  );
}
