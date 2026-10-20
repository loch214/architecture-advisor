# Kickoff prompt for the first cloud build session

Paste everything below the line into a new Claude Code (web) session with the repo `loch214/architecture-advisor` selected.

---

You're building **Architecture Advisor**, a free web app that recommends software architectural styles. Planning is finished; this session starts the build. Work autonomously, but follow the process below exactly.

## Step 1: Read before touching code
Read `CLAUDE.md` first (project rules), then in this order: `docs/PROJECT_OVERVIEW.md`, `docs/OPEN_QUESTIONS.md`, `docs/ROADMAP.md`, `docs/KNOWLEDGE_BASE_DRAFT.md`, `docs/KNOWLEDGE_BASE_SCHEMA.md`, `docs/SCORING_ENGINE.md`, `docs/TESTING_STRATEGY.md`, `docs/ARCHITECTURE.md`, `docs/TECH_STACK.md`, `docs/UI_UX.md`, `docs/REQUIREMENTS.md`. Skim `docs/AI_INTEGRATION.md` and `docs/RESEARCH.md` (the AI layer is *not* in this session's scope, but the result object and module boundaries must leave room for it). Then write a short plan of what you'll do in this session as a checklist in your first message, and start.

## Step 2: Research tasks (do these before building the knowledge base)
The owner has **no copies** of the reference books, so you must find information on the internet. Use web search and fetch primary or reputable sources, and compare several of them.
1. **Q14:** find published characteristic ratings for the **pipeline** and **orchestration-driven SOA** styles (Richards & Ford, *Fundamentals of Software Architecture*, 1st/2nd ed.). Try O'Reilly previews, the authors' talks/slides (developertoarchitecture.com, nealford.com), conference slides, reputable book summaries, and course notes that reproduce the figures. If you confirm values, update the KB draft and cite the source. If not, keep the current values marked as flagged estimates.
2. **Q15:** look for independent sources on **modular monolith** characteristics (author talks, articles, other books) and compare them with the R&F 2nd ed. ratings in the KB (Fig 11-7). Follow the book unless there's strong, cited evidence otherwise.
3. Spot-check the serverless, cell-based, peer-to-peer and edge scores and the rule values against current sources. Change anything only with a citation.
4. Record every finding in `docs/KNOWLEDGE_BASE_DRAFT.md` (sources §9, calibration log §8) and close or update Q14/Q15 in `docs/OPEN_QUESTIONS.md`.

**About course material:** the owner's university lecture notes were used during planning and are already distilled (paraphrased) into the docs. They're intentionally **not** in this repo, and they must **not** be credited, named or quoted anywhere public: code, docs, UI, commits or PRs. Cite only published books and articles.

**Browser:** Claude in Chrome is enabled. If the browser tools are available in your session, you may use them to read pages that `WebFetch` can't render and to check the running app's UI. Don't enter credentials, create accounts or accept terms on any site; if something needs that, note it in `docs/OPEN_QUESTIONS.md` for the owner.

## Step 3: Build: Phases 1 to 4 of `docs/ROADMAP.md`
Work on a branch named `build/phase-1-4`. Commit after each meaningful step, and push regularly so work isn't lost.
- **Phase 1:** scaffold Next.js (latest stable, App Router, TypeScript strict), Tailwind + shadcn/ui, Vitest, Playwright, ESLint/Prettier, dependency-cruiser, and a GitHub Actions CI workflow (lint, typecheck, test, fitness checks). Convert the KB draft to JSON + Zod schemas (styles, attributes, drivers, characteristics, rules, patterns, glossary with aliases). KB tests green, including the release gate.
- **Phase 2:** pure scoring engine exactly as in `SCORING_ENGINE.md`: floors, weighted average, rules interpreter (`modify`/`exclude`/`floor`/`note`, ±30 cap), tie-break, explanation data, input conflicts and warnings. Test first: unit, property-based (fast-check) and **all 16 golden scenarios** in `TESTING_STRATEGY.md`, plus the two worked examples, which must reproduce the documented numbers. If a golden scenario fails, investigate and reason about it; don't just change the expectation. Document any calibration change.
- **Phase 3:** 4-step form with presets, "Not sure" options, live floor chips, validation, local storage and accessibility, as in `UI_UX.md`.
- **Phase 4:** rules-only results page: ranked list, "why this score", KB-built trade-off table, excluded styles, rule effects, conflicts, companion patterns, glossary cards for alias matches in the notes, methodology page, JSON download. With `AI_MODE=off`, the AI panel shows the "AI not enabled yet" state.

**Out of scope for this session:** Phase 5 (AI layer, Upstash) and deployment. They need API keys and accounts the owner will set up. Build the `ai` module boundary and the result-object fields so Phase 5 slots in cleanly, but make no provider calls.

## Step 4: Quality bar
- Lint, typecheck and all tests pass locally and in CI before you finish. Engine coverage ≥ 95%.
- Fitness functions enforced (the engine imports nothing outside the knowledge base; no server-only code in client bundles).
- Write ADR-001 to ADR-007 in `docs/adr/` (listed in `ARCHITECTURE.md` §9).
- Code reads cleanly: small modules, clear names, comments only where intent isn't obvious.

## Step 5: Before you finish
1. Update every affected doc so the docs match the code: roadmap status with ticks, KB calibration log, decisions, new open questions, and any deviation from the plan with the reason.
2. Update `README.md` with how to run, test and build locally.
3. Open a PR from `build/phase-1-4` to `main` with a summary of what was built, test results, research findings (with sources), deviations, and what's needed from the owner for Phase 5 (Gemini API key, Groq API key, Upstash via Vercel Marketplace, Vercel project).
4. Give a short final report in chat with the same points.
