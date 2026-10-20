# Handoff: build session 2 → next session

Last updated 2026-10-20. Read `CLAUDE.md` first (note the **commit identity rule**), then this file. Phases 1–4 are built; next is the owner's setup and Phase 5 (AI layer).

## Where things are
- **Branch:** `main` (PR #1 from `build/phase-1-4` merged). No CI server (Q23): run `npm run check` and `npm run build` before pushing. Commits are authored as `Lochana Dahanayake <loch214@gmail.com>`, no Claude trailers. Set `git config user.name/user.email` in a fresh clone before committing. Keep commits grouped by logical step (owner's request): not one giant commit, not dozens of tiny ones.
- **Stack:** Next 16.4.2 (App Router, `cacheComponents`; read `node_modules/next/dist/docs/` before writing Next code), React 19.3, Tailwind 4, Zod 4 (server/tests only, see below), Vitest 5, fast-check, Playwright 1.56 + `playwright-core` 1.56 pinned (matches the container's Chromium; don't run `playwright install` locally), dependency-cruiser, `radix-ui`, `lucide-react`.
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
| Tests | 148 unit/property/golden/KB/form/API tests; 10 Playwright e2e (desktop + mobile, axe) |
| ADRs | `docs/adr/001…007` |
| Open questions | Q19–Q22 closed (`OPEN_QUESTIONS.md`) |

## Next (Phase 5, after the owner's setup)
1. Owner has the Gemini and Groq keys (in `.env.local`, from `.env.example`). Still to do: Vercel project (add the same keys as env vars there) and Upstash Redis via the Vercel Marketplace. Never `NEXT_PUBLIC_`.
2. `src/modules/ai/`: prompt builder, response schema, `LlmProvider` port + Gemini/Groq adapters (Vercel AI SDK), chain with timeouts and breaker, validation + clamp, redaction, `AI_MODE=mock` fixtures. Don't send temperature/penalties to Gemini 3.5 Flash-Lite (Q19).
3. Extend `/api/explain`: rate limit, server-side `score()`, cache tiers, chain; `AiPanel` already renders `ok`/`unavailable`/`rate_limited`.
4. E2E cases 2 and 3 in `TESTING_STRATEGY.md` §5 with `AI_MODE=mock`.
5. Bundle headroom on `/advisor` is ~13 KB; keep heavy code out of the form (the result view is already lazy).
