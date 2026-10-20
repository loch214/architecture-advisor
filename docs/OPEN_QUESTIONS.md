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
| Q18 | Where building happens | Claude Code on the web (cloud credits), repo `loch214/architecture-advisor`; kickoff prompt in `docs/KICKOFF_PROMPT.md` |

## Closed by build session 1 (2026-10-20)
| # | Topic | Outcome |
|---|---|---|
| Q14 | Pipeline & SOA ratings | Researched online (book pages unreachable from the build container). **Pipeline:** our values agree with secondary summaries of the R&F 1st ed. figure; kept, still `flagged` (maintainability is our estimate). **SOA:** no published table found; qualitative sources agree; kept as flagged estimates. Details and sources: `KNOWLEDGE_BASE_DRAFT.md` §8 items 4–5, §9 |
| Q15 | Modular monolith ratings | No independent *numeric* ratings found; qualitative sources agree with the book's direction. Kept R&F 2nd ed. Fig 11-7. Details: KB draft §8 item 6 |

## Still open
**Q19. Fresh limits.** Before Phase 5, re-verify Gemini Flash-Lite and Groq free-tier limits and model IDs (they change often).

**Q20. Golden-scenario sensitivities (owner, optional).** Found while turning the scenarios into tests (`TESTING_STRATEGY.md` §2 notes):
- G7 ETL: if the user rates maintainability and testability High, microservices ties pipeline (68.8). Accept as-is, or raise R7 from +20?
- G11 multi-tenant SaaS: with clear domains, 30+ devs and deployability High, microservices beats cell-based by 0.9 despite "blast radius". Accept, or raise R14 from +15?
No change made: CLAUDE.md requires a source for any rule change, and both readings are defensible. Default if the owner doesn't answer: keep as-is.

**Q21. Owner review of flagged items (owner, before launch).** `PROJECT_OVERVIEW.md` success criteria ask the owner to review general-knowledge items. They're `reviewed: true` per Q2, but the flagged ones (pipeline, SOA, serverless scores; marked `flagged: true` in `styles.json`) deserve a look, ideally against the book's pipeline (1st ed. ch. 11) and SOA (2nd ed. ch. 17) rating figures.

**Q22. Branch name.** The kickoff asked for `build/phase-1-4`; the cloud session was only allowed to push to its assigned branch `claude/peaceful-fermat-0prbs1`, so work is there. Rename or open the PR from it; either is fine.
