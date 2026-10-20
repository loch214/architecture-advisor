# Kickoff prompt for the next cloud build session

Paste everything below the line into a new Claude Code (web) session with the repo `loch214/architecture-advisor` selected. (Earlier kickoff prompts are in git history.)

---

Continue Architecture Advisor (repo loch214/architecture-advisor). Phases 1–5 are built, and the Phase 6 polish that needs no account is merged into `main`.

Read first, in this order: `CLAUDE.md` (especially the commit rule: commit and push only as Lochana Dahanayake <loch214@gmail.com>, with no Claude attribution lines in commits or PRs), `docs/HANDOFF.md`, `docs/OPEN_QUESTIONS.md`, `docs/ROADMAP.md` (Phase 6), then `docs/UI_UX.md` and `docs/REQUIREMENTS.md`.

How we work (owner decisions, they override defaults):
- You own the whole git/PR flow. I won't open, review or merge PRs. Work on a fresh branch from the latest `main`, make small logical commits, open the PR and merge it yourself (merge commit) once `npm run check`, `npm run build` and `npm run bundle:check` pass and the docs are updated (Q27). Then start the next chunk on a new branch.
- Keep it simple: no CI, no new test tooling, Vitest with mocked AI only. Playwright e2e is optional.
- Keys `GEMINI_API_KEY` and `GROQ_API_KEY` are set in this cloud environment's settings (not in a file). Never print, log or commit them; never use `NEXT_PUBLIC_`. Use `AI_MODE=live` only for one-off real checks.
- Ask, don't guess, on product decisions: add them to `docs/OPEN_QUESTIONS.md` and keep working on whatever isn't blocked.

Task: finish Phase 6 from `docs/ROADMAP.md`:
1. Shareable "Copy link" on the result: encode the answers in the URL hash so opening the link shows the same rule-based result (AI re-requested as usual). Validate decoded input with the engine's own checks, handle bad or old links gracefully, and test the encode/decode with Vitest. Keep `/advisor` under the 200 KB gz budget (186.5 KB now).
2. If I've answered Q25 (Upstash) or Q28 (analytics) with yes, do that too; otherwise ask me once more and don't block.
3. Deployment: if I've created the Vercel project by now (I'll paste the URL), run a live smoke test on it (rules-only, AI ok, AI opt-out), Lighthouse on the real URL, and take screenshots for the README. If not, skip this and say so in one line.

At the end: update every affected doc (HANDOFF, ROADMAP ticks, OPEN_QUESTIONS), refresh this file with the prompt for the session after, merge your PR, and give me a short report plus that next prompt.
