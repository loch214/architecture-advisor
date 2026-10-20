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

## Still open: delegated to the build agent (research, then decide and document)
**Q14. Pipeline & SOA ratings.** Owner has no books. Current values are from memory of R&F 1st ed. → Build agent: search online for published rating tables (O'Reilly previews, author talks/slides, reputable summaries, course notes that cite the figures). If confirmed, update and cite; otherwise keep as flagged estimates.

**Q15. Modular monolith ratings.** Build agent: look for independent sources (author talks, articles, other books) and compare with the R&F 2nd ed. figure. Follow the book unless strong, cited evidence says otherwise; record the comparison in `KNOWLEDGE_BASE_DRAFT.md` §8.

**Q19. Fresh limits.** Before Phase 5, re-verify Gemini Flash-Lite and Groq free-tier limits and model IDs (they change often).
