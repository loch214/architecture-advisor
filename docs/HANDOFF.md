# Handoff: build session 4 (Phase 6 polish) → launch

Last updated 2026-10-20. Read `CLAUDE.md` first (note the **commit identity rule**), then this file. Phases 1–5 are built, and the Phase 6 work that needs no owner account is done. What's left: the shareable link, then deployment and launch checks once the owner creates the Vercel project.

## Where things are
- **Branch:** everything is on `main` (Phase 5 via PR #4, Phase 6 polish via the `phase-6-polish` PR). Start new work on a fresh branch from `main`. **Claude opens and merges its own PRs (Q27)**; the owner does no PR or merge steps. Old merged branches still exist on GitHub because the container can't delete them (harmless). No CI server (Q23): run `npm run check` and `npm run build` (+ `npm run bundle:check`) before pushing. Commits are authored as `Lochana Dahanayake <loch214@gmail.com>`, no Claude trailers. Set `git config user.name/user.email` in a fresh clone before committing. Keep commits grouped by logical step.
- **Stack:** Next 16.4.2 (App Router, `cacheComponents`; read `node_modules/next/dist/docs/` before writing Next code), React 19.3, Tailwind 4, Zod 4 (server/tests only), Vercel AI SDK (`ai` 7, `@ai-sdk/google` 4, `@ai-sdk/groq` 4; docs in `node_modules/ai/docs/`), Vitest 5, fast-check, ESLint 10 (with an npm `overrides` entry), Playwright 1.56 + `playwright-core` 1.56 pinned, dependency-cruiser, `radix-ui`, `lucide-react`.
- **Owner's machine:** Windows + PowerShell, Node 24, folder path has spaces. `.gitattributes` forces LF line endings. Local tool files (`.claude/`, `.mcp.json`, `.ignore`, `graft/`) are excluded via `.git/info/exclude` and must never be committed.
- **Keep it simple (owner, Q24):** the daily check is `npm run check` (+ `npm run build` before pushing). No CI, no new test tooling. AI tests use mocked providers only. E2E (Playwright) is optional.

## API keys (where they live)
- **Cloud sessions (Claude Code on the web):** `GEMINI_API_KEY` and `GROQ_API_KEY` are set as environment variables in the **cloud environment settings** (not in any file). Set `AI_MODE=live` only for the command that needs it (e.g. `AI_MODE=live npx next start`).
- **Local runs:** copy `.env.example` to `.env.local` (git-ignored) and fill in the keys there.
- Never print, log or commit the keys, and never prefix them with `NEXT_PUBLIC_` (a fitness check fails the build if a secret-looking `NEXT_PUBLIC_` name appears).
- **Container network:** npm, `generativelanguage.googleapis.com` and (since session 4) `api.groq.com` work. Most other websites and WebFetch are blocked; WebSearch works. Chromium for Playwright is at `/opt/pw-browsers` (don't run `playwright install`); a one-off `npx -y lighthouse@12.8.2` with `CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` works for Lighthouse.

## Done
| Area | Where |
|---|---|
| KB JSON + Zod, integrity, snapshot, release gate | `src/modules/knowledge-base/` |
| Pure scoring engine + `previewFloors` | `src/modules/scoring/` |
| Result object | `src/modules/recommendation/` (`buildResult`, `withAi` now stamps `versions.prompt`) |
| Form, results, methodology, about (Phases 3–4) | `src/components/`, `src/app/` |
| **AI layer (Phase 5)** | `src/modules/ai/` (prompt, schema, validation, redaction, chain, T1/T2 cache, providers Gemini/Groq/mock) and `src/modules/platform/` (`KvStore` in memory, rate limit, `aiEnv()`); `/api/explain` wires them. Details and deviations: `AI_INTEGRATION.md` §12 |
| AI panel | `src/components/result/ai-panel.tsx` shows summary, top pick, others, cautions, provider and the reused/adapted note; mention cards show the AI's answer |
| **Phase 6 polish (session 4)** | "AI changed the order" banner (`topPickChange()` in `recommendation`, `AI_MOCK=reorder`), `/privacy` page (+ links from notes notice, about, footer), copy and a11y pass, Lighthouse fixes, README with diagrams and ADRs. Details: UI_UX "As built (session 4)" |
| Tests | 220 Vitest tests in `npm run check`; no test calls a real provider. Optional Playwright: 16 tests (AI off + `AI_MODE=mock` ok/fail/reorder servers), axe on every page and AI state |
| Live check | Gemini OK through `/api/explain` (~5.8 s, valid first try, session 3). Groq OK (~1.6 s, valid after one repair retry, session 4) |
| ADRs | `docs/adr/001…007` |

## Waiting on the owner (only things Claude can't do)
1. **Q25 Upstash:** yes/no on adding Upstash Redis (free, via Vercel Marketplace) for launch. Without it, cache and rate limits are per server instance. Asked twice; don't block on it.
2. **Q28 Analytics:** yes/no on Vercel Web Analytics (free, no cookies). The privacy page says "no analytics" until then.
3. **Vercel:** the owner creates the Vercel project (import the GitHub repo) and adds the env vars: `AI_MODE=live`, `GEMINI_API_KEY`, `GROQ_API_KEY` (models default; optional `AI_DAILY_BUDGET`). Claude never creates accounts.

The prompt for the next session is in `docs/KICKOFF_PROMPT.md`.

## Next
1. **Shareable "Copy link"** (REQUIREMENTS "should", UI_UX result layout): encode the input in the URL hash so a link reopens the same result; keep `/advisor` under 200 KB gz (186.5 now). Rules-only on open; the AI can be re-requested.
2. **After the owner creates the Vercel project:** a live smoke test on the real URL (rules, AI ok, opt-out), Lighthouse on production, screenshots/GIF for the README/portfolio, then tag v1.0.
3. If Q25 = yes: an Upstash `KvStore` adapter. If Q28 = yes: `<Analytics />` + a line on `/privacy`.
4. Smaller leftovers: the rate-limited message could show when the limit resets (UI_UX States table); a refresh during the AI request doesn't resume it (shows Retry).
