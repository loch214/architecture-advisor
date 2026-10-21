# UI / UX

Principles: plain language first, jargon explained inline (tooltips with a one-line definition + example); progressive disclosure (simple by default, "advanced" sections expandable); never hide the reasoning; accessible (WCAG AA, keyboard-only usable, no colour-only meaning).

## Pages (v1)
| Route | Purpose |
|---|---|
| `/` | Landing: one main button **"Start a new recommendation"** (`/advisor?new`, always a blank form), then **"Or explore an example"** with the six example cards (`/advisor?example=<id>`, secondary), then "How it works" in 3 steps. The honest note lives in the footer |
| `/advisor` | The form (stepper) and the result on the same page (result replaces form; "Edit answers" goes back with state kept). Opens straight on a blank step 1 |
| `/methodology` | How scoring works: formula, levels, rules, sources, what's general knowledge. Generated from KB data. Builds trust and is great for a portfolio |
| `/styles` + `/styles/[id]` | *(v1.1)* Browsable catalog of styles, scores and patterns from the KB |
| `/about` | Project, author, limitations, short privacy summary |
| `/privacy` | What is sent where and what is kept; the AI providers and host with links to their terms (AI_INTEGRATION §9.6). Linked from the notes notice, `/about` and the footer |

## Form: 4-step stepper
Progress bar at the top, with **Start over** (inline "Clear all answers?" confirm, no browser dialog) once anything is answered. Each step fits one screen on desktop. Answers are kept in **session storage**: a refresh in the same tab keeps them, but a new visit or a new tab always starts blank, so nobody lands on someone else's half-filled form (owner decision, 2026-10-21).

**Examples (not a step):** six example cards on the landing page: *Student project*, *Desktop IDE with plug-ins*, *Growing SaaS*, *Event-heavy / IoT*, *High-traffic ticketing*, *Enterprise migration*. Each mirrors a golden scenario. Opening one shows its result straight away with an "Example: …" box offering **Start my own** and **Edit these answers**. Step 1 also links to them ("Open an example").

**Step 1: Your project & team (business drivers)**
Radio groups, all required, each with a "Not sure" option. The first two are **radio cards** (label plus an example under every option, two columns on desktop); the rest are segmented buttons:
**where will your software run?** (on our server, used in a web browser · on our server, plus an app people download · only on the user's own device) · **do all parts need the same qualities?** (the book's "one quantum or several" question, in plain words) · time to market · budget · team size · team experience with distributed systems/DevOps · expected growth · expected lifespan · how often requirements change. One-line helper text under each label.

**Step 2: What matters most (quality attributes)**
- Row per attribute: name, plain one-liner, ⓘ tooltip (definition + example scenario), segmented control **Not needed / Low / Medium / High / Critical**. Default **Low**.
- 10 attributes shown; "Show more attributes" reveals elasticity, evolvability, modularity.
- Live hint: "Tip: pick at most 3 Critical. Real architectures can't maximise everything." Turns amber at 4+.
- Live "implied by your answers" chips: e.g. a "Scalability ≥ Medium (from: rapid growth)" chip next to the row, so floors are visible *before* submitting.
- Validation: at least one High or Critical.

**Step 3: Your system's shape & constraints**
- Checkbox cards for workload characteristics (async events, spiky load, sequential processing, plug-ins, strict workflow, steady heavy load, blast radius, device-to-device sharing, on-site/edge processing, mostly-technical changes, several frontend teams) with a small example under each. Rare ones sit under "More situations".
- "Does it split into clear business areas?" Yes / No / Not sure.
- Constraints: hosting (3 options), avoid lock-in, strict ACID, legacy migration, regulated data.

**Step 4: Anything else? + review**
- Textarea "Anything else we should know?" (placeholder with examples), live counter `0/1000`.
- Privacy line under it, plus a checkbox "Don't use AI for this request" (see `AI_INTEGRATION.md` §9).
- Compact review summary of all answers with "edit" links per step.
- **Get recommendation** button.

Mobile: same steps, stacked; segmented controls become full-width radio lists.

