# Roadmap

Each phase ends with something demonstrable. The app is deployable from phase 4 onwards (rules-only), so it's never "all or nothing".

## Phase 0: Planning ✅ (this set of docs)
Done locally 2026-10-21. Building continues in **Claude Code on the web** (cloud session) on repo `loch214/architecture-advisor`, starting from `docs/KICKOFF_PROMPT.md`. First cloud session scope: research tasks + Phases 1–4 (rules-only app, not deployed). Phase 5 needs owner-provided API keys; deployment needs the owner's Vercel account.

## Phase 1: Knowledge base finalised
- KB draft v2 already reviewed and calibrated by Claude; owner can override any value (optional).
- Approve golden scenarios (TESTING_STRATEGY §2).
- Before the first commit: `.gitignore` must contain `lectures/` and `docs/private/` (course material stays private; public repo cites books only).
- Convert to JSON + Zod schemas (incl. aliases + glossary); KB tests green.
- Write ADR-001…007.
**Milestone:** KB v1.0.0 merged; repo scaffolded; CI running lint/typecheck/KB tests.

## Phase 2: Rule engine
- Weights + floors, base score, rules interpreter, ordering, explanation data.
- Unit, property and golden tests; dependency-cruiser fitness function.
**Milestone:** `score()` passes all golden scenarios, ≥ 95% coverage. A tiny CLI/test prints results for the presets.

## Phase 3: Input form
- 4-step form, presets, floors chips, validation, local storage, accessibility.
**Milestone:** form produces a valid `UserInput` for every preset; Playwright validation test passes.

## Phase 4: Results page (rules only) + first deploy 🚀
- Ranked list, "why this score", trade-off table from KB, excluded styles, patterns, methodology page, JSON download.
- Deploy to Vercel (`AI_MODE=off`).
**Milestone:** public URL that gives useful, explainable recommendations with no AI. Share with a few classmates for feedback.

## Phase 5: AI layer
- `/api/explain`, prompt builder, glossary matching, redaction, provider adapters (Gemini 3.5 Flash-Lite, Groq), chain with timeouts and breaker, Zod + consistency validation, repair retry.
- Owner: get a Gemini API key (AI Studio) and a Groq key; add Upstash through the Vercel Marketplace (one click, env vars injected).
- Upstash cache + rate limits + global budget.
- Mock mode, AI tests, `eval:ai` script; tune prompt.
**Milestone:** AI explanations live with fallback proven by tests (and by temporarily disabling a key in preview).

## Phase 6: Polish and launch
- Loading/fallback states, AI-changed-order banner, shareable link, copy review, a11y audit, Lighthouse, README with architecture diagrams and ADRs, screenshots/GIF for the portfolio.
- Simple privacy page; optional privacy-friendly analytics (Vercel Web Analytics, free tier).
**Milestone:** v1.0 launch.

## Phase 7 (future): Accounts and history
- Supabase Auth + Postgres; `results` table storing `AdvisorResult` JSON; history list; delete.
**Milestone:** logged-in users can save and reopen results; anonymous flow unchanged.

## Later ideas
Tactics per attribute (Bass et al.) · ADR export · QA-scenario builder · what-if sliders · style catalog pages · feedback loop to tune KB · more styles (micro-frontends) · i18n.

## Rough effort (solo, part-time)
| Phase | Estimate |
|---|---|
| 1 | 2–3 days |
| 2 | 4–6 days |
| 3 | 4–6 days |
| 4 | 4–6 days |
| 5 | 5–8 days |
| 6 | 4–6 days |
