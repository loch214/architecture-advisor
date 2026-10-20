# UI / UX

Principles: plain language first, jargon explained inline (tooltips with a one-line definition + example); progressive disclosure (simple by default, "advanced" sections expandable); never hide the reasoning; accessible (WCAG AA, keyboard-only usable, no colour-only meaning).

## Pages (v1)
| Route | Purpose |
|---|---|
| `/` | Landing: what it does (3 steps), sample result screenshot, "Start", "How it works" link, honest note: "Rule-based scores + AI explanation; not a substitute for your judgement" |
| `/advisor` | The form (stepper) and the result on the same page (result replaces form; "Edit answers" goes back with state kept) |
| `/methodology` | How scoring works: formula, levels, rules, sources, what's general knowledge. Generated from KB data. Builds trust and is great for a portfolio |
| `/styles` + `/styles/[id]` | *(v1.1)* Browsable catalog of styles, scores and patterns from the KB |
| `/about` | Project, author, limitations, privacy |

## Form: 4-step stepper
Progress bar at the top. Each step fits one screen on desktop. State is kept in the URL hash or `localStorage` so a refresh doesn't lose answers.

**Step 0 (optional): Start from an example.** Preset cards: *Student project*, *Startup MVP*, *Growing SaaS*, *Event-heavy / IoT*, *High-traffic ticketing*, *Enterprise migration*. Picking one pre-fills everything (editable). "Start blank" is equally visible.

**Step 1: Your project & team (business drivers)**
Radio groups (segmented buttons), all required, each with a "Not sure" option:
time to market · budget · team size · team experience with distributed systems/DevOps · expected growth · expected lifespan · how often requirements change. One-line helper text under each label.

**Step 2: What matters most (quality attributes)**
- Row per attribute: name, plain one-liner, ⓘ tooltip (definition + example scenario), segmented control **Not needed / Low / Medium / High / Critical**. Default **Low**.
- 10 attributes shown; "Show more attributes" reveals elasticity, evolvability, modularity.
- Live hint: "Tip: pick at most 3 Critical. Real architectures can't maximise everything." Turns amber at 4+.
- Live "implied by your answers" chips: e.g. a "Scalability ≥ Medium (from: rapid growth)" chip next to the row, so floors are visible *before* submitting.
- Validation: at least one High or Critical.

**Step 3: Your system's shape & constraints**
- Checkbox cards for workload characteristics (async events, spiky load, sequential processing, plug-ins, strict workflow, steady heavy load, blast radius, device-to-device sharing, on-site/edge processing, mostly-technical changes, parts with very different needs, several frontend teams) with a small example under each. Rare ones sit under "More situations".
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
\* Copy link (shareable URL with input encoded) is a v1 "should"; see REQUIREMENTS.

Details:
- **Score display:** each style row shows `rule score`, an `AI ±n` pill when adjusted (with hover/tap reason), and the final score. Bars use the final score; a thin marker shows the rule score.
- **"Why this score?"**: stacked bar of attribute contributions + list of rules that fired for that style.
- **Trade-off table:** top 3 by default (toggle to 4–5), columns = styles, rows = user's highest-weighted attributes first. Stars + numeric value for screen readers. Cost also shown as $–$$$$$. Entirely from KB.
- **Draft badge:** while any KB value is unreviewed (dev builds only).

## States
| State | Behaviour |
|---|---|
| Empty (first visit) | Landing / step 0 presets |
| Form invalid | Inline message under the field + summary at the step top; Next disabled with reason |
| Computing rules | Effectively instant; no spinner |
| AI loading | Explanation panel shows skeleton lines + "Writing an explanation… (usually 3–10 s)". Rest of the result fully usable |
| AI ok | Panel fills in; scores animate to adjusted values; "AI changed the order" banner if #1 changed |
| AI unavailable | Neutral info box (not red): "AI explanation isn't available right now. Your ranking is complete and comes from our rule engine." + Retry |
| Rate limited | Same style: "You've hit the AI limit for now (resets in ~X min). Rule-based results still work." |
| Network offline | Rules still work (they run in the browser); AI panel says offline |
| Unexpected error | Friendly message + "Try again"; result object is never lost (kept in state/localStorage) |

## As built (session 2): deviations from the plan above
- **ⓘ help** is an inline expandable panel (button with `aria-expanded`), not a hover tooltip: it works on touch and keyboard and avoids shipping a positioning library (the popover version pushed `/advisor` over its bundle budget).
- **Next is never disabled.** A disabled button can't be focused or explain itself, so Next stays enabled; pressing it on an invalid step shows the summary at the top of the step (focused) plus inline messages.
- **Picking a preset** opens step 4 (review) so the user can submit at once or edit any step.
- The result view loads lazily after submit; "Edit answers" returns to the review step; "Start over" clears saved answers. The last result is kept in local storage.
- An unset attribute shows "Low" selected; clicking Low again doesn't record an explicit choice (same weight, only conflict wording differs).
- `/about` holds the privacy notes; a separate privacy page waits for Phase 5/6.
- Flagged estimates show as `≈` in the trade-off table and the methodology matrix (Q21).

## Copy tone
Short, friendly, second person. Explain terms once: e.g. "Elasticity: scaling up *and back down* quickly when traffic spikes." No hype words ("revolutionary", "AI-powered magic").
