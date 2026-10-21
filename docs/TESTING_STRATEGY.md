# Testing Strategy

Test pyramid: many fast unit tests on the engine and KB, focused tests on the AI layer with mocks, a few end-to-end tests. Everything runs locally with `npm run check` (plus `npm run test:e2e` after a build); there is no CI server (Q23). No test calls a real AI provider (except an optional manual eval script).

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
| Base score | hand-calculated cases (e.g. worked example A: modular monolith base = 59.0) |
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
Realistic inputs with an **expected top pick** and **expected top 3 (any order)**. These encode domain judgement, so you review and approve them. Inputs live in `tests/scoring/golden.ts`; `npm run golden:print` prints the top 5 for each.

| # | Scenario | Expected #1 | Also expected | Simulated (2026-10-21) | Real tests (2026-10-20) |
|---|---|---|---|---|---|
| G1 | Student group project, beginner, very limited budget, prototype (example A) | Modular monolith | Layered or service-based in top 3 | MM 69.0, layered 57.0, SBA 56.0 | MM 69.0, layered 57.0, SBA 56.0 ✓ |
| G2 | Solo dev, quick prototype, very tight deadline | Modular monolith or layered | — | MM 71.4, layered 60.7 | MM 66.0, SBA 60.7 ✓ |
| G3 | Concert ticketing, flash spikes, experienced (example B) | Space-based | Serverless/microservices/EDA in top 4 | Space 80.6, serverless 70.6 | Space 80.6, serverless 70.6 ✓ |
| G4 | IoT sensor platform, async events, high availability | Event-driven | — | EDA 84.8 | EDA 86.6 ✓ |
| G5 | 30+ devs, clear domains, frequent independent releases, experienced | Microservices | — | 89.5 | 89.5 ✓ |
| G6 | Mid-size business app, clear domains, migrating legacy monolith | Service-based | MM in top 5 | SBA 78.1 | SBA 80.0, MM #5 49.0 ✓ |
| G7 | ETL / data processing tool | Pipeline | — | 78.0 | 73.9 ✓ (see note) |
| G8 | Product with customer plug-ins, long-lived | Microkernel | — | 76.2 | 73.8 ✓ |
| G9 | Banking ledger: strict ACID, on-prem, regulated, strict workflow | Service-based or modular monolith | serverless excluded; EDA not in top 3 | SBA 62.5, MM 45.8 | SBA 66.7, MM 45.5 ✓ |
| G10 | Startup MVP: tiny team, very limited budget, spiky traffic (deliberate conflict) | Serverless or service-based | conflict surfaced to user | tie 58.0 (SBA wins on simplicity) | tie 58.0 (SBA wins on simplicity), scalability conflict ✓ |
| G11 | Global multi-tenant SaaS, blast-radius isolation | Cell-based | Microservices #2 | 89.1 / 86.0 | 87.1 / 84.4 ✓ (see note) |
| G12 | On-prem + no lock-in + spiky load | Space-based | serverless excluded | 71.3 | 69.6 ✓ |
| G13 | Direct device-to-device sharing, no central server | Peer-to-peer | — | 81.4 | 76.6 ✓ |
| G14 | On-site low-latency processing + async events | Event-driven or edge | edge in top 2 | EDA 87.6, edge 76.0 | EDA 88.1, edge 71.9 ✓ |
| G15 | Changes mostly technical (UI/DB swaps), small beginner team | Layered | MM #2 | 58.8 / 56.0 | 56.3 / 53.8 ✓ |
| G16 | Only "maintainability High", every driver "Not sure" | (no fixed pick) | warning N3 shown | microservices 71.7 + warning | microservices 71.7 + N3 ✓ |
| G17 | Cross-platform desktop IDE with plug-ins, works offline (installed app, one set of needs) | Microkernel | microservices and service-based excluded | — | microkernel 70.1, MM 37.5 ✓ |
| G18 | Growing SaaS: 11–30 devs, clear domains, rapid growth, parts with different needs | Microservices or service-based | note N1 shown | — | ✓ |
| G19 | Ordinary business web app, 4–10 devs, one set of needs | Modular monolith or layered | microservices not in top 2 | — | MM 45.0, SBA 39.0 ✓ |
| G20 | Server product with customer plug-ins (CI-server style), one set of needs | Microkernel | — | — | microkernel 70.1, microservices 42.9 ✓ |
| G21 | The IDE answers with both v1.1 questions left "Not sure" (owner report) | Microkernel | — | — | microkernel 70.1, SBA 61.8 ✓ |
| G22 | Installed app without plug-ins | Modular monolith or layered | microservices excluded | — | ✓ |
| G23 | Hospital system: staff web app + mobile view, one back end, 4–10 devs, moderate growth, parts differ (owner report, v1.2) | Service-based | R23 fires on microservices; note N1 shown | — | SBA 61.4, serverless 55.3, microservices 51.7 ✓ |
| G24 | The same hospital with the contradictory answers "only on the user's device" + "parts differ a lot" | (no fixed pick) | warning N5 shown; R22 and N1 skipped | — | MM 42.4 + N5 ✓ |

