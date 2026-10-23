# Open Questions & Decisions Log

## Decided (2026-10-21)
| # | Topic | Decision |
|---|---|---|
| Q1 | Monolithic style ratings | Layered, modular monolith and microkernel now use book ratings (R&F 2nd ed. Fig 10-6, 11-7, 13-9) |
| Q2 | KB review | Done by Claude against the course material and published sources, then calibrated with a 16-scenario simulation (KB draft §8). Owner may override anything |
| Q3 | Primary model | Latest Gemini Flash-Lite (`gemini-3.5-flash-lite` today), model ID in config |
| Q4 | Upstash | Yes. Created in Phase 5 via Vercel Marketplace; owner does the sign-up click |
| Q5 | Third provider | None. Gemini → Groq → rules-only |
| Q6 | AI adjustment limit | ±5 points/style, max 3 styles, top 5 only |
| Q7 | Privacy | Layered approach: notice + data minimisation + light redaction + AI opt-out + no logging (AI_INTEGRATION §9) |
| Q8 | Name | **Architecture Advisor** |
| Q9 | Commercial | No → Vercel Hobby is fine |
| Q10 | Patterns | Shown as companions, not ranked |
| Q11 | Coverage | 13 ranked styles (+ peer-to-peer, edge–cloud) plus a glossary of recognised-but-unranked items (patterns, internal structures, micro-frontends, data architectures, technologies, AI apps) so any mention gets an answer |
| Q12 | Lecture attribution | Lectures are not credited publicly. Public docs/app cite books and articles; lecture mapping lives in `docs/private/` (git-ignored) |
| Q13 | Repo | Public GitHub repo; `lectures/` and `docs/private/` git-ignored |
| Q17 | Cache behaviour | Never reuse a *similar* answer blindly: identical → reuse (re-validated; switchable); similar → AI verifies/adapts using the old answer as reference (AI_INTEGRATION §7) |
| Q18 | Where building happens | Claude Code on the web (cloud credits), repo `lochana-dahanayake/architecture-advisor`; kickoff prompt in `docs/KICKOFF_PROMPT.md` |

## Closed by build session 1 (2026-10-20)
| # | Topic | Outcome |
|---|---|---|
| Q14 | Pipeline & SOA ratings | Researched online (book pages unreachable from the build container). **Pipeline:** our values agree with secondary summaries of the R&F 1st ed. figure; kept, still `flagged` (maintainability is our estimate). **SOA:** no published table found; qualitative sources agree; kept as flagged estimates. Details and sources: `KNOWLEDGE_BASE_DRAFT.md` §8 items 4–5, §9 |
| Q15 | Modular monolith ratings | No independent *numeric* ratings found; qualitative sources agree with the book's direction. Kept R&F 2nd ed. Fig 11-7. Details: KB draft §8 item 6 |

