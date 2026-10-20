# ADR-005: Gemini Flash-Lite → Groq → rules-only fallback chain

- **Status:** Accepted (2026-10-21); implementation is Phase 5

## Context
Free LLM tiers have small, shifting limits and occasional outages. Only free services are allowed. The app must never fail because the AI did.

## Decision
Try Google Gemini Flash-Lite first (largest free daily quota among Gemini models), then Groq, then return rules-only. Each provider sits behind an `LlmProvider` port; adapters use the Vercel AI SDK. Model IDs and limits live in environment config. Per-provider timeouts, one repair retry on invalid JSON, a 20 s overall budget, and a small circuit breaker ("cooling" / "exhausted") decide when to move on (`AI_INTEGRATION.md` §1–2).

## Consequences
- Two free keys give roughly 1,500 explanations a day, well above expected use.
- The free-tier numbers are not stable (Q19, 2026-10-20: Google no longer publishes them), so the chain must react to 429s rather than trust fixed numbers.
- A third provider is one more adapter, if ever needed.
