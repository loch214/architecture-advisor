"use client";

import { useState } from "react";
import { kb } from "@/modules/knowledge-base";
import type { AdvisorResult } from "@/modules/recommendation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function Stars({ value, estimated }: { value: number; estimated: boolean }) {
  return (
    <span className="whitespace-nowrap">
      <span aria-hidden className="tracking-tight">
        <span>{"★".repeat(value)}</span>
        <span className="text-muted-foreground/40">{"★".repeat(5 - value)}</span>
      </span>
      <span className="sr-only">
        {value} out of 5{estimated ? " (estimate)" : ""}
      </span>
      {estimated && (
        <span aria-hidden className="ml-0.5 text-muted-foreground">
          ≈
        </span>
      )}
    </span>
  );
}

/** Trade-off comparison built only from the KB snapshot stored in the result, never from AI text (FR-32). */
export function TradeoffTable({ result }: { result: AdvisorResult }) {
  const [columns, setColumns] = useState(3);
  const [allRows, setAllRows] = useState(false);
  const styles = result.final.slice(0, columns).map((f) => ({ id: f.styleId, ...result.snapshot.styles[f.styleId]! }));
  const top = result.rules.topAttributes;
  const rest = kb.attributes.map((a) => a.id).filter((id) => !top.includes(id));
  const rows = allRows ? [...top, ...rest] : top.length > 0 ? top : rest.slice(0, 5);
  const name = (id: string) => kb.attributes.find((a) => a.id === id)?.name ?? id;
  const anyEstimate = styles.some((s) => s.estimated.length > 0);
  const kbText = (id: string) => kb.styles.find((s) => s.id === id);

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">
              <span className="sr-only">Attribute</span>
            </TableHead>
            {styles.map((s) => (
              <TableHead key={s.id} scope="col">
                {s.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((a) => (
            <TableRow key={a}>
              <TableHead scope="row" className="font-normal">
                {name(a)}
                {top.includes(a) && <span className="sr-only"> (one of your priorities)</span>}
                {top.includes(a) && (
                  <span aria-hidden className="ml-1 text-xs text-muted-foreground">
                    ●
                  </span>
                )}
              </TableHead>
              {styles.map((s) => (
                <TableCell key={s.id}>
                  <Stars value={s.scores[a]!} estimated={s.estimated.includes(a)} />
                  {a === "cost" && (
                    <span className="ml-2 text-xs text-muted-foreground">{"$".repeat(6 - s.scores[a]!)}</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {(["strengths", "weaknesses", "goodWhen", "avoidWhen"] as const).map((field) => (
            <TableRow key={field} className="align-top">
              <TableHead scope="row" className="pt-3 align-top font-normal">
                {
                  { strengths: "Strengths", weaknesses: "Weaknesses", goodWhen: "Good when", avoidWhen: "Avoid when" }[
                    field
                  ]
                }
              </TableHead>
              {styles.map((s) => (
                <TableCell key={s.id} className="min-w-48 align-top text-xs whitespace-normal">
                  <ul className="list-disc space-y-1 pl-4">
                    {(kbText(s.id)?.[field] ?? []).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground">
        Ratings from 1 (worst) to 5 (best), mostly from Richards &amp; Ford. ● marks your priorities.
        {anyEstimate && " ≈ marks an estimate where no published rating exists."} Low cost: more stars = cheaper ($ =
        relative cost).
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setAllRows((v) => !v)}>
          {allRows ? "Show only your priorities" : "Show all attributes"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setColumns((c) => (c === 3 ? 5 : 3))}>
          {columns === 3 ? "Compare top 5" : "Compare top 3"}
        </Button>
      </div>
    </div>
  );
}
