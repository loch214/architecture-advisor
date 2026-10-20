# Handoff: build session 3 (Phase 5) → Phase 6

Last updated 2026-10-20. Read `CLAUDE.md` first (note the **commit identity rule**), then this file. Phases 1–5 are built; next is Phase 6 (polish and launch), plus the two owner items below.

## Where things are
- **Branch:** Phase 5 is on `claude/architecture-advisor-phase-5-ai-k6kmq2` (PR to `main`). No CI server (Q23): run `npm run check` and `npm run build` (+ `npm run bundle:check`) before pushing. Commits are authored as `Lochana Dahanayake <loch214@gmail.com>`, no Claude trailers. Set `git config user.name/user.email` in a fresh clone before committing. Keep commits grouped by logical step.
- **Stack:** Next 16.4.2 (App Router, `cacheComponents`; read `node_modules/next/dist/docs/` before writing Next code), React 19.3, Tailwind 4, Zod 4 (server/tests only), Vercel AI SDK (`ai` 7, `@ai-sdk/google` 4, `@ai-sdk/groq` 4; docs in `node_modules/ai/docs/`), Vitest 5, fast-check, ESLint 10 (with an npm `overrides` entry), Playwright 1.56 + `playwright-core` 1.56 pinned, dependency-cruiser, `radix-ui`, `lucide-react`.
- **Owner's machine:** Windows + PowerShell, Node 24, folder path has spaces. `.gitattributes` forces LF line endings. Local tool files (`.claude/`, `.mcp.json`, `.ignore`, `graft/`) are excluded via `.git/info/exclude` and must never be committed.
- **Keep it simple (owner, Q24):** the daily check is `npm run check` (+ `npm run build` before pushing). No CI, no new test tooling. AI tests use mocked providers only. E2E (Playwright) is optional.

## API keys (where they live)
- **Cloud sessions (Claude Code on the web):** `GEMINI_API_KEY` and `GROQ_API_KEY` are set as environment variables in the **cloud environment settings** (not in any file). Set `AI_MODE=live` only for the command that needs it (e.g. `AI_MODE=live npx next start`).
- **Local runs:** copy `.env.example` to `.env.local` (git-ignored) and fill in the keys there.
- Never print, log or commit the keys, and never prefix them with `NEXT_PUBLIC_` (a fitness check fails the build if a secret-looking `NEXT_PUBLIC_` name appears).
- **Container network:** npm and `generativelanguage.googleapis.com` work. `api.groq.com` is **denied** by the cloud environment's network policy (Q26): add it under the environment's Network access → Allowed domains to test Groq live from the cloud. Most other websites and WebFetch are blocked; WebSearch works.

## Done
| Area | Where |
|---|---|
| KB JSON + Zod, integrity, snapshot, release gate | `src/modules/knowledge-base/` |
| Pure scoring engine + `previewFloors` | `src/modules/scoring/` |
| Result object | `src/modules/recommendation/` (`buildResult`, `withAi` now stamps `versions.prompt`) |
| Form, results, methodology, about (Phases 3–4) | `src/components/`, `src/app/` |
| **AI layer (Phase 5)** | `src/modules/ai/` (prompt, schema, validation, redaction, chain, T1/T2 cache, providers Gemini/Groq/mock) and `src/modules/platform/` (`KvStore` in memory, rate limit, `aiEnv()`); `/api/explain` wires them. Details and deviations: `AI_INTEGRATION.md` §12 |
| AI panel | `src/components/result/ai-panel.tsx` shows summary, top pick, others, cautions, provider and the reused/adapted note; mention cards show the AI's answer |
| Tests | 216 Vitest tests in `npm run check` (61 in `tests/ai/`, 10 route tests); no test calls a real provider |
| Live check | Gemini OK through `/api/explain` (~5.8 s, valid first try). Groq not reachable from the container; fallback to rules-only proven |
| ADRs | `docs/adr/001…007` |

## Owner to-dos
1. **Q25 Upstash:** decide whether to add Upstash Redis (free, via Vercel Marketplace) for launch. Without it, cache and rate limits are per server instance.
2. **Q26 Groq:** allow `api.groq.com` in the cloud environment (or test locally) so one real Groq call can be checked: run with `AI_MODE=live` and an empty `GEMINI_API_KEY` so the chain goes straight to Groq.

## Next: Phase 6 (polish and launch)
See `ROADMAP.md`. Notable items: "AI changed the order" banner, privacy page linking the providers' terms, Vercel project + env vars (`AI_MODE=live`, both keys), optional e2e cases 2–3 with `AI_MODE=mock` (`AI_MOCK=ok|fail`), copy review and a11y audit. Bundle headroom on `/advisor` is ~13 KB (186.6 / 200 KB gz); keep AI code server-side.
