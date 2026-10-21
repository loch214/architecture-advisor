# Handoff: session 8 (v1.2, hospital report) → next

Last updated 2026-10-21. Read `CLAUDE.md` first (note the **commit identity rule**), then this file. Phases 1–6 are done and **v1.0 is live at https://architecture-advisor-pink.vercel.app** (tag `v1.0.0`). **v1.1** (session 7, Q30–Q32) fixed style selection (microservices no longer wins almost everything; KB 1.1.0), the flow (blank form first, examples secondary, Start over everywhere, fresh form per visit) and the result's explanations. **v1.2** (session 8, Q33) made step 1 unmistakable ("Where will your software run?" with examples on screen), warns about contradictory answers (N5) and stops microservices winning for small teams whose parts differ (R23; KB 1.2.0). What's left: three yes/no owner answers (Q25, Q28, Q29, launched with the defaults) and small leftovers.

## Where things are
- **Branch:** everything is on `main`. Start new work on a fresh branch from `main`. **Claude opens and merges its own PRs (Q27, also in CLAUDE.md)**; the owner does no PR, review or merge steps, ever. Old merged branches still exist on GitHub (harmless). No CI server (Q23): run `npm run check` and `npm run build` (+ `npm run bundle:check`) before pushing. Commits are authored as `Lochana Dahanayake <loch214@gmail.com>`, no Claude trailers. Set `git config user.name/user.email` in a fresh clone before committing. Keep commits grouped by logical step.
- **Hosting:** Vercel project `architecture-advisor` on the owner's Hobby team (`lochanas-projects-84ba1138`). The GitHub repo is connected: **every push to `main` redeploys production**, and each PR branch gets a preview URL. Env vars (Production): `AI_MODE=live` (Config), `GEMINI_API_KEY` and `GROQ_API_KEY` (Secret, entered by the owner). Runtime logs show one `{"event":"ai",…}` line per `/api/explain` call with the provider attempts. Preview deployments have no env vars, so they run with AI off.
- **Stack:** Next 16.4.2 (App Router, `cacheComponents`; read `node_modules/next/dist/docs/` before writing Next code), React 19.3, Tailwind 4, Zod 4 (server/tests only), Vercel AI SDK (`ai` 7, `@ai-sdk/google` 4, `@ai-sdk/groq` 4; docs in `node_modules/ai/docs/`), Vitest 5, fast-check, ESLint 10 (with an npm `overrides` entry), Playwright 1.56 + `playwright-core` 1.56 pinned, dependency-cruiser, `radix-ui`, `lucide-react`.
- **Owner's machine:** Windows + PowerShell, Node 24, folder path has spaces. **Google Chrome is not installed; the browser is Microsoft Edge** (Claude in Chrome runs there). Use `CHROME_PATH=".../Microsoft/Edge/Application/msedge.exe"` for Lighthouse and Playwright's `channel: "msedge"`. `.gitattributes` forces LF line endings. Local tool files (`.claude/`, `.mcp.json`, `.ignore`, `graft/`) are excluded via `.git/info/exclude` and must never be committed.
- **Keep it simple (owner, Q24):** the daily check is `npm run check` (+ `npm run build` before pushing). No CI, no new test tooling. AI tests use mocked providers only. E2E (Playwright) is optional.

## API keys (where they live)
- **Production:** in Vercel's project settings (Secret type, so not readable back). Only the owner types them in.
- **Cloud sessions (Claude Code on the web):** `GEMINI_API_KEY` and `GROQ_API_KEY` are set in the cloud environment settings. The cloud container **can't reach vercel.com or *.vercel.app**, so anything touching the live site needs a local session.
- **Local runs:** copy `.env.example` to `.env.local` (git-ignored) and fill in the keys there.
- Never print, log or commit the keys, and never prefix them with `NEXT_PUBLIC_` (a fitness check fails the build if a secret-looking `NEXT_PUBLIC_` name appears).

## Done
| Area | Where |
|---|---|
| KB JSON + Zod, integrity, snapshot, release gate | `src/modules/knowledge-base/` |
| Pure scoring engine + `previewFloors` | `src/modules/scoring/` |
| Result object | `src/modules/recommendation/` |
| Form, results, methodology, about (Phases 3–4) | `src/components/`, `src/app/` |
| AI layer (Phase 5) | `src/modules/ai/`, `src/modules/platform/`, `/api/explain`. Details: `AI_INTEGRATION.md` §12 |
| Phase 6 polish (sessions 4–5) | AI-changed-order banner, `/privacy`, a11y pass, README + ADRs, shareable "Copy link" |
| **Launch (session 6)** | Vercel deploy, live smoke test, Lighthouse on production, README screenshots (`scripts/screenshots.mjs` → `docs/screenshots/`), tag `v1.0.0`. Details: UI_UX "As built (launch)" |
| **v1.1 (session 7)** | KB 1.1.0 (R20–R23, two new step-1 questions), `plainReasons`, prompt v2, new flow. Details: KNOWLEDGE_BASE_DRAFT §8, UI_UX "As built (v1.1)" |
| **v1.2 (session 8)** | KB 1.2.0 (R23 for any small team, N5 warning, R22/N1 skipped on contradiction), radio cards for step-1 questions with examples. Details: KNOWLEDGE_BASE_DRAFT §8 "KB 1.2.0", UI_UX "As built (v1.2)" |
| Tests | 242 Vitest tests in `npm run check` (24 golden scenarios); no test calls a real provider. Optional Playwright: 24 tests |

## Waiting on the owner
1. **Q25 Upstash**, **Q28 analytics**, **Q29 notes in shared links:** launched with the defaults (no / no / notes out). Apply only if the owner answers.

The prompt for the next session is in `docs/KICKOFF_PROMPT.md`.

## Next
1. If Q25 = yes: an Upstash `KvStore` adapter. If Q28 = yes: `<Analytics />` + a line on `/privacy`. If Q29 = include notes: add `n` to the link and update `/privacy`.
2. Smaller leftovers (keep `/advisor` under 200 KB gz, 189.7 now): the rate-limited message could show when the limit resets (UI_UX States table); a refresh during the AI request doesn't resume it (shows Retry).
3. Watch the logs: the first AI call after a deploy hit Gemini's 10 s timeout (cold start) and Groq answered instead; later calls took Gemini ~2.6 s. If Gemini timeouts keep showing up in the `event: "ai"` lines, consider a slightly longer Gemini timeout (AI_INTEGRATION §1).
4. Optional: share the URL with a few classmates for feedback (Phase 4 milestone), then `eval:ai` and prompt tuning with real traffic (Phase 5 leftover).
