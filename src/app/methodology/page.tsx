import type { Metadata } from "next";
import { kb } from "@/modules/knowledge-base";
import { LEVEL_LABELS, LEVELS } from "@/modules/knowledge-base/levels";
import type { Effect, Source } from "@/modules/knowledge-base/schema";
import { ENGINE_VERSION } from "@/modules/scoring";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = {
  title: "How it works",
  description: "How Architecture Advisor scores architecture styles: formula, levels, rules and sources.",
};

const refs = new Map(kb.meta.references.map((r) => [r.id, r]));
const styleName = (id: string) => kb.styles.find((s) => s.id === id)?.name ?? id;
const attrName = (id: string) => kb.attributes.find((a) => a.id === id)?.name ?? id;

function sourceText(s: Source): string {
  switch (s.kind) {
    case "book":
    case "ref": {
      const short = refs.get(s.ref)?.citation.split(",").slice(0, 2).join(",") ?? s.ref;
      return "locator" in s && s.locator ? `${short}, ${s.locator}` : short;
    }
    case "general":
      return s.flagged ? "General knowledge (estimate)" : "General knowledge";
    case "design":
      return `Design choice: ${s.note}`;
  }
}

function effectText(e: Effect): string {
  switch (e.type) {
    case "modify":
      return `${styleName(e.style)} ${e.points > 0 ? "+" : "−"}${Math.abs(e.points)}`;
    case "exclude":
      return `${styleName(e.style)} excluded`;
    case "floor":
      return `${attrName(e.attribute)} at least ${LEVEL_LABELS[e.level]}`;
    case "note":
      return e.warning ? "Shows a warning" : "Shows a note";
  }
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-semibold tracking-tight">
      {children}
    </h2>
  );
}

