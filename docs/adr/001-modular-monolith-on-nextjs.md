# ADR-001: Modular monolith on Next.js / Vercel

- **Status:** Accepted (2026-10-21, planning; confirmed in build session 2)
- **Deciders:** project owner, Claude

## Context
One part-time developer, zero budget, a lifespan of several years, and traffic that is small but may spike when the link is shared. The quality attributes that matter most are testability, graceful degradation and low cost (`ARCHITECTURE.md` §1). Running that profile through our own engine ranks a modular monolith first. All parts of the app share one quality-attribute scope, so by Richards & Ford's architectural-quantum test there is no reason to distribute it.

## Decision
Build one Next.js (App Router) app, deployed once to Vercel Hobby, split internally into domain modules (`knowledge-base`, `scoring`, `recommendation`, `ai`, `platform`) with dependency rules enforced by dependency-cruiser (`npm run check`) (`ARCHITECTURE.md` §6). Vercel runs the API route as a serverless function; that is a hosting detail, not a second service.

## Alternatives
- Separate backend (Express/FastAPI) + SPA: two deploys, CORS, two hosts, no gain.
- Microservices: distribution costs (ops, latency, consistency) with no benefit for one developer.
- Browser-only app calling the AI directly: would expose API keys.

## Consequences
- One repo, one pipeline, one deploy; cheap to run and easy to test.
- Boundaries exist only by convention plus fitness functions, so those checks must stay strict and be run before every push.
- If a module ever needs separate scaling, its boundary is already clean enough to extract.
