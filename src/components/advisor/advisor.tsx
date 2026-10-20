"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { kb } from "@/modules/knowledge-base";
import { buildResult, withAi, type AdvisorResult, type AiBlock } from "@/modules/recommendation";
import { AdvisorForm } from "@/components/form/advisor-form";
import {
  clearSavedForm,
  emptyForm,
  fromInput,
  loadSavedForm,
  saveForm,
  toUserInput,
  type FormState,
  type StepId,
} from "@/components/form/form-state";
import { PresetPicker } from "@/components/form/preset-picker";
import { APP_VERSION } from "@/lib/version";
import { clearSavedResult, loadSavedResult, saveResult } from "./result-storage";

// The result view is only needed after submit, so it loads in its own chunk (keeps /advisor under budget).
const ResultView = dynamic(() => import("@/components/result/result-view").then((m) => m.ResultView), {
  loading: () => <p role="status">Preparing your result…</p>,
});

type View = "start" | "form" | "result";

async function fetchAi(result: AdvisorResult): Promise<AiBlock> {
  try {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: result.input }),
    });
    if (!res.ok) return { status: "unavailable", adjustments: [] };
    return ((await res.json()) as { ai: AiBlock }).ai;
  } catch {
    // Offline or the route failed: the rule result is already complete.
    return { status: "unavailable", adjustments: [] };
  }
}

/** The /advisor page: presets → 4-step form → result, with answers kept in local storage. */
export function Advisor() {
  const [view, setView] = useState<View>("start");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [step, setStep] = useState<StepId>(1);
  const [result, setResult] = useState<AdvisorResult>();
  const [aiPending, setAiPending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Restore after hydration (local storage isn't available while prerendering).
  useEffect(() => {
    const saved = loadSavedForm(kb);
    const savedResult = loadSavedResult();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from local storage */
    if (saved) {
      setForm(saved.form);
      setStep(saved.step);
      setView("form");
    }
    if (savedResult) {
      setResult(savedResult);
      setView("result");
    }
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (loaded && view !== "start") saveForm({ form, step }, kb);
  }, [form, step, view, loaded]);

  const requestAi = useCallback(async (r: AdvisorResult) => {
    setAiPending(true);
    const ai = await fetchAi(r);
    setAiPending(false);
    setResult((current) => {
      if (current?.id !== r.id) return current;
      const merged = withAi(current, ai, kb);
      saveResult(merged);
      return merged;
    });
  }, []);

  const submit = () => {
    const r = buildResult(
      toUserInput(form),
      kb,
      { id: crypto.randomUUID(), createdAt: new Date().toISOString(), appVersion: APP_VERSION },
      // Until /api/explain answers, the AI block reads "unavailable"; the panel shows a loading state meanwhile.
      { status: form.useAi ? "unavailable" : "skipped", adjustments: [] },
    );
    setResult(r);
    saveResult(r);
    setView("result");
    window.scrollTo({ top: 0 });
    if (form.useAi) void requestAi(r);
  };

  const startOver = () => {
    clearSavedForm();
    clearSavedResult();
    setForm(emptyForm());
    setStep(1);
    setResult(undefined);
    setView("start");
  };

  if (view === "result" && result) {
    return (
      <ResultView
        result={result}
        aiPending={aiPending}
        onEdit={() => {
          clearSavedResult();
          setView("form");
          setStep(4);
        }}
        onStartOver={startOver}
        onRetryAi={() => void requestAi(result)}
      />
    );
  }
  if (view === "form") {
    return <AdvisorForm form={form} step={step} onFormChange={setForm} onStepChange={setStep} onSubmit={submit} />;
  }
  return (
    <PresetPicker
      onPick={(p) => {
        setForm(fromInput(p.input));
        setStep(4);
        setView("form");
      }}
      onBlank={() => {
        setForm(emptyForm());
        setStep(1);
        setView("form");
      }}
    />
  );
}
