# Handoff: build session 1 → session 2

Last updated 2026-10-20. Read `CLAUDE.md` first (note the **commit identity rule**), then this file, then `docs/KICKOFF_PROMPT.md` for the full task. This file says what's already done so you don't redo it.

## Where things are
- **Branch:** `claude/peaceful-fermat-0prbs1` (kickoff said `build/phase-1-4`; see Q22). No PR yet.
- **Commits:** all authored as `Lochana Dahanayake <loch214@gmail.com>`, no Claude trailers (CLAUDE.md "Commits and pushes"). Set `git config user.name/user.email` in a fresh clone before committing.
- **Stack installed:** Next 16.4.2 (App Router, `cacheComponents: true`; read `node_modules/next/dist/docs/` before writing Next code, per `AGENTS.md`), React 19.3, Tailwind 4, Zod 4, Vitest 5, fast-check, Playwright 1.56 (matches the container's Chromium 1194 at `/opt/pw-browsers`; don't run `playwright install` locally), dependency-cruiser, Prettier, `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `server-only`.
- **Container network:** npm works; O'Reilly, ui.shadcn.com and most sites are blocked, and WebFetch fails. WebSearch works.

## Done
| Step | Status |
|---|---|
| Research Q14/Q15 + spot-checks | ✅ No KB value changed. Findings in `KNOWLEDGE_BASE_DRAFT.md` §8 items 4–9, sources §9, Q14/Q15 closed in `OPEN_QUESTIONS.md` |
| KB → JSON + Zod | ✅ `src/modules/knowledge-base/` (`data/*.json`, `schema.ts`, `integrity.ts`, `mentions.ts`, `index.ts`). KB v1.0.0 |
| Scoring engine | ✅ `src/modules/scoring/` (`engine.ts`, `weights.ts`, `conditions.ts`, `validate.ts`, `types.ts`). Pure, takes `kb` as a parameter |
| Tests | ✅ 114 passing: `tests/kb/` (schema, integrity, snapshot, release gate, mentions), `tests/scoring/` (unit, properties, 16 golden in `golden.ts`, worked examples A and B exact). Engine coverage 100% lines |
| Fitness functions | ✅ `.dependency-cruiser.cjs` (boundaries from ARCHITECTURE §6), ESLint purity rules for engine/KB/recommendation, `scripts/check-env-names.mjs` |
| CI file | ✅ written (`.github/workflows/ci.yml`), **not yet run** (it triggers on PRs and pushes to `main`) |
| Docs | ✅ updated: ROADMAP status, KB draft §8/§9, SCORING_ENGINE types, KB_SCHEMA "as implemented", TESTING_STRATEGY golden table, OPEN_QUESTIONS, README run instructions; lecture codes removed from RESEARCH.md |

## Still to do (in order)
1. **Fix CI gaps before opening the PR:** the CI file calls `npm run bundle:check`, which doesn't exist yet (write `scripts/check-bundle.mjs`, e.g. gzip total of `.next/static/chunks` against a budget, or drop the step and record why). The e2e job needs `playwright.config.ts` (webServer: `npm run start`, `AI_MODE=off`) plus at least one test. Run `npm run build` once; it hasn't been tried since the scaffold. `next/font/google` (Geist) needs fonts.googleapis.com (reachable now; swap to system fonts if the build fails).
2. **Phase 1 leftovers:** shadcn-style components in `src/components/ui/` (hand-write them: registry blocked; add `components.json` + `src/lib/utils.ts` `cn()` so `shadcn add` works later). ADR-001…007 in `docs/adr/` (list in ARCHITECTURE §9).
3. **Phase 3:** the form (UI_UX "Form"). Plan made in session 1, not built:
   - Form state: `attributes` holds only levels the user clicked (unset shows "Low"; this is what makes conflicts mean "you chose X but…"); drivers start unanswered; `useAi` checkbox kept outside `UserInput`.
   - Validation reuses `checkInput()` from the engine, with step-level messages. TECH_STACK lists React Hook Form; session 1 leaned towards plain React state + the engine's validator (fewer deps). Decide and record it.
   - Floor chips: export a helper from `scoring` that returns `floors[]` for partial input (unanswered drivers = "unsure").
   - Presets: Student project = G1, Startup MVP = G10, Event-heavy/IoT = G4, High-traffic ticketing = G3 (example B), Enterprise migration = G6, Growing SaaS = new (team 11–30, rapid growth, 5+ yrs, clear domains). Test that each preset passes `checkInput`.
4. **Phase 4:** results page + methodology page (UI_UX "Result layout"). Plan:
   - `src/modules/recommendation/`: `AdvisorResult` (ARCHITECTURE §7) built by a pure `buildResult(input, kb, { id, createdAt, appVersion })` (the caller passes `crypto.randomUUID()`/`new Date()`), plus `mentions` from `matchMentions` and `snapshot` of KB scores; `final[]` = rule scores with `aiDelta: 0`.
   - Put the `AiBlock` type in `recommendation` and add `"disabled"` to `ai.status` (= AI_MODE off: "AI not enabled yet"); `"skipped"` = user opted out. Document both in AI_INTEGRATION §10 and ARCHITECTURE §6 (ai → recommendation, types only).
   - Optional but clean: `src/app/api/explain/route.ts` that validates, recomputes the score server-side and returns `{ ai: { status: "disabled", adjustments: [] } }` when `AI_MODE=off` (no provider calls). `src/modules/platform/env.ts` (`import "server-only"`) reads `AI_MODE`.
   - Trade-off table from `snapshot`, never AI. JSON download. Glossary cards for mentions.
5. **Before finishing:** docs in sync, README, PR (summary, test results, research findings with sources, deviations, what the owner must do for Phase 5: Gemini key, Groq key, Upstash via Vercel Marketplace, Vercel project), final report.

## Deviations and decisions so far (already in the docs)
- Golden inputs were written by session 1 (the planning simulation didn't keep them); two sensitivities logged as Q20.
- All KB items are `reviewed: true` per Q2; ⚠ items carry `flagged: true` (Q21 asks the owner to look).
- Warnings are objects `{ code, message, ruleId? }`, not strings; conflicts only for explicitly set levels.
- `hosting` gained a "Not sure" option.
