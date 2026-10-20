# Handoff: build session 2 → Phase 5

Last updated 2026-10-20. Read `CLAUDE.md` first (note the **commit identity rule**), then this file. Phases 1–4 are built; next is the owner's setup and Phase 5 (AI layer).

## Where things are
- **Branch:** `main` (PR #1 phases 1–4 and PR #2 ESLint 10 merged). Start Phase 5 on a new feature branch. No CI server (Q23): run `npm run check` and `npm run build` before pushing. Commits are authored as `Lochana Dahanayake <loch214@gmail.com>`, no Claude trailers. Set `git config user.name/user.email` in a fresh clone before committing. Keep commits grouped by logical step (owner's request): not one giant commit, not dozens of tiny ones.
- **Stack:** Next 16.4.2 (App Router, `cacheComponents`; read `node_modules/next/dist/docs/` before writing Next code), React 19.3, Tailwind 4, Zod 4 (server/tests only, see below), Vitest 5, fast-check, ESLint 10 (with an npm `overrides` entry), Playwright 1.56 + `playwright-core` 1.56 pinned (keep them matched), dependency-cruiser, `radix-ui`, `lucide-react`.
- **Owner's machine:** Windows + PowerShell, Node 24, folder path has spaces. `.gitattributes` forces LF line endings. Local tool files (`.claude/`, `.mcp.json`, `.ignore`, `graft/`) are excluded via `.git/info/exclude` and must never be committed.
- **Keep it simple (owner, Q24):** the daily check is `npm run check` (+ `npm run build` before pushing). No CI, no new test tooling. E2E (Playwright) is optional and not required for any phase.
- **Container network:** npm works; most websites and WebFetch are blocked; WebSearch works.

## Done
| Area | Where |
|---|---|
| KB JSON + Zod, integrity, snapshot, release gate | `src/modules/knowledge-base/` (validated at build time by `check.ts` from `next.config.ts`; `kb` itself is unparsed typed JSON so Zod stays out of the browser) |
| Pure scoring engine + `previewFloors` | `src/modules/scoring/` (FloorSource now carries `level`) |
| Result object | `src/modules/recommendation/` (`buildResult`, `withAi`, `finalScores`, `AdvisorResult`, `AiBlock` with `disabled`/`skipped`) |
| Form (Phase 3) | `src/components/form/` (presets = golden G1/G10/G4/G3/G6 + Growing SaaS) |
| Results, methodology, about (Phase 4) | `src/components/result/`, `src/components/advisor/`, `src/app/{advisor,methodology,about}` |
| `/api/explain` | `src/app/api/explain/route.ts` + `src/modules/platform/env.ts` (`AI_MODE`, `server-only`) |
| UI kit | `src/components/ui/` (hand-written shadcn-style), `components.json`, `src/lib/utils.ts` |
| Fitness | dependency-cruiser, ESLint purity, env-name check, `bundle:check` (200 KB gz/page), all local |
| Tests | 148 unit/property/golden/KB/form/API tests (`npm run check`); 10 optional Playwright e2e (desktop + mobile, axe) |
| ADRs | `docs/adr/001…007` |
| Open questions | Q19–Q24 closed (`OPEN_QUESTIONS.md`) |

Note: the **Startup MVP** preset (= golden G10) raises a scalability conflict on purpose (scalability Low + unpredictable spikes); it demonstrates the conflict warning. Don't "fix" it.

## Next: Phase 5 (AI layer)
1. Keys are ready: `GEMINI_API_KEY` and `GROQ_API_KEY` are in the owner's local `.env.local` (template: `.env.example`, also `AI_MODE`, `GEMINI_MODEL`, `GROQ_MODEL`). Never `NEXT_PUBLIC_`. **Upstash: ask the owner first**; build the cache/rate-limit behind an interface with an in-memory fallback so Phase 5 works without it. Vercel project and deploy come later.
2. Add the Vercel AI SDK packages, then `src/modules/ai/`: prompt builder, response schema, `LlmProvider` port + Gemini/Groq adapters (Vercel AI SDK), chain with timeouts and breaker, validation + clamp, redaction, `AI_MODE=mock` fixtures. Don't send temperature/penalties to Gemini 3.5 Flash-Lite (Q19).
3. Extend `/api/explain`: rate limit, server-side `score()`, cache tiers, chain; `AiPanel` already renders `ok`/`unavailable`/`rate_limited`.
4. Tests: Vitest with mocked providers only (`TESTING_STRATEGY.md` §3–4). Never call real providers in tests. E2E cases 2–3 are optional.
5. Bundle headroom on `/advisor` is ~13 KB; keep heavy code out of the form (the result view is already lazy).
