# Kickoff prompt for the next cloud build session

Paste everything below the line into a new Claude Code (web) session with the repo `loch214/architecture-advisor` selected. (Earlier kickoff prompts are in git history.)

---

Continue Architecture Advisor (repo loch214/architecture-advisor). Phases 1–5 are built and merged into `main`.

Read first, in this order: `CLAUDE.md` (especially the commit rule: commit and push only as Lochana Dahanayake <loch214@gmail.com>, with no Claude attribution lines in commits or PRs), `docs/HANDOFF.md`, `docs/OPEN_QUESTIONS.md`, `docs/ROADMAP.md` (Phase 6), then `docs/UI_UX.md` and `docs/AI_INTEGRATION.md` §10–12.

How we work (owner decisions, they override defaults):
- You own the whole git/PR flow. I won't open, review or merge PRs. Work on a fresh branch from the latest `main`, make small logical commits, open the PR and merge it yourself (merge commit) once `npm run check`, `npm run build` and `npm run bundle:check` pass and the docs are updated (Q27). Then start the next chunk on a new branch.
- Keep it simple: no CI, no new test tooling, Vitest with mocked AI only. Playwright e2e is optional.
- Keys `GEMINI_API_KEY` and `GROQ_API_KEY` are set in this cloud environment's settings (not in a file). Never print, log or commit them; never use `NEXT_PUBLIC_`. Use `AI_MODE=live` only for one-off real checks.
- Ask, don't guess, on product decisions: add them to `docs/OPEN_QUESTIONS.md` and keep working on whatever isn't blocked.

Task: Phase 6 (polish and launch) from `docs/ROADMAP.md`, everything that doesn't need my accounts:
1. "AI changed the order" banner when the AI's top pick differs from the rule engine's; check the loading, fallback and reused/adapted states.
2. Privacy page that lists the providers and links their terms (AI_INTEGRATION §9); link it from the notes notice and the about page.
3. Optional e2e cases 2–3 with `AI_MODE=mock` (`AI_MOCK=ok` and `AI_MOCK=fail`), only if it stays simple.
4. Copy review (plain language), an accessibility pass, and a README with how to run/test/build plus an architecture diagram and the ADRs.
5. Keep `/advisor` under the 200 KB gz budget (about 13 KB headroom).

Before starting, check whether `api.groq.com` is reachable now (Q26). If it is, do one real Groq call through `/api/explain` with `AI_MODE=live` and an empty `GEMINI_API_KEY`, report the result and close Q26. If not, tell me in one line and carry on.
Ask me once about Q25 (Upstash yes/no) and don't block on the answer. Deployment to Vercel waits for me to create the project.

At the end: update every affected doc (HANDOFF, ROADMAP ticks, OPEN_QUESTIONS), refresh this file with the prompt for the session after, merge your PR, and give me a short report plus that next prompt.
