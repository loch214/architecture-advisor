import Link from "next/link";
import { kb } from "@/modules/knowledge-base";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Describe your project",
    body: "Team, budget, growth, and which quality attributes (things like speed, cost or security) matter most. Every question has a “Not sure” option.",
  },
  {
    title: "Get a ranked list",
    body: `All ${kb.styles.length} architecture styles are scored from published ratings and clear rules. You see every number and why.`,
  },
  {
    title: "Compare the trade-offs",
    body: "A side-by-side table of the top styles on your priorities, plus the patterns that usually go with them.",
  },
];

export default function Home() {
  return (
    <div className="space-y-14">
      <section className="max-w-3xl space-y-5 pt-6">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Which software architecture fits your project?
        </h1>
        <p className="text-lg text-muted-foreground">
          Architecture Advisor ranks architecture styles, such as modular monolith, microservices or event-driven,
          against your project&apos;s needs, and shows exactly how it got there.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/advisor">Start</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/methodology">How it works</Link>
          </Button>
        </div>
      </section>
      <section aria-labelledby="how-heading" className="space-y-4">
        <h2 id="how-heading" className="text-xl font-semibold">
          Three steps
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="space-y-2 rounded-xl border p-5">
              <p className="text-sm font-medium text-muted-foreground">Step {i + 1}</p>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
      <p className="max-w-3xl rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
        Honest note: scores come from a rule engine built on published books and articles. An optional AI explanation
        can be added on top. Either way, it&apos;s a starting point for your own judgement, not a substitute for it.
      </p>
    </div>
  );
}