## Closed by build session 2 (2026-10-20)
| # | Topic | Outcome |
|---|---|---|
| Q19 | Fresh AI limits | Re-checked with web search (provider pages unreachable from the container). **Gemini:** model ID `gemini-3.5-flash-lite` confirmed on Google's model page (stable, July 2026). Google still doesn't publish free-tier numbers; Sept 2026 secondary sources give 15 RPM and 500–1,000 RPD, matching `RESEARCH.md`. Google Cloud's model page notes custom temperature/top-K/top-P are ignored and frequency/presence penalties are rejected, so the Phase 5 adapter must not send them. **Groq:** `openai/gpt-oss-120b` free plan 30 RPM, 1,000 RPD, 8K TPM, 200K TPD (consistent across sources; limits are per organisation). No doc change needed beyond this note; re-check in the AI Studio / GroqCloud consoles once keys exist (Phase 5) |
| Q20 | Golden sensitivities (G7, G11) | **Keep R7 and R14 as they are** (owner delegated the call). G7: a user who rates maintainability and testability High is asking for exactly what R&F rate pipeline weakly and microservices strongly, so a near-tie is honest, and both styles appear with their reasons. G11: cells are an isolation/deployment wrapper that usually contains a full copy of the service stack (AWS cell-based guidance; Rackspace "Cell-based architecture on AWS"), so microservices as a close #2 is consistent. No source supports a specific larger bonus, and CLAUDE.md forbids unsourced changes. See KB draft §8 item 10 |
| Q21 | Flagged items | Owner asked for "the better way": flagged estimates stay as they are but are **shown as estimates** to users: `≈` in the trade-off table and the methodology ratings matrix, with a note naming pipeline, SOA and serverless. A future owner check against the book remains welcome but is no longer a launch blocker |
| Q22 | Branch name | Work moved to `build/phase-1-4` (pushing there works); the PR is opened from it. The build container isn't allowed to delete branches, so the owner deletes the old `claude/peaceful-fermat-0prbs1` branch on GitHub (Branches page → bin icon); it holds nothing that isn't on `build/phase-1-4` |
| Q23 | CI | Owner asked to drop CI to keep things simple (2026-10-20). The GitHub Actions workflow is removed after one green run; the same checks run locally with `npm run check`, `npm run build`, `npm run bundle:check` and `npm run test:e2e`. `.env.example` added for local keys |
| Q24 | Test scope | Owner: "don't overcomplicate". Required checks are `npm run check` (lint, typecheck, format, fitness, unit/golden/KB tests) and `npm run build`. The Playwright e2e suite stays in the repo but is **optional** (no Chromium install needed day to day). No new test tooling without asking. Golden G10's scalability conflict is intentional (it was the Startup MVP preset until v1.1) |

## Closed by build session 3 (2026-10-20)
| # | Topic | Outcome |
|---|---|---|
| Q27 | PR workflow | Owner: "I'm not gonna do any of those merge, making PR anything by myself." Claude opens **and merges** its own PRs (merge commit) once `npm run check`, `npm run build` and `npm run bundle:check` pass and the docs are updated, then starts the next work on a fresh branch from `main`. CLAUDE.md's working style now says the same (session 5); the kickoff prompt spells the steps out |
| Q22 follow-up | Old branches | `build/phase-1-4`, `claude/nice-gates-3nyb3w` and `claude/peaceful-fermat-0prbs1` are fully merged into `main`. The container's permission rules block deleting remote branches, so they stay. They're harmless; delete them on GitHub's Branches page whenever convenient |

## Closed by build session 4 (2026-10-20)
| # | Topic | Outcome |
|---|---|---|
| Q26 | Groq live check | `api.groq.com` is now reachable from the cloud container. One real call through `/api/explain` (`AI_MODE=live`, empty `GEMINI_API_KEY`) returned `ok` from Groq `openai/gpt-oss-120b` in ~1.6 s; the first reply failed validation and the repair retry fixed it. Details: AI_INTEGRATION §12 |

## Closed by build session 5 (2026-10-21)
| # | Topic | Outcome |
|---|---|---|
| Q26 duplicate | Stale row | The old "Groq live check" row under "Still open" was a leftover; Q26 was closed in session 4 (above). Removed |

## Closed by launch session 6 (2026-10-21, local Claude Code)
| # | Topic | Outcome |
|---|---|---|
| Vercel | Deploy | Project `architecture-advisor` on the owner's Hobby team, imported from GitHub with the Next.js defaults. Live at https://architecture-advisor-pink.vercel.app. `AI_MODE=live` set by Claude (Config type, Production); `GEMINI_API_KEY` and `GROQ_API_KEY` typed in by the owner (Secret type). The GitHub repo is connected, so every push to `main` redeploys production and each PR branch gets a preview URL (owner asked for auto-redeploys) |
| Q25, Q28, Q29 | Defaults kept | No answer this session either, so launch ships with the defaults: no Upstash, no analytics, notes left out of shared links. Still listed below in case the owner changes their mind |

