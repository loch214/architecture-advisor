"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { presets, type Preset } from "./presets";

/** Step 0: start from an example or from scratch. */
export function PresetPicker({ onPick, onBlank }: { onPick: (p: Preset) => void; onBlank: () => void }) {
  return (
    <section aria-labelledby="start-heading" className="space-y-6">
      <div className="space-y-2">
        <h1 id="start-heading" className="text-2xl font-semibold tracking-tight">
          Start from an example, or from scratch
        </h1>
        <p className="text-muted-foreground">
          An example fills in every answer for you. You can change any of them before getting your recommendation.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {presets.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onPick(p)}
              className="h-full w-full rounded-xl text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Card className="h-full transition-colors hover:border-foreground/30">
                <CardHeader>
                  <CardTitle>{p.title}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
              </Card>
            </button>
          </li>
        ))}
      </ul>
      <Button size="lg" onClick={onBlank}>
        Start blank
      </Button>
    </section>
  );
}
