# Roadmap

Each phase ends with something demonstrable. The app is deployable from phase 4 onwards (rules-only), so it's never "all or nothing".

## Phase 0: Planning ✅ (this set of docs)
Done locally 2026-10-21. Building continues in **Claude Code on the web** (cloud session) on repo `loch214/architecture-advisor`, starting from `docs/KICKOFF_PROMPT.md`. First cloud session scope: research tasks + Phases 1–4 (rules-only app, not deployed). Phase 5 needs owner-provided API keys; deployment needs the owner's Vercel account.

## Build status (updated 2026-10-20, end of build session 2)
Phases 1–4 are built (rules-only app, not deployed). Work is on branch `build/phase-1-4` (Q22). Handoff for the next session: `docs/HANDOFF.md`.

## Phase 1: Knowledge base finalised ✅
- ✅ Research for Q14/Q15 + spot-checks (KB draft §8)
- ✅ `.gitignore` has `lectures/` and `docs/private/`
- ✅ Next.js 16.4 scaffold (App Router, TS strict), Tailwind 4, Vitest, ESLint + Prettier, dependency-cruiser, CI workflow file
- ✅ KB → JSON + Zod (`src/modules/knowledge-base/`), integrity checks, score-matrix snapshot, release gate: green
- ✅ shadcn-style components hand-written in `src/components/ui/` (registry unreachable from the container); `components.json` + `cn()` so `shadcn add` works later
- ✅ Playwright config + e2e tests; `bundle:check` script (200 KB gz per page)
- ✅ CI first runs on the PR from `build/phase-1-4`
- ✅ ADR-001…007 in `docs/adr/`
- KB draft v2 already reviewed and calibrated by Claude; owner can override any value (optional).
- Approve golden scenarios (TESTING_STRATEGY §2).
- Before the first commit: `.gitignore` must contain `lectures/` and `docs/private/` (course material stays private; public repo cites books only).
- Convert to JSON + Zod schemas (incl. aliases + glossary); KB tests green.
- Write ADR-001…007.
**Milestone:** KB v1.0.0 merged; repo scaffolded; CI running lint/typecheck/KB tests.

## Phase 2: Rule engine ✅
- Weights + floors, base score, rules interpreter, ordering, explanation data.
- Unit, property and golden tests; dependency-cruiser fitness function.
**Milestone:** `score()` passes all golden scenarios, ≥ 95% coverage. A tiny CLI/test prints results for the presets.
✅ Done: `src/modules/scoring/`, 114 tests (unit, fast-check properties, 16 golden, worked examples A and B exact), 100% line coverage on the engine; `npm run golden:print` prints the top 5 per scenario. Fitness: dependency-cruiser boundaries + ESLint purity rules (no `Date`, `Math.random`, `fetch`, browser globals in engine/KB/recommendation).

## Phase 3: Input form ✅
- 4-step form, presets, floors chips, validation, local storage, accessibility.
**Milestone:** form produces a valid `UserInput` for every preset; Playwright validation test passes.
✅ Done in session 2: presets tied to golden scenarios, live floor chips (`previewFloors`), per-step validation from the engine, local storage, axe-checked on desktop and mobile. Deviations in UI_UX "As built".

## Phase 4: Results page (rules only) + first deploy 🚀 🟡 (built; deploy needs the owner)
- Ranked list, "why this score", trade-off table from KB, excluded styles, patterns, methodology page, JSON download.
- Deploy to Vercel (`AI_MODE=off`).
**Milestone:** public URL that gives useful, explainable recommendations with no AI. Share with a few classmates for feedback.
✅ Built in session 2: result page (ranked list, why this score, KB trade-off table, adjustments, conflicts, excluded, patterns, mentions, how calculated, JSON download, print), `/methodology` and `/about`, `/api/explain` returning `disabled` with `AI_MODE=off`. ⬜ Vercel deploy (owner's account).

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
