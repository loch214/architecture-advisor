# Testing Strategy

Test pyramid: many fast unit tests on the engine and KB, focused tests on the AI layer with mocks, a few end-to-end tests. Everything runs in CI on every push. No test calls a real AI provider (except an optional manual eval script).

## 1. Knowledge base tests (`tests/kb/`)
- Every JSON file passes its Zod schema.
- Every style has a score for every attribute; values are integers 1–5.
- `cost` score equals `6 − costLevel`.
- Every id referenced in rules, drivers and patterns exists.
- Every rule has a user-facing explanation and a source.
- **Release gate:** in production mode, fails if any source has `reviewed: false`.
- **Snapshot of the score matrix:** any KB score change shows up as a visible diff in review.

## 2. Scoring engine unit tests (`tests/scoring/`)
| Area | Examples |
|---|---|
| Weights | levels map correctly; unset = low; floors use max; conflicts recorded when a floor beats the user's level |
| Base score | hand-calculated cases (e.g. worked example A: modular monolith = 64.1) |
| Normalisation | all-1 style → 0, all-5 style → 100 |
| Rules | each rule fires on its condition only; `otherwise` branches; exclude removes the style; modifier cap ±30; floors from rules |
| Ordering | tie-break chain (final → base → simplicity → id) |
| Validation | rejects zero High/Critical; warns at > 3 Critical; rejects unknown ids |

### Property-based tests (fast-check: generates hundreds of random valid inputs)
1. Determinism: `score(x)` deep-equals `score(x)`.
2. Output contains every non-excluded style exactly once; scores within 0–100.
3. `|final − base| ≤ 30` for every style.
4. Monotonicity: raising weight of attribute `a` doesn't lower the base score of a style whose `x[s][a]` is above its current average.
5. Excluded styles never appear in `ranked`.

### Golden scenario tests (`tests/scoring/golden.test.ts`)
Realistic inputs with an **expected top pick** and **expected top 3 (any order)**. These encode domain judgement, so you review and approve them. Proposed set:

| # | Scenario | Expected #1 | Also expected | Simulated (2026-10-21) |
|---|---|---|---|---|
| G1 | Student group project, beginner, very limited budget, prototype (example A) | Modular monolith | Layered or service-based in top 3 | MM 69.0, layered 57.0, SBA 56.0 ✓ |
| G2 | Solo dev, quick prototype, very tight deadline | Modular monolith or layered | — | MM 71.4, layered 60.7 ✓ |
| G3 | Concert ticketing, flash spikes, experienced (example B) | Space-based | Serverless/microservices/EDA in top 4 | Space 80.6, serverless 70.6 ✓ |
| G4 | IoT sensor platform, async events, high availability | Event-driven | — | EDA 84.8 ✓ |
| G5 | 30+ devs, clear domains, frequent independent releases, experienced | Microservices | — | 89.5 ✓ |
| G6 | Mid-size business app, clear domains, migrating legacy monolith | Service-based | MM in top 5 | SBA 78.1 ✓ |
| G7 | ETL / data processing tool | Pipeline | — | 78.0 ✓ |
| G8 | Product with customer plug-ins, long-lived | Microkernel | — | 76.2 ✓ |
| G9 | Banking ledger: strict ACID, on-prem, regulated, strict workflow | Service-based or modular monolith | serverless excluded; EDA not in top 3 | SBA 62.5, MM 45.8 ✓ |
| G10 | Startup MVP: tiny team, very limited budget, spiky traffic (deliberate conflict) | Serverless or service-based | conflict surfaced to user | tie 58.0 (SBA wins on simplicity) ✓ |
| G11 | Global multi-tenant SaaS, blast-radius isolation | Cell-based | Microservices #2 | 89.1 / 86.0 ✓ |
| G12 | On-prem + no lock-in + spiky load | Space-based | serverless excluded | 71.3 ✓ |
| G13 | Direct device-to-device sharing, no central server | Peer-to-peer | — | 81.4 ✓ |
| G14 | On-site low-latency processing + async events | Event-driven or edge | edge in top 2 | EDA 87.6, edge 76.0 ✓ |
| G15 | Changes mostly technical (UI/DB swaps), small beginner team | Layered | MM #2 | 58.8 / 56.0 ✓ |
| G16 | Only "maintainability High", every driver "Not sure" | (no fixed pick) | warning N3 shown | microservices 71.7 + warning ✓ |

The simulation was a scratch script outside the repo. These rows become the first real tests in Phase 2.

When a KB or rule change breaks a golden test, that's a signal to stop and think: either the change is wrong, or the expectation needs a documented update.

## 3. AI layer tests (`tests/ai/`), all with mocked providers
| Area | Cases |
|---|---|
| Schema | valid fixture passes; missing fields; extra fields stripped; wrong types; delta 0, 6, −7, 2.5; > 3 adjustments; duplicate style ids; unknown style id; excluded style id |
| Parsing | JSON wrapped in ```json fences; leading prose; truncated JSON; empty string |
| Consistency | topPick ≠ #1 after adjustments → invalid; `others` contains topPick → invalid |
| Clamp & apply | adjustments applied, re-sorted with engine tie-break; server clamps even if schema bypassed |
| Sanitising | HTML/script tags and markdown links stripped from strings |
| Chain | provider 1 timeout → provider 2 used; 503 → next; 429-minute → cooling 60 s; 429-daily → exhausted until reset; invalid twice → next; all fail → `unavailable`; total budget 20 s respected (fake timers) |
| Prompt | snapshot of the built prompt for a fixed input (catches accidental prompt bloat); token estimate under budget; notes delimited; no API key strings in prompt |
| Cache T1 | identical input → reuse without AI; whitespace/case changes in notes still identical; kbVersion/promptVersion bump → miss; failures never stored; reused response re-validated against the fresh rule result; `CACHE_IDENTICAL_REUSE=false` forces AI verification |
| Cache T2 | similarity test: each of the 5 conditions has a passing and a failing case (top-3 order differs, weight diff of 2 levels, 3 driver changes, notes Jaccard 0.59, different glossary mentions); reference + diff list appear in the prompt; `fits:true` with failing consistency → invalid; adjustment with stale reason rejected |
| Rate limit | 11th request in window → `rate_limited`; global budget reached → `unavailable` |

## 4. API route tests
`/api/explain` with mocked AI: 400 on invalid body, ignores client-sent scores (recomputes), never returns stack traces, never echoes keys, correct status per AI outcome.

## 5. UI / E2E (Playwright, a few tests)
1. Preset → submit → ranked list + trade-off table visible with `AI_MODE=off`.
2. Same with `AI_MODE=mock` (ok): explanation appears, AI delta pill visible.
3. `AI_MODE=mock` (fail): fallback message, ranking still visible.
4. Validation: can't submit without a High/Critical attribute.
5. Keyboard-only run through the form; axe accessibility check on form and result.

## 6. Manual / periodic AI evaluation (not in CI)
`npm run eval:ai` runs the golden scenarios plus notes against **real** providers (uses quota, run occasionally) and writes a report: schema pass rate, adjustment frequency/size, latency per provider, and a sample of explanations for human reading. Use it when changing prompts or models.

## Coverage targets
Scoring engine ≥ 95% lines, AI validation/chain ≥ 90%, overall ≥ 80%.
