# Project Overview: Architecture Advisor

> Name confirmed: **Architecture Advisor**.

## What it is
A free web app that recommends software architectural styles for a system. The user describes:
- which quality attributes matter (and how much),
- business drivers (budget, deadline, team, growth, lifespan),
- constraints (hosting, regulation, legacy systems),
- and anything else in plain text.

The app returns a **ranked list of styles with scores**, a **plain-language explanation**, and a **trade-off table**.

## How it works (one paragraph)
A deterministic **rule engine** scores every style against the user's weighted priorities using a curated knowledge base, then applies constraint rules. That always produces a result. On top of that, an **AI layer** (free-tier LLM) reads the top results and the user's notes, may nudge scores by a small, capped amount with a stated reason, and writes the explanation. If the AI is down, slow, or returns junk, the user still gets the full rule-based result. The trade-off table always comes from the knowledge base, never from the AI.

## Who it is for
| User | What they need |
|---|---|
| Software engineering students | Learn *why* a style fits, see trade-offs, connect to course concepts (quality attributes, business drivers, trade-offs) |
| Developers starting a new system | A quick, defensible second opinion before committing |
| Small teams | A shared starting point for a design discussion or an ADR (Architecture Decision Record, a short doc recording one decision and why) |

## Goals
1. **Trustworthy:** same input gives same ranking; every score traceable to a knowledge base entry with a source.
2. **Explainable:** user can see exactly why a style ranked where it did (attribute contributions + rules that fired + AI adjustments shown separately).
3. **Always available:** works with zero AI. AI is an enhancement, not a dependency.
4. **Free to run and free to use:** free tiers only, no paid keys.
5. **Beginner-friendly but not dumbed down:** plain-language defaults, presets, and an advanced mode.
6. **Portfolio quality:** the app's own architecture is deliberately designed, documented with ADRs and C4 diagrams, and tested.

## Non-goals (v1)
- Not a full architecture design tool (no diagrams of the user's system, no component design).
- Not ATAM (a formal multi-day architecture evaluation workshop). We borrow its ideas (prioritise quality attributes, name trade-offs and risks) but don't run the method.
- No chat interface. One form in, one result out.
- No RAG (looking up documents live to feed the AI), no vector database, no copyrighted book text in the app.
- No login, no saved history (planned later).
- No tactics recommendations (planned later).
- No ranking of *patterns* (CQRS, Saga, API Gateway…). Patterns are shown as "commonly used with this style" info only. See `KNOWLEDGE_BASE_DRAFT.md` §5.
- No local or self-hosted models.

## Success criteria for v1
- Rule engine passes all golden scenario tests (`TESTING_STRATEGY.md`).
- Rules-only result appears in under 200 ms after submit (it runs in the browser).
- AI explanation arrives within about 15 s when a provider is available; otherwise a clear fallback message.
- Every knowledge-base item marked `general knowledge` has been reviewed by the owner before launch.
- Deployed publicly on a free host.
