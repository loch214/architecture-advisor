"use client";

import { useId, useState } from "react";
import { InfoIcon } from "lucide-react";

/**
 * The ⓘ next to a label: a button that shows the explanation inline below it. Works by mouse, tap and
 * keyboard, and avoids shipping a positioning library just for tooltips.
 */
export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-expanded:text-foreground"
      >
        <InfoIcon className="size-4" aria-hidden />
      </button>
      <div id={id} hidden={!open} className="basis-full space-y-1 rounded-md bg-muted px-3 py-2 text-sm">
        {children}
      </div>
    </>
  );
}
