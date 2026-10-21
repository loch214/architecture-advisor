import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { kb } from "@/modules/knowledge-base";
import { presets } from "@/components/form/presets";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Describe your project",
    body: "What you're building, your team and budget, and which qualities (like speed, cost or security) matter most. Every question has a “Not sure” option.",
  },
  {
    title: "Get a ranked list",
    body: `All ${kb.styles.length} architecture styles are scored from published ratings and clear rules, with the reasons in plain words.`,
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
          Answer a few short questions and get architecture styles, such as modular monolith, microkernel or
          microservices, ranked for your project, with the reasons explained.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            {/* ?new always opens a blank form, even if this tab has answers from earlier. */}
            <Link href="/advisor?new">
              Start a new recommendation <ArrowRightIcon aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/methodology">How it works</Link>
          </Button>
        </div>
      </section>

      <section id="examples" aria-labelledby="examples-heading" className="scroll-mt-6 space-y-4">
        <div className="space-y-1">
          <h2 id="examples-heading" className="text-xl font-semibold">
            Or explore an example
          </h2>
          <p className="text-sm text-muted-foreground">
            Each one opens a finished recommendation. You can change any answer to make it your own.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((p) => (
            <li key={p.id}>
              <Link
                href={`/advisor?example=${p.id}`}
                className="flex h-full flex-col gap-1.5 rounded-xl border px-5 py-4 outline-none transition-colors hover:border-foreground/30 hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span className="font-medium leading-tight">{p.title}</span>
                <span className="text-sm text-muted-foreground">{p.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-heading" className="space-y-4">
        <h2 id="how-heading" className="text-xl font-semibold">
          How it works
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="space-y-2 rounded-xl bg-muted/50 p-5">
              <p className="text-sm font-medium text-muted-foreground">Step {i + 1}</p>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