## Result layout
```
┌──────────────────────────────────────────────────────────────┐
│ Top recommendation: Modular monolith      [Good fit · 64.1]  │
│ Rule score 64.1 · AI adjustment 0 · Final 64.1               │
│ "One deployable app split into strict domain modules…"       │
│ [Edit answers] [Copy link*] [Download JSON] [Print]          │
├──────────────────────────────┬───────────────────────────────┤
│ Ranked styles                │ AI explanation                │
│ 1 Modular monolith ████ 64.1 │ Summary…                      │
│ 2 Service-based    ███▌ 60.2 │ Why the top pick…             │
│ 3 Serverless       ███▍ 57.0 │ Why others ranked lower…      │
│ … (expand to all)            │ Watch out for… (cautions)     │
│ ▸ Why this score? (per style)│ small print: by Gemini        │
├──────────────────────────────┴───────────────────────────────┤
│ Trade-off comparison (from knowledge base)                   │
│            | Modular mono | Service-based | Serverless       │
│ Simplicity |  ★★★★★       |  ★★★          |  ★★★             │
│ Low cost   |  ★★★★★       |  ★★★★         |  ★★★★            │
│ …user's top attributes first, then the rest (collapsible)    │
│ Strengths / Weaknesses / Good when / Avoid when rows         │
├──────────────────────────────────────────────────────────────┤
│ Adjustments made: rules fired · AI adjustments with reasons  │
│ Input conflicts: "You said scalability Low but…"             │
│ Not recommended: Serverless, excluded because on-prem only   │
│ Commonly used patterns with the top pick: MVC, Strangler Fig │
│ You mentioned: "CQRS" → info card (pattern, not a style…)    │
│ Note: parts differ a lot → consider a hybrid                 │
│ ▸ How this was calculated (weights table, formula link)      │
└──────────────────────────────────────────────────────────────┘
```
\* Copy link (shareable URL with input encoded) is a v1 "should"; see REQUIREMENTS. Built in session 5 (see "As built (session 5)").

Details:
- **Score display:** each style row shows `rule score`, an `AI ±n` pill when adjusted (with hover/tap reason), and the final score. Bars use the final score; a thin marker shows the rule score.
- **"Why this score?"**: stacked bar of attribute contributions + list of rules that fired for that style.
- **Trade-off table:** top 3 by default (toggle to 4–5), columns = styles, rows = user's highest-weighted attributes first. Stars + numeric value for screen readers. Cost also shown as $–$$$$$. Entirely from KB.
- **Draft badge:** while any KB value is unreviewed (dev builds only).

## States
| State | Behaviour |
|---|---|
| Empty (first visit) | Landing; `/advisor` opens a blank step 1 |
| Form invalid | Inline message under the field + summary at the step top; Next disabled with reason |
| Computing rules | Effectively instant; no spinner |
| AI loading | Explanation panel shows skeleton lines + "Writing an explanation… (usually 3–10 s)". Rest of the result fully usable |
| AI ok | Panel fills in; scores animate to adjusted values; "AI changed the order" banner if #1 changed |
| AI unavailable | Neutral info box (not red): "AI explanation isn't available right now. Your ranking is complete and comes from our rule engine." + Retry |
| Rate limited | Same style: "You've hit the AI limit for now (resets in ~X min). Rule-based results still work." |
| Network offline | Rules still work (they run in the browser); AI panel says offline |
| Unexpected error | Friendly message + "Try again"; result object is never lost (kept in state/session storage) |

## As built (session 2): deviations from the plan above
- **ⓘ help** is an inline expandable panel (button with `aria-expanded`), not a hover tooltip: it works on touch and keyboard and avoids shipping a positioning library (the popover version pushed `/advisor` over its bundle budget).
- **Next is never disabled.** A disabled button can't be focused or explain itself, so Next stays enabled; pressing it on an invalid step shows the summary at the top of the step (focused) plus inline messages.
- **Picking a preset** opens step 4 (review) so the user can submit at once or edit any step.
- The result view loads lazily after submit; "Edit answers" returns to the review step; "Start over" clears saved answers. The last result is kept in local storage.
- An unset attribute shows "Low" selected; clicking Low again doesn't record an explicit choice (same weight, only conflict wording differs).
- Flagged estimates show as `≈` in the trade-off table and the methodology matrix (Q21).

