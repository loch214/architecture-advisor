import Link from "next/link";
import { kb } from "@/modules/knowledge-base";
import { LEVEL_LABELS } from "@/modules/knowledge-base/levels";
import type { AdvisorResult } from "@/modules/recommendation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TriangleAlertIcon, LightbulbIcon } from "lucide-react";
import { Section } from "./section";
import { signedInt } from "./format";

const styleName = (r: AdvisorResult, id: string) => r.snapshot.styles[id]?.name ?? id;

/** Conflicts, warnings and notes: things the user should look at before trusting the ranking. */
export function Heads({ result }: { result: AdvisorResult }) {
  const { conflicts, warnings, notes } = result.rules;
  if (conflicts.length + warnings.length + notes.length === 0) return null;
  return (
    <div className="space-y-3">
      {conflicts.length > 0 && (
        <Alert variant="warning">
          <TriangleAlertIcon aria-hidden />
          <AlertTitle>Your answers pull in different directions</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {conflicts.map((c) => (
                <li key={c.attribute}>{c.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      {warnings.map((w) => (
        <Alert key={w.code + (w.ruleId ?? "")} variant="warning">
          <TriangleAlertIcon aria-hidden />
          <AlertTitle>Worth a second look</AlertTitle>
          <AlertDescription>{w.message}</AlertDescription>
        </Alert>
      ))}
      {notes.map((n) => (
        <Alert key={n.ruleId} variant="info">
          <LightbulbIcon aria-hidden />
          <AlertTitle>Note</AlertTitle>
          <AlertDescription>{n.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

export function Adjustments({ result }: { result: AdvisorResult }) {
  const modifying = result.rules.firedRules.filter((r) =>
    r.effects.some((e) => e.type === "modify" || e.type === "floor"),
  );
  const ai = result.ai.adjustments;
  return (
    <Section
      id="adjustments-heading"
      title="Adjustments made"
      description="Rules adjust the base scores for situations a simple average can't capture. Each style's total is capped at ±30 points."
    >
      {modifying.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rules changed any score.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {modifying.map((r) => (
            <li key={r.ruleId} className="rounded-lg border p-3">
              <p className="font-medium">
                {r.name} <span className="font-normal text-muted-foreground">({r.ruleId})</span>
              </p>
              <p className="text-muted-foreground">{r.explanation}</p>
              <p className="mt-1 flex flex-wrap gap-1.5">
                {r.effects.map((e, i) =>
                  e.type === "modify" ? (
                    <Badge key={i} variant="secondary">
                      {styleName(result, e.style)} {signedInt(e.points)}
                    </Badge>
                  ) : e.type === "floor" ? (
                    <Badge key={i} variant="secondary">
                      {kb.attributes.find((a) => a.id === e.attribute)?.name} ≥ {LEVEL_LABELS[e.level]}
                    </Badge>
                  ) : e.type === "exclude" ? (
                    <Badge key={i} variant="secondary">
                      {styleName(result, e.style)} excluded
                    </Badge>
                  ) : null,
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
      {ai.length > 0 && (
        <ul className="space-y-2 text-sm">
          {ai.map((a) => (
            <li key={a.styleId} className="rounded-lg border p-3">
              <Badge variant="info">
                AI: {styleName(result, a.styleId)} {signedInt(a.delta)}
              </Badge>{" "}
              {a.reason}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export function Excluded({ result }: { result: AdvisorResult }) {
  if (result.rules.excluded.length === 0) return null;
  return (
    <Section id="excluded-heading" title="Not recommended">
      <ul className="space-y-2 text-sm">
        {result.rules.excluded.map((x) => (
          <li key={x.styleId}>
            <strong>{styleName(result, x.styleId)}</strong>: {x.reasons.join(" ")}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function Patterns({ result }: { result: AdvisorResult }) {
  const top = kb.styles.find((s) => s.id === result.final[0]?.styleId);
  if (!top) return null;
  const pick = (ids: string[]) => kb.patterns.filter((p) => ids.includes(p.id));
  const patterns = pick(top.patterns);
  const anti = pick(top.antiPatterns);
  if (patterns.length + anti.length === 0) return null;
  return (
    <Section
      id="patterns-heading"
      title={`Commonly used with ${top.name}`}
      description="Patterns solve smaller problems inside a style. They aren't ranked; they're here as companions."
    >
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        {patterns.map((p) => (
          <li key={p.id} className="rounded-lg border p-3">
            <p className="font-medium">{p.name}</p>
            <p className="text-muted-foreground">{p.solution}</p>
          </li>
        ))}
        {anti.map((p) => (
          <li key={p.id} className="rounded-lg border border-warning/40 p-3">
            <p className="font-medium">
              Watch out: {p.name} <span className="font-normal text-muted-foreground">(anti-pattern)</span>
            </p>
            <p className="text-muted-foreground">{p.problem}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function Mentions({ result }: { result: AdvisorResult }) {
  if (result.mentions.length === 0) return null;
  return (
    <Section id="mentions-heading" title="You mentioned">
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        {result.mentions.map((m) => (
          <li key={`${m.kind}:${m.id}`} className="rounded-lg border p-3">
            <p className="font-medium">
              &ldquo;{m.matched}&rdquo; → {m.name}
            </p>
            <p className="text-muted-foreground">{m.answer}</p>
            {m.relatedStyles.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Related: {m.relatedStyles.map((id) => styleName(result, id)).join(", ")}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function HowCalculated({ result }: { result: AdvisorResult }) {
  const { effectiveLevels, effectiveWeights } = result.rules;
  const total = Object.values(effectiveWeights).reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-3 text-sm">
      <p>
        Each attribute gets a weight from its importance: Not needed 0, Low 1, Medium 2, High 3, Critical 5. Some
        answers raise an attribute to a minimum level (a &ldquo;floor&rdquo;). A style&apos;s base score is the weighted
        average of its 1–5 ratings, rescaled to 0–100; rules then add or remove points (capped at ±
        {kb.meta.modifierCapPerStyle}). Full details on the{" "}
        <Link href="/methodology" className="underline underline-offset-4">
          methodology page
        </Link>
        .
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Attribute</TableHead>
            <TableHead scope="col">Your level</TableHead>
            <TableHead scope="col">Used level</TableHead>
            <TableHead scope="col" className="text-right">
              Weight
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kb.attributes.map((a) => (
            <TableRow key={a.id}>
              <TableHead scope="row" className="font-normal">
                {a.name}
              </TableHead>
              <TableCell>
                {result.input.attributes[a.id] ? LEVEL_LABELS[result.input.attributes[a.id]!] : "Low (default)"}
              </TableCell>
              <TableCell>{LEVEL_LABELS[effectiveLevels[a.id]!]}</TableCell>
              <TableCell className="text-right tabular-nums">{effectiveWeights[a.id]}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableHead scope="row">Total weight</TableHead>
            <TableCell />
            <TableCell />
            <TableCell className="text-right font-medium tabular-nums">{total}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground">
        Knowledge base v{result.versions.kb} · engine v{result.versions.engine} · app v{result.versions.app}
      </p>
    </div>
  );
}
