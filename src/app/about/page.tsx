import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "What Architecture Advisor is, its limits, and how it treats your data.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What this is</h2>
        <p>
          A free tool that helps students and small teams choose a software architecture style. A rule engine built on
          published books and articles ranks the styles; the{" "}
          <Link href="/methodology" className="underline underline-offset-4">
            methodology page
          </Link>{" "}
          shows every number and rule it uses.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Privacy</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            No accounts and no personal data. Your answers stay in your browser (local storage) so a refresh keeps them.
          </li>
          <li>The rule-based result is calculated in your browser.</li>
          <li>
            AI explanations are not enabled yet. When they are, your answers and notes will be sent to Google Gemini or
            Groq only if you leave AI on, and you can turn it off for any request.
          </li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Limitations</h2>
        <p>
          The result is a starting point for a conversation, not a final answer. Architecture is about trade-offs, and
          your own context matters more than any general rating.
        </p>
      </section>
    </div>
  );
}
