"use client";

import { CircleAlertIcon } from "lucide-react";
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
import { decodeShareHash } from "@/components/form/share-link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { APP_VERSION } from "@/lib/version";
import { clearSavedResult, loadSavedResult, saveResult } from "./result-storage";

// The result view is only needed after submit, so it loads in its own chunk (keeps /advisor under budget).
const ResultView = dynamic(() => import("@/components/result/result-view").then((m) => m.ResultView), {
  loading: () => <p role="status">Preparing your result…</p>,
});

type View = "start" | "form" | "result";

const NOTICES = {
  broken: {
    title: "We couldn't open that link",
    text: "It may be cut off or made by an older version of the app. You can start again below.",
  },
  partial: {
    title: "Some answers in that link need checking",
    text: "The questions have changed since the link was made. We kept every answer that still fits; please fill in the rest.",
  },
} as const;

const newResult = (form: FormState) =>
  buildResult(
    toUserInput(form),
    kb,
    { id: crypto.randomUUID(), createdAt: new Date().toISOString(), appVersion: APP_VERSION },
    // Until /api/explain answers, the AI block reads "unavailable"; the panel shows a loading state meanwhile.
    { status: form.useAi ? "unavailable" : "skipped", adjustments: [] },
  );

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
  const [notice, setNotice] = useState<keyof typeof NOTICES>();

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

  const showResult = useCallback(
    (f: FormState) => {
      const r = newResult(f);
      setNotice(undefined);
      setResult(r);
      saveResult(r);
      setView("result");
      window.scrollTo({ top: 0 });
      if (f.useAi) void requestAi(r);
    },
    [requestAi],
  );

  // A shared link (#a=…) wins over local storage. The hash is removed once read, so a refresh uses the saved copy.
  const openSharedLink = useCallback(() => {
    const link = decodeShareHash(window.location.hash, kb);
    if (link.status === "none") return false;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    if (link.status === "ok") {
      setForm(link.form);
      setStep(4);
      showResult(link.form);
    } else if (link.status === "partial") {
      clearSavedResult();
      setForm(link.form);
      setStep(link.step);
      setView("form");
      setNotice("partial");
    } else {
      setView("start");
      setNotice("broken");
    }
    return true;
  }, [showResult]);

  // Restore after hydration (local storage isn't available while prerendering).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from the URL hash or local storage */
    if (!openSharedLink()) {
      const saved = loadSavedForm(kb);
      const savedResult = loadSavedResult();
      if (saved) {
        setForm(saved.form);
        setStep(saved.step);
        setView("form");
      }
      if (savedResult) {
        setResult(savedResult);
        setView("result");
      }
    }
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // A link pasted into the address bar while /advisor is open only changes the hash.
    const onHashChange = () => void openSharedLink();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [openSharedLink]);

  const submit = () => showResult(form);

  const startOver = () => {
    clearSavedForm();
    clearSavedResult();
    setForm(emptyForm());
    setStep(1);
    setResult(undefined);
    setNotice(undefined);
    setView("start");
  };

  const noticeBox = notice && (
    <Alert variant="warning" role="alert" className={view === "form" ? "mx-auto mb-6 max-w-4xl" : "mb-6"}>
      <CircleAlertIcon aria-hidden />
      <AlertTitle>{NOTICES[notice].title}</AlertTitle>
      <AlertDescription>{NOTICES[notice].text}</AlertDescription>
    </Alert>
  );

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
    return (
      <>
        {noticeBox}
        <AdvisorForm form={form} step={step} onFormChange={setForm} onStepChange={setStep} onSubmit={submit} />
      </>
    );
  }
  return (
    <>
      {noticeBox}
      <PresetPicker
        onPick={(p) => {
          setNotice(undefined);
          setForm(fromInput(p.input));
          setStep(4);
          setView("form");
        }}
        onBlank={() => {
          setNotice(undefined);
          setForm(emptyForm());
          setStep(1);
          setView("form");
        }}
      />
    </>
  );
}
