# Kickoff prompt for the next build session

Paste everything below the line into a new Claude Code session with the repo `loch214/architecture-advisor` (cloud) or the local folder (VS Code). Work that touches the live site (Vercel dashboard, Lighthouse or screenshots on the real URL) needs the **local** session, because the cloud container can't reach vercel.com or *.vercel.app. (Earlier kickoff prompts are in git history.)

---

Continue Architecture Advisor (repo loch214/architecture-advisor). v1.0 is live at https://architecture-advisor-pink.vercel.app (tag `v1.0.0`). Every push to `main` redeploys it automatically.

Read first, in this order: `CLAUDE.md` (especially the commit rule: commit and push only as Lochana Dahanayake <loch214@gmail.com>, with no Claude attribution lines in commits or PRs), `docs/HANDOFF.md`, `docs/OPEN_QUESTIONS.md`, `docs/ROADMAP.md`, then `docs/UI_UX.md` and `docs/AI_INTEGRATION.md`.

How we work (owner decisions, they override defaults):
- This is AI-driven development: you do **all** of the git work, and I do none of it. For each chunk of work, you:
  1. create a fresh branch from the latest `main`,
  2. make small logical commits and push them,
  3. run `npm run check`, `npm run build` and `npm run bundle:check` and update the docs,
  4. open the PR yourself and merge it yourself (merge commit) as soon as those pass (Q27). Merging redeploys production, so after merging check that the live site still loads,
  5. start the next chunk on a new branch from the updated `main`.
  Never stop at "PR opened" and never ask me to merge.
- Keep it simple: no CI, no new test tooling, Vitest with mocked AI only. Playwright e2e is optional.
- Free tiers only. Never print, log, type or commit API keys; never use `NEXT_PUBLIC_`. If a Vercel form needs a key, stop and ask me to type it in.
- Ask, don't guess, on product decisions: add them to `docs/OPEN_QUESTIONS.md` and keep working on whatever isn't blocked.

Task (post-launch):
1. Apply my answers to Q25 (Upstash), Q28 (analytics) and Q29 (notes in shared links) if I've given them; otherwise keep the defaults (no / no / notes out) and don't ask again this session.
2. Show when the AI rate limit resets in the "rate limited" message (UI_UX States table), keeping `/advisor` under the 200 KB gz budget (189.7 KB now).
3. If running locally: check the Vercel runtime logs (`event: "ai"` lines) for Gemini timeouts; if they're common, propose a timeout change in AI_INTEGRATION §1 before changing code.

At the end: update every affected doc (HANDOFF, ROADMAP, OPEN_QUESTIONS), refresh this file with the prompt for the session after, merge your PR yourself, and give me a short report plus that next prompt.