## As built (session 4, Phase 6)
- **"AI changed the order" banner:** a neutral info box under the header when the AI's #1 differs from the rule engine's (`topPickChange()` in `recommendation`), naming both styles. Not shown while the AI is loading. Score bars animate to the adjusted width (off with `prefers-reduced-motion`). Check it locally with `AI_MODE=mock AI_MOCK=reorder` and a share link to golden G10 (the Startup MVP preset was replaced in v1.1).
- **States checked:** loading skeleton, ok, reused/adapted note, unavailable + Retry, rate limited, disabled and skipped all render in the AI panel; ok, unavailable and reorder are covered by e2e with `AI_MODE=mock`. A refresh while the AI is loading shows "isn't available right now" + Retry (the pending request isn't resumed), which is acceptable. The rate-limited message doesn't show a reset time yet ("resets in ~X min" in the table above).
- **`/privacy`** page added; the footer links to it.
- **Accessibility pass:** `Alert` no longer defaults to `role="alert"` (a result page used to fire several assertive announcements); only the form's error summary keeps it. A polite, screen-reader-only live region on the result says when the AI part settles ("AI explanation ready." / the status title, plus "AI changed the order."). The light-mode info colour is darker (`oklch(0.5 0.14 255)`) so the "AI ±n" badge passes 4.5:1. Preset cards use spans inside the button instead of a Card's div/h3/p (invalid inside a button, and it skipped a heading level). axe now also runs on `/about`, `/privacy` and the AI result states.
- **Lighthouse (local production build, 2026-10-20):** `/`, `/advisor`, `/about`, `/privacy` score 99–100 on performance, 100 on accessibility, best practices and SEO; `/methodology` 96 performance. Re-run on the deployed site.
- **Copy:** the landing page defines "quality attributes"; the "Adjustments made" description no longer says "base scores"; the landing button reads "Start the advisor".

## As built (session 5, Phase 6): shareable link
- **Format:** `/advisor#a=<base64url JSON>` holding `{ v: 1, a: attributes, d: drivers, c: characteristics }` by KB id (`src/components/form/share-link.ts`). About 450 characters for a preset. The hash never reaches the server. **Notes are not included** (Q29), and the AI opt-out isn't either: the person opening the link gets the default (AI on) and can still opt out.
- **Opening a link:** it wins over local storage. The answers are cleaned with the same KB filter as saved answers (`sanitiseForm`) and checked with the engine's `checkInput`. All valid → the result shows straight away and the AI is requested as usual. Some answers dropped or missing (the KB changed) → the form opens at the first step that needs fixing, with a "Some answers in that link need checking" notice. Unreadable or unknown version → the start screen with "We couldn't open that link". The hash is then removed from the address bar, so a refresh uses the saved copy. Pasting a link while `/advisor` is already open works too (`hashchange`).
- **Copy link button:** between "Edit answers" and "Download JSON". It turns into "Link copied" (also announced politely), with a line under the buttons: "Anyone with the link sees this rule-based result; the AI explanation is fetched again", plus "Your notes are not included in the link" when there were notes. If the browser blocks the clipboard, a read-only field shows the link to copy by hand.
- **Bundle:** `/advisor` 187.5 KB gz (was 186.5).

## As built (launch, session 6): live site
- **URL:** https://architecture-advisor-pink.vercel.app (Vercel Hobby, `AI_MODE=live`, auto-redeploy from `main`).
- **Smoke test (2026-10-21), all passed:** `/`, `/advisor`, `/methodology`, `/about`, `/privacy` return 200. Rules-only path: High-traffic ticketing preset → Space-based architecture, ranked list and trade-off table shown. AI ok: Startup MVP → "Explanation by Google Gemini." in ~2.6 s. The very first AI call after the deploy hit Gemini's 10 s timeout (cold start) and Groq answered instead ("Explanation by Groq.", ~12 s in total), which is the fallback working as designed. AI opt-out: "AI turned off for this request", nothing sent. Copy link: opened in a new tab, same top pick (Service-based architecture) with a fresh Gemini explanation.
- **Lighthouse 12.8.2 on production** (performance / accessibility / best practices / SEO). Run from the owner's Windows PC with Edge (Chrome isn't installed), default simulated throttling:

