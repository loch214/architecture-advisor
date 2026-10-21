import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Architecture Advisor sends where, what it keeps, and the AI providers' terms.",
};

const providers = [
  {
    name: "Google Gemini API",
    role: "Writes the AI explanation (first choice).",
    note: "We use the free tier. Google's terms say free-tier prompts and replies may be used to improve Google's products and may be read by human reviewers, and ask you not to send sensitive, confidential or personal information.",
    links: [
      { label: "Gemini API Additional Terms", href: "https://ai.google.dev/gemini-api/terms" },
      { label: "Google Privacy Policy", href: "https://policies.google.com/privacy" },
    ],
  },
  {
    name: "Groq (GroqCloud)",
    role: "Writes the AI explanation when Gemini is busy or down (backup).",
    note: "Groq's documentation says it doesn't keep the text of API requests by default, apart from a few listed cases. Read their pages for the details.",
    links: [
      { label: "Your data in GroqCloud", href: "https://console.groq.com/docs/your-data" },
      { label: "Groq Services Agreement", href: "https://console.groq.com/docs/legal/services-agreement" },
      { label: "Groq Privacy Policy", href: "https://groq.com/privacy" },
    ],
  },
  {
    name: "Vercel",
    role: "Hosts the website.",
    note: "Like any web host, Vercel handles your requests and may keep standard technical logs (for example, IP addresses) under its own policy.",
    links: [{ label: "Vercel Privacy Policy", href: "https://vercel.com/legal/privacy-policy" }],
  },
];

const link = "underline underline-offset-4";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
        <p className="text-muted-foreground">
          Short version: no accounts, no tracking, and AI is optional. Here is exactly what goes where.
        </p>
      </div>

      <section aria-labelledby="stays" className="space-y-2">
        <h2 id="stays" className="text-xl font-semibold">
          What stays in your browser
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Your answers and your last result are saved in your browser&apos;s local storage, so a refresh doesn&apos;t
            lose them. &quot;Start over&quot; deletes them.
          </li>
          <li>The rule-based ranking is calculated in your browser. It needs no server and no AI.</li>
          <li>
            &quot;Copy link&quot; puts your answers (not your notes) in the part of the link after the &quot;#&quot;.
            Browsers don&apos;t send that part to our server, but anyone you give the link to can see the answers.
          </li>
          <li>We don&apos;t use cookies, accounts or analytics.</li>
        </ul>
      </section>

      <section aria-labelledby="ai" className="space-y-2">
        <h2 id="ai" className="text-xl font-semibold">
          What is sent when AI is on
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Your answers and your notes go to our server, which sends them to an AI provider (below) to write the
            explanation. Nothing that identifies you (name, IP address, cookies) goes into the AI request.
          </li>
          <li>
            Before sending, we mask obvious emails, phone numbers, web links with tokens and long key-like strings. This
            catches common mistakes but isn&apos;t a guarantee, so please don&apos;t type passwords, personal or
            confidential details into the notes.
          </li>
          <li>
            To turn AI off for a request, tick &quot;Don&apos;t use AI for this request&quot; on the last step. Then
            nothing is sent anywhere.
          </li>
        </ul>
      </section>

      <section aria-labelledby="kept" className="space-y-2">
        <h2 id="kept" className="text-xl font-semibold">
          What our server keeps
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            We don&apos;t log your notes or the AI&apos;s text. Logs hold only which provider answered, how long it took
            and whether it worked.
          </li>
          <li>
            To save free AI quota, AI answers are cached for up to 30 days, together with the words of your masked notes
            (not the notes as written), so a very similar request can reuse or adapt an earlier answer.
          </li>
          <li>
            To stop abuse, we count requests per visitor using a one-way hash of the IP address, never the address
            itself.
          </li>
        </ul>
      </section>

      <section aria-labelledby="providers" className="space-y-4">
        <h2 id="providers" className="text-xl font-semibold">
          Services we use and their terms
        </h2>
        {providers.map((p) => (
          <div key={p.name} className="space-y-1 rounded-lg border p-4">
            <h3 className="font-medium">{p.name}</h3>
            <p className="text-sm">{p.role}</p>
            <p className="text-sm text-muted-foreground">{p.note}</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {p.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={link} target="_blank" rel="noopener noreferrer">
                    {l.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="text-sm text-muted-foreground">
          Summaries checked in October 2026. The providers can change their terms; their own pages are what counts.
        </p>
      </section>

      <p>
        The code is public on{" "}
        <a href="https://github.com/loch214/architecture-advisor" className={link}>
          GitHub
        </a>
        , so you can check all of this yourself. More about the project is on the{" "}
        <Link href="/about" className={link}>
          about page
        </Link>
        .
      </p>
    </div>
  );
}