export default function MethodologyPage() {
  const flaggedStyles = kb.styles.filter((s) =>
    Object.values(s.scores).some((v) => v.source.kind === "general" && v.source.flagged),
  );
  return (
    <div className="max-w-4xl space-y-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">How it works</h1>
        <p className="text-lg text-muted-foreground">
          Every score comes from a small, deterministic rule engine: the same answers always give the same ranking. This
          page is generated from the same knowledge base the engine uses (v{kb.meta.kbVersion}, engine v{ENGINE_VERSION}
          ).
        </p>
      </header>

      <section aria-labelledby="pipeline" className="space-y-3">
        <H2 id="pipeline">The pipeline</H2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Weights.</strong> Each quality attribute (a property such as scalability or low cost) gets a weight
            from the importance you chose. Attributes you leave alone count as Low.
          </li>
          <li>
            <strong>Floors.</strong> Some answers set a minimum level. For example, a very limited budget makes low cost
            Critical. If a floor overrides a level you picked, the result tells you.
          </li>
          <li>
            <strong>Base score.</strong> For each style, the weighted average of its 1–5 ratings, rescaled to 0–100.
          </li>
          <li>
            <strong>Rules.</strong> Situations an average can&apos;t capture (a beginner team, plug-ins, on-premise
            hosting…) add or remove points, or exclude a style. A style&apos;s rule total is capped at ±
            {kb.meta.modifierCapPerStyle} points so rules can&apos;t drown out your priorities.
          </li>
          <li>
            <strong>Ranking.</strong> Highest final score first. Ties go to the higher base score, then to the simpler
            style.
          </li>
          <li>
            <strong>AI (optional, not enabled yet).</strong> An AI model may explain the result and nudge at most three
            of the top five styles by up to ±5 points each, always with a visible reason. It never builds the trade-off
            table and never decides the ranking on its own.
          </li>
        </ol>
      </section>

      <section aria-labelledby="formula" className="space-y-3">
        <H2 id="formula">The formula</H2>
        <pre tabIndex={0} className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
          {`avg   = Σ weight[a] × rating[style][a] / Σ weight[a]     (1–5)
base  = (avg − 1) / 4 × 100                               (0–100)
final = clamp(base + clamp(rule points, −${kb.meta.modifierCapPerStyle}, +${kb.meta.modifierCapPerStyle}), 0, 100)`}
        </pre>
        <Table>
          <TableHeader>
            <TableRow>
              {LEVELS.map((l) => (
                <TableHead key={l} scope="col">
                  {LEVEL_LABELS[l]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              {LEVELS.map((l) => (
                <TableCell key={l} className="tabular-nums">
                  weight {kb.meta.levels[l]}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground">
          Critical is 5, not 4, on purpose: one must-have should clearly outweigh several &ldquo;High&rdquo; items. Fit
          labels: 75+ strong fit, 60–74.9 good fit, 45–59.9 possible fit, below 45 weak fit.
        </p>
      </section>

      <section aria-labelledby="floors" className="space-y-3">
        <H2 id="floors">Answers that set minimum levels</H2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Question</TableHead>
              <TableHead scope="col">Answer</TableHead>
              <TableHead scope="col">Sets at least</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kb.drivers.flatMap((d) =>
              d.options
                .filter((o) => Object.keys(o.floors).length > 0)
                .map((o) => (
                  <TableRow key={`${d.id}-${o.id}`}>
                    <TableCell className="whitespace-normal">{d.label}</TableCell>
                    <TableCell>{o.label}</TableCell>
                    <TableCell className="whitespace-normal">
                      {Object.entries(o.floors)
                        .map(([a, l]) => `${attrName(a)} ${LEVEL_LABELS[l]}`)
                        .join(", ")}
                    </TableCell>
                  </TableRow>
                )),
            )}
          </TableBody>
        </Table>
      </section>

      <section aria-labelledby="rules" className="space-y-3">
        <H2 id="rules">Rules</H2>
        <ul className="space-y-3">
          {kb.rules.map((r) => (
            <li key={r.id} className="rounded-lg border p-4 text-sm">
              <p className="font-medium">
                {r.id}. {r.name}
              </p>
              <p className="text-muted-foreground">{r.explanation}</p>
              <p className="mt-1">Effect: {r.effects.map(effectText).join(", ")}</p>
              {r.otherwise && (
                <p>
                  Otherwise: {r.otherwise.map(effectText).join(", ")} ({r.otherwiseExplanation})
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Source: {sourceText(r.source)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ratings" className="space-y-3">
        <H2 id="ratings">Style ratings (1 = worst, 5 = best)</H2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Style</TableHead>
              {kb.attributes.map((a) => (
                <TableHead key={a.id} scope="col" className="text-xs">
                  {a.name.split(" ")[0]}
                </TableHead>
              ))}
              <TableHead scope="col">Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kb.styles.map((s) => (
              <TableRow key={s.id}>
                <TableHead scope="row" className="font-normal">
                  {s.name}
                </TableHead>
                {kb.attributes.map((a) => {
                  const v = s.scores[a.id]!;
                  const estimate = v.source.kind === "general" && v.source.flagged;
                  return (
                    <TableCell key={a.id} className="text-center tabular-nums">
                      {v.value}
                      {estimate && <span aria-label="estimate">≈</span>}
                    </TableCell>
                  );
                })}
                <TableCell className="text-xs text-muted-foreground">{sourceText(s.source)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground">
          ≈ marks an estimate: {flaggedStyles.map((s) => s.name).join(", ")} have no complete published rating table we
          could verify, so their values are our best reading of the sources and are flagged for review.
        </p>
      </section>

      <section aria-labelledby="sources" className="space-y-3">
        <H2 id="sources">Sources</H2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {kb.meta.references.map((r) => (
            <li key={r.id}>
              {r.url ? (
                <a href={r.url} className="underline underline-offset-4">
                  {r.citation}
                </a>
              ) : (
                r.citation
              )}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          &ldquo;General knowledge&rdquo; items were reviewed against these sources; &ldquo;design choice&rdquo; items
          are tuning decisions of this tool, checked with test scenarios.
        </p>
      </section>

      <section aria-labelledby="limits" className="space-y-3">
        <H2 id="limits">Limitations</H2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Ratings describe typical implementations; your team and context can beat or miss them.</li>
          <li>Real systems often mix styles. When parts of your system differ a lot, the result suggests a hybrid.</li>
          <li>Your free-text notes are never used by the rule engine, only by the optional AI explanation.</li>
        </ul>
      </section>
    </div>
  );
}
