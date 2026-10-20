# ADR-004: One pure engine, run in the browser and on the server

- **Status:** Accepted (2026-10-21; implemented in build session 1)

## Context
Results should appear instantly and keep working when the network or AI is down (NFR-2, NFR-3). The AI prompt, though, must be built from a result the server trusts, not from scores a browser sent.

## Decision
`score(input, kb)` is a pure TypeScript function: no network, clock, randomness, globals, React or Next imports. The browser runs it for the instant result; `/api/explain` runs the same function on the validated input before any AI work. Purity is enforced by dependency-cruiser and ESLint rules (`no-restricted-globals` for `Date`, `fetch`, `crypto`, `Math.random` and browser state).

## Consequences
- Deterministic and unit-testable; property tests check deep-equal output for equal input.
- The server never trusts client scores.
- IDs and timestamps for a saved result are passed in by the caller (`buildResult(..., { id, createdAt })`), keeping the recommendation module pure as well.
