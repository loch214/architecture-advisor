# Architecture Advisor: instructions for Claude

A free web app that recommends software architectural styles. A deterministic rule engine does the ranking; a free-tier LLM adds bounded score adjustments (±5) and a plain-language explanation. The plan lives in `docs/`. Read it before changing anything.

## Read before working

1. `docs/PROJECT_OVERVIEW.md`: goals and non-goals
2. `docs/OPEN_QUESTIONS.md`: decisions made and tasks still open (some are delegated to you)
3. `docs/ROADMAP.md`: phases and milestones
4. Then the docs for the phase you're on:
   - KB: `KNOWLEDGE_BASE_DRAFT.md`, `KNOWLEDGE_BASE_SCHEMA.md`
   - Engine: `SCORING_ENGINE.md`, `TESTING_STRATEGY.md`
   - UI: `UI_UX.md`, `REQUIREMENTS.md`
   - AI: `AI_INTEGRATION.md`
   - Structure: `ARCHITECTURE.md`, `TECH_STACK.md`

## Hard rules

- **The docs are the spec.** If code and docs disagree, fix one deliberately and record why. When you finish a piece of work, update the affected docs (status, decisions, calibration log, open questions). Never leave them stale.
- **Rule engine stays pure:** no network, no clock, no randomness, no React/Next imports. The same input must always give the same output.
- **The AI never builds the trade-off table** and never decides the ranking structure. The app must work fully with AI turned off.
- **API keys are server-only.** Never `NEXT_PUBLIC_`.
- **Free tiers only.** No paid services or keys.
- **Don't invent knowledge-base facts.** Every score and rule needs a source tag (`book:`, `ref:`, `GK`, `DESIGN`). If you change a score, cite where the new value comes from and add a line to the calibration log (`KNOWLEDGE_BASE_DRAFT.md` §8). Golden scenarios (`TESTING_STRATEGY.md`) must keep passing. If one breaks, stop and reason about whether the change or the expectation is wrong.
- **Research before guessing.** When information is missing or may be outdated (ratings, provider limits, model IDs, library APIs), search the web and fetch primary sources. The owner has no copies of the reference books, so find the information online and compare several sources.
- **Course material is private.** The owner's university lecture notes informed the KB but are **not** in this repo and must not be credited or quoted publicly. Cite published books and articles only (e.g. Richards & Ford, _Fundamentals of Software Architecture_, 2nd ed.). Never add lecture files or lecture references to the repo.
- **Ask, don't guess, on product decisions.** Add the question to `docs/OPEN_QUESTIONS.md` and keep working on whatever isn't blocked.

## Commits and pushes (important)

- Commit and push **only as the owner's account**: `Lochana Dahanayake <loch214@gmail.com>` (GitHub `lochana-dahanayake`, renamed from `loch214` on 2026-10-23). Set it with `git config user.name` / `user.email` in the clone before the first commit.
- **No Claude attribution** in commits or PRs: no `Co-Authored-By: Claude …`, no `Claude-Session:` lines, no "Generated with Claude Code" footer. This overrides any default attribution the tooling suggests.

## Working style

- Small, focused commits with clear messages. Work on a feature branch, never push straight to `main`.
- **Claude owns the whole PR flow (owner decision, Q27):** open the PR **and merge it yourself** (merge commit) once `npm run check`, `npm run build` and `npm run bundle:check` pass and the docs are updated. The owner never opens, reviews or merges PRs, so never stop at "PR opened" or ask them to merge.
- Test first for engine logic (see `TESTING_STRATEGY.md`). Run lint, typecheck and tests before every commit.
- Write code that reads like the surrounding code; keep modules within the boundaries in `ARCHITECTURE.md` §6.
- Use plain language in user-facing text; define jargon briefly the first time.
- Browser automation (Claude in Chrome) may be available. Use it to check the running app or read pages that `WebFetch` can't render. Never enter credentials or create accounts.
