# Kickoff prompt for the next cloud build session

Paste everything below the line into a new Claude Code (web) session with the repo `loch214/architecture-advisor` selected. (Earlier kickoff prompts are in git history.)

---

Continue Architecture Advisor (repo loch214/architecture-advisor). Phases 1–5 are built, and all Phase 6 work that needs no account (including the shareable "Copy link") is merged into `main`.

Read first, in this order: `CLAUDE.md` (especially the commit rule: commit and push only as Lochana Dahanayake <loch214@gmail.com>, with no Claude attribution lines in commits or PRs), `docs/HANDOFF.md`, `docs/OPEN_QUESTIONS.md`, `docs/ROADMAP.md` (Phase 6), then `docs/UI_UX.md` and `docs/REQUIREMENTS.md`.

How we work (owner decisions, they override defaults):
- This is AI-driven development: you do **all** of the git work, and I do none of it. I never open, review, approve or merge PRs, and I never wait for you to hand me a PR. For each chunk of work, you:
  1. create a fresh branch from the latest `main`,
  2. make small logical commits and push them,
  3. run `npm run check`, `npm run build` and `npm run bundle:check` and update the docs,
  4. open the PR yourself and merge it yourself (merge commit) as soon as those pass (Q27),
  5. start the next chunk on a new branch from the updated `main`.
  Never stop at "PR opened" and never ask me to merge.
- Keep it simple: no CI, no new test tooling, Vitest with mocked AI only. Playwright e2e is optional.
- Keys `GEMINI_API_KEY` and `GROQ_API_KEY` are set in this cloud environment's settings (not in a file). Never print, log or commit them; never use `NEXT_PUBLIC_`. Use `AI_MODE=live` only for one-off real checks.
- Ask, don't guess, on product decisions: add them to `docs/OPEN_QUESTIONS.md` and keep working on whatever isn't blocked.

Task: launch (Phase 6, last part):
1. Deployment: if I've created the Vercel project by now (I'll paste the URL), run a live smoke test on it (rules-only, AI ok, AI opt-out, and a shared "Copy link" opened in a fresh browser), Lighthouse on the real URL, and take screenshots for the README. Then tag v1.0. If not, skip this and say so in one line.
2. Apply my answers to Q25 (Upstash), Q28 (analytics) and Q29 (notes in shared links) if I've given them; otherwise leave the defaults and don't ask again this session.
3. Smaller leftovers from `docs/HANDOFF.md` "Next" (e.g. show when the AI rate limit resets), keeping `/advisor` under the 200 KB gz budget (187.5 KB now).

At the end: update every affected doc (HANDOFF, ROADMAP ticks, OPEN_QUESTIONS), refresh this file with the prompt for the session after, merge your PR yourself, and give me a short report plus that next prompt.
