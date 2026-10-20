# Architecture Decision Records

Short records of the decisions that shape this app, in the Nygard / MADR style: context, decision, consequences. A record is never edited to change its decision; a new record supersedes it.

| # | Decision | Status |
|---|---|---|
| [001](001-modular-monolith-on-nextjs.md) | Modular monolith on Next.js / Vercel | Accepted |
| [002](002-hybrid-rules-plus-bounded-ai.md) | Hybrid: rule engine ranks, AI adjusts by at most ±5 | Accepted |
| [003](003-kb-as-versioned-json.md) | Knowledge base as versioned JSON + Zod, no database in v1 | Accepted |
| [004](004-engine-in-browser-and-server.md) | One pure engine, run in the browser and on the server | Accepted |
| [005](005-ai-fallback-chain.md) | Gemini Flash-Lite → Groq → rules-only fallback chain | Accepted (built in Phase 5) |
| [006](006-upstash-for-cache-and-rate-limits.md) | Upstash Redis for cache and rate limits | Accepted (built in Phase 5) |
| [007](007-patterns-shown-not-ranked.md) | Patterns are shown as companions, not ranked | Accepted |