**Status: implemented in Phase 2, all 16 pass. G17–G22 added in v1.1 (2026-10-21) after the owner's IDE report (KNOWLEDGE_BASE_DRAFT §8, KB 1.1.0); all 22 pass, and G1–G16 keep their expected picks. G23–G24 added in v1.2 (2026-10-21) after the owner's hospital report (KB 1.2.0); all 24 pass, and G1–G22 are unchanged.** The planning simulation didn't record its inputs (except worked examples A and B, G16 and the G10 tie), so the build session wrote concrete inputs for each scenario from its title. That's why some numbers differ from the simulated column; the expected picks did not change. Notes:
- **G7 sensitivity:** with an ETL input that rates maintainability and testability High (instead of simplicity and cost), microservices ties pipeline at 68.8 and wins on base score. The final input uses simplicity High + cost High, which fits a typical data-processing tool. Logged as Q20.
- **G11 sensitivity:** with clear domains, 30+ devs and *deployability* High, microservices edges out cell-based (87.8 vs 86.9) despite the blast-radius requirement. The final input rates performance High instead (global users). Logged as Q20.
- **G10** with "deployability High, scalability Low" reproduces the simulated tie exactly, so it's likely the original input.

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

**Status (Phase 5):** built in `tests/ai/` (`validate`, `prompt` with a snapshot, `chain` with fake timers, `explain` for T1/T2 cache and budget, `providers` with the AI SDK's `MockLanguageModelV4`, `platform` for the store and rate limit). No test calls a real provider.

## 4. API route tests
`/api/explain` with mocked AI: 400 on invalid body, ignores client-sent scores (recomputes), never returns stack traces, never echoes keys, correct status per AI outcome.

## 4b. Result, form and route tests (built in session 2)
- `tests/recommendation/`: `buildResult` is pure, wraps `score()`, snapshots the KB (flagged estimates marked), matches mentions; `finalScores` reproduces example B's AI illustration (+4 → #2).
- `tests/form/`: there are six examples; every example passes `checkInput` and uses its golden scenario's input (student G1, ide G17, saas G18, iot G4, ticketing G3, enterprise G6; Growing SaaS must rank a domain-partitioned distributed style first); per-step validation; restoring saved answers drops unknown ids.
- `tests/recommendation/reasons.test.ts` (v1.1): `plainReasons()` explains the IDE pick with the plug-in rule and the installed-app exclusions, names the runner-up's biggest penalty, and is pure.
- `tests/scoring/preview.test.ts`: floor chips match the engine for complete input.
- `tests/api/explain.test.ts`: `disabled` with `AI_MODE=off`/unset, 400 on bad JSON or invalid input, 413 on an oversized body, no internals echoed; Phase 5 adds `AI_MODE=mock` ok → cached, each failing fixture → `unavailable`, live without keys calls nothing, 11th request → `rate_limited`, client-sent scores ignored, keys never echoed and notes never logged.

## 5. UI / E2E (Playwright, a few tests; optional, Q24)
**Status (session 2):** `tests/e2e/advisor.spec.ts` covers 1, 4 and 5 (axe WCAG 2.2 AA checks on landing, methodology, form steps and result) plus refresh persistence, floor chips, AI opt-out and JSON download, on desktop and a Pixel 7 viewport. 2 and 3 wait for `AI_MODE=mock` (Phase 5).

**Status (session 4):** 2 and 3 are in `tests/e2e/ai-mock.spec.ts`, plus a third case for the "AI changed the order" banner (`AI_MOCK=reorder`). `playwright.config.ts` starts one production server per setting: AI off on port 3100, and `AI_MODE=mock` with `AI_MOCK=ok`/`fail`/`reorder` on 3101–3103. Shared helpers (`axe`, `aiPanel`) are in `tests/e2e/helpers.ts`. 16 tests (8 × desktop and Pixel 7), ~25 s after `npm run build`. Still optional (Q24).

**Status (session 5):** shareable link cases added: Copy link → reopen in a fresh browser context gives the same top pick; a broken link shows its notice (via `hashchange`, no reload); on the `AI_MOCK=ok` server a shared link asks the AI again. 20 tests (10 × 2 viewports). The encode/decode logic itself is unit-tested in `tests/form/share-link.test.ts` (round-trip of every preset, URL-safe characters, broken/old/partial links, and a fast-check "never throws" property).

**Status (v1.1, 2026-10-21):** rewritten for the new flow: examples open their result from `/advisor?example=<id>`, the desktop IDE example recommends Microkernel with "Ruled out: … Microservices", a new tab starts blank and Start over clears the answers, a broken link opens a blank step 1, and the "AI changed the order" case uses a share link to golden G10. 24 tests (12 × 2 viewports). Set `PW_CHANNEL=msedge` to use an installed Edge instead of Playwright's Chromium; with Edge, the test after the "Download JSON" step can fail at `browser.newContext` (Edge closes after a headless download), so use Playwright's Chromium for a clean run.

1. Example → result → ranked list + trade-off table visible with `AI_MODE=off`.
2. Same with `AI_MODE=mock` (ok): explanation appears, AI delta pill visible.
3. `AI_MODE=mock` (fail): fallback message, ranking still visible.
4. Validation: can't submit without a High/Critical attribute.
5. Keyboard-only run through the form; axe accessibility check on form and result.

## 6. Manual / periodic AI evaluation (not in `npm run check`)
`npm run eval:ai` runs the golden scenarios plus notes against **real** providers (uses quota, run occasionally) and writes a report: schema pass rate, adjustment frequency/size, latency per provider, and a sample of explanations for human reading. Use it when changing prompts or models.

## Coverage targets
Scoring engine ≥ 95% lines, AI validation/chain ≥ 90%, overall ≥ 80%.