| Page | Mobile | Desktop |
|---|---|---|
| `/` | 80 / 100 / 100 / 100 | 97 / 100 / 100 / 100 |
| `/advisor` | 81 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| `/methodology` | 91 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| `/about` | 95 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| `/privacy` | 93 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |

  Mobile performance is the median of 3 runs for `/` (77–87) and `/advisor` (79–90), one run elsewhere. LCP 1.2–2.3 s and CLS ≈ 0 everywhere; what costs points is total blocking time (300–800 ms, the main thread busy running JavaScript), which swings a lot with this PC's CPU load. Session 4's run (a production build inside the cloud container) scored 96–100, so treat the mobile numbers as a range, not a regression. If mobile performance matters later, the lever is less client JavaScript at start-up (hydration), not images or layout.
- **Screenshots:** `docs/screenshots/` (landing, form step, result with the AI explanation, trade-off table), taken from the live site by `node scripts/screenshots.mjs` with Playwright's `msedge` channel, so nothing is downloaded.

## As built (v1.1, 2026-10-21): owner feedback on flow and results
The owner found the flow confusing (examples first, no way to start fresh on `/advisor`, old answers reappearing) and the AI text messy. Changes:
- **Flow:** the start screen with preset cards is gone. `/advisor` opens on a blank step 1. The landing page's main button goes to `/advisor?new` (clears this tab's saved answers); the six examples are a secondary section below it and open their result directly. `?new` and `?example=` are read once and removed from the address bar. A broken share link now opens a blank step 1 with its notice.
- **Storage:** answers and the last result moved from local storage to session storage (see Form). Any copies left in local storage by v1.0 are deleted on Start over.
- **Start over** is on every form step (once something is answered) and is a full button on the result, next to "Edit answers".
- **Result page order:** top pick → **"Why <style> fits your project"** (plain sentences built by `plainReasons()` from the rule result: rules that favoured it, the priorities it rates well on, the trade-off, why not #2, and what was ruled out and why) → notes/conflicts → **"In plain words (AI)"** → all styles ranked → trade-off table → patterns → "You mentioned". "Adjustments made", "Not recommended" and "How this was calculated" sit together under one collapsed **"Full scoring details"**. The rule/AI score line only shows when the AI changed the top pick's score.
- **AI panel:** a short summary in larger text, then "Why <style>", "Why the others rank lower" and "Watch out for" as headed blocks. The prompt (v2) asks for a summary tied to the user's answers instead of a list of definitions (AI_INTEGRATION §3).
- **"AI changed the order"** is checked in e2e with a share link to golden G10 (a tie), since the Startup MVP example was replaced by the desktop IDE.

## As built (v1.2, 2026-10-21): clearer step 1
- **Owner report:** "Installed app (desktop or mobile)" was picked for a web app with a mobile view, because of the word *mobile*. The question is now **"Where will your software run?"** and each option shows its example on screen ("People on phones open it in their browser"; "A mobile or desktop app (e.g. from an app store) that talks to our server"; "e.g. a text editor, a photo editor or an offline game"). "Do all parts need the same qualities?" got the same treatment and a help line defining "qualities". Option ids are unchanged, so old share links still work.
- **Radio cards:** a KB driver option may carry a `description`; a question whose options have one is drawn as cards (`RadioCard` in `components/ui/radio-group.tsx`) instead of the segmented control. The label is the accessible name and the example the accessible description. The chosen card gets a primary border and inset ring (an inset ring, so the keyboard focus ring still shows).
- **Contradiction warning:** "only on the user's device" + "parts need very different things" shows rule warning N5 on the result (KNOWLEDGE_BASE_DRAFT §7), in the same warning box as N3.
- **Bundle:** `/advisor` 189.7 KB gz (was 187.5).

## Copy tone
Short, friendly, second person. Explain terms once: e.g. "Elasticity: scaling up *and back down* quickly when traffic spikes." No hype words ("revolutionary", "AI-powered magic").