## Closed by session 7 (2026-10-21, local Claude Code): owner feedback, v1.1
| # | Topic | Outcome |
|---|---|---|
| Q30 | "Recommends microservices for almost everything" | Owner: a desktop IDE with plug-ins (a textbook microkernel case) got microservices first. Root cause and fix in KNOWLEDGE_BASE_DRAFT §8 "KB 1.1.0": two new required questions ("What are you building?", "Do all parts need the same qualities?") and rules R20–R23 plus an otherwise branch on R4, all sourced to Richards & Ford ch.7, 9, 13, 15, 18, 19. No style score changed. Golden G17–G22 added |
| Q31 | Flow | Owner: blank form first, examples secondary; always able to start fresh; a new visit must not show the previous user's answers. Done: landing has one main button (`/advisor?new`) and six examples below it; `/advisor` opens on a blank step 1; Start over on every step and on the result; answers kept in session storage instead of local storage. The Startup MVP example was replaced by "Desktop IDE with plug-ins" (G10 stays a golden scenario). UI_UX "As built (v1.1)" |
| Q32 | Messy AI explanation | Owner: the AI text was messy and should explain the scenario. Done: prompt v2 (summary tied to the user's answers, no list of definitions; AI_INTEGRATION §3); the AI panel uses headed blocks; and a rule-based "Why <style> fits your project" section now leads the result, so a clear explanation exists even with AI off |

## Closed by session 8 (2026-10-21, local Claude Code): hospital report, v1.2
| # | Topic | Outcome |
|---|---|---|
| Q33 | Hospital scenario | Owner: a hospital system (staff web app + mobile view, one back end, 4–10 devs) got a confusing result. (1) "Installed app (desktop or mobile)" was misread because of *mobile*: the question is now "Where will your software run?" with an example under every option. (2) "Installed" + "parts differ a lot" contradict each other and gave an all-weak result without a word: new warning N5, and R22/N1 are skipped then. (3) With the right answers microservices won: R23 now applies to any team of up to 10 without fast growth, whatever qa-scope says (R&F ch.14, 18–19), so service-based is #1. KB 1.2.0; golden G23–G24; details in KNOWLEDGE_BASE_DRAFT §8 "KB 1.2.0" |

## Closed by session 9 (2026-10-22, cloud): usability round 1
| # | Topic | Outcome |
|---|---|---|
| Q34 | "Improve usability and UI" | Owner wants the app to work as a portfolio piece, a study tool and a decision tool, and chose a three-round plan with **round 1 only for now**: result header (Share & save toggle, "Next best"), AI "others" folded, step-1 progress and scroll-to-next. Dark mode already existed. Rounds 2 (style catalog) and 3 (compare + what-if) wait for the owner's go-ahead. Details: UI_UX "As built (v1.3)" |

## Still open
| # | Topic | Question |
|---|---|---|
| Q25 | Upstash | Phase 5 runs without Upstash (owner: "skip unless needed; ask first"). The cache, rate limit, global budget and breaker use an in-memory store per server instance. That is fine locally and for low traffic, but on Vercel each instance keeps its own copy, so limits are per instance. **Owner: add Upstash Redis (Vercel Marketplace, free) before or at launch?** If yes, it's one `KvStore` adapter. Asked again in sessions 4 and 5; no answer yet, nothing blocked |
| Q28 | Analytics | ROADMAP Phase 6 lists optional privacy-friendly analytics (Vercel Web Analytics, free tier: page views only, no cookies). The privacy page currently says "no analytics". **Owner: turn on Vercel Web Analytics at launch, yes or no?** If yes: one `<Analytics />` component, a line on `/privacy`, and a bundle check. Asked again in session 5; no answer yet |
| Q29 | Notes in shared links | The "Copy link" URL carries the answers to steps 1–3 but **not the free-text notes**, because links get pasted into chats and notes may hold project details. The rule ranking doesn't use notes, so the opened link shows the same ranking; only the "You mentioned" cards and the AI's view of the notes are missing. The result says "Your notes are not included in the link" when there were notes. **Owner: keep notes out (default), or include them?** If included: one field in `share-link.ts` and a line on `/privacy` |
