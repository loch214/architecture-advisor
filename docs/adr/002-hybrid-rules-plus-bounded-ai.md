# ADR-002: Hybrid rule engine + AI, AI bounded to ±5 points

- **Status:** Accepted (2026-10-21)

## Context
Pure LLM advice is unrepeatable, hard to test and can be confidently wrong. Pure rules can't read free-text context ("we already run Kafka"). Users need both a trustworthy ranking and a plain-language explanation.

## Decision
A deterministic rule engine computes the ranking from the knowledge base. A free-tier LLM may then (a) explain the result and (b) propose at most 3 adjustments of at most ±5 points each, only to styles in the top 5, each with a reason (`AI_INTEGRATION.md` §5). The server clamps and validates every adjustment. The trade-off table and exclusions always come from the KB, never from the AI. With AI off or failing, the app returns the full rule result.

## Consequences
- The ranking is reproducible and covered by golden tests; the AI can reorder close styles but can't overturn a clear lead.
- The UI shows rule score, AI delta and final score separately, so every point is traceable.
- The app is fully useful with `AI_MODE=off`, which is how Phases 1–4 ship.
