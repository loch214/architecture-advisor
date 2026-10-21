# Requirements

Priority: **M** = must (v1), **S** = should (v1 if time allows), **F** = future.

## Functional requirements

### Input
| ID | Requirement | P |
|---|---|---|
| FR-1 | User can set an importance level (Not needed/Low/Medium/High/Critical) for each quality attribute | M |
| FR-2 | User answers business-driver questions, each with a "Not sure" option | M |
| FR-3 | User selects workload characteristics and constraints | M |
| FR-4 | User can enter free-text notes (≤ 1,000 chars) | M |
| FR-5 | Form validates input with clear messages; requires at least one High/Critical attribute | M |
| FR-6 | Form warns when more than 3 attributes are Critical | M |
| FR-7 | Form shows attribute floors implied by driver answers before submit | S |
| FR-8 | User can open one of six example results (secondary to "Start a new recommendation") | S |
| FR-9 | Answers survive a page refresh in the same tab (session storage); a new visit starts with a blank form; "Start over" is available on every step and on the result | S |

### Rule engine
| ID | Requirement | P |
|---|---|---|
| FR-10 | Engine scores all styles with the formula in `SCORING_ENGINE.md` | M |
| FR-11 | Engine applies constraint rules (modify, exclude, floor) from `rules.json` | M |
| FR-12 | Engine output includes contributions, fired rules, conflicts, warnings | M |
| FR-13 | Engine runs in the browser for instant results, and on the server for trusted AI input | M |

### AI layer
| ID | Requirement | P |
|---|---|---|
| FR-20 | Server sends top 5 + input + notes to the first available provider in the chain | M |
| FR-21 | AI response validated against schema and consistency checks; one repair retry; then fallback | M |
| FR-22 | AI adjustments bounded (±5/style, ≤ 3 styles, top-5 only) and enforced server-side | M |
| FR-23 | If all providers fail, result is rules-only with a clear message | M |
| FR-24 | Tiered cache: identical requests reused (re-validated); similar requests sent to the AI with the previous answer as a reference to verify/adapt; never blind reuse of a similar answer | M |
| FR-25 | Per-IP and global daily rate limits on AI calls | M |

### Output
| ID | Requirement | P |
|---|---|---|
| FR-30 | Ranked list with rule score, AI delta, final score shown separately | M |
| FR-31 | AI explanation: summary, why top pick, why others lower, cautions | M |
| FR-32 | Trade-off table for the top 3–5 styles generated only from KB data | M |
| FR-33 | Excluded styles listed with reasons | M |
| FR-34 | "How this was calculated" section (weights, rules, contributions) | M |
| FR-35 | Companion patterns and anti-pattern warnings for the top pick, from KB | S |
| FR-36 | Download result as JSON | S |
| FR-37 | Shareable link (input encoded in URL; rules recomputed; AI re-fetched/cached). ✅ Built in session 5; notes stay out of the link (Q29) | S |
| FR-38 | Methodology page generated from KB | M |
| FR-39 | Style catalog pages | F (v1.1) |

### Future scope
| ID | Requirement |
|---|---|
| FR-50 | Optional login; save, list, delete past results (Result object stored as-is) |
| FR-51 | Suggested tactics per prioritised attribute (Bass et al.) |
| FR-52 | Export result as an ADR draft (Markdown) |
| FR-53 | QA-scenario helper (six-part scenario builder, Bass et al.) |
| FR-54 | Compare two saved results / "what-if" sliders that re-rank live |
| FR-55 | Feedback button ("Was this helpful?") to tune the KB |

## Non-functional requirements
| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Correctness | Engine is deterministic; golden scenarios pass; KB schema-valid |
| NFR-2 | Availability | Rule results work even if every AI provider and Redis are down |
| NFR-3 | Performance | Rule result < 200 ms after submit on a mid-range laptop; first load LCP < 2.5 s; AI result p50 < 10 s, hard cap 20 s |
| NFR-4 | Cost | Runs entirely on free tiers; no paid API keys |
| NFR-5 | Security | API keys server-only; inputs validated; AI output rendered as plain text; rate limiting |
| NFR-6 | Privacy | No accounts or personal data in v1; notes not logged; privacy notice about third-party AI |
| NFR-7 | Explainability | Every score traceable to KB values + rule ids + AI reasons |
| NFR-8 | Maintainability | Module boundaries enforced by fitness functions; KB editable without code changes |
| NFR-9 | Testability | Engine ≥ 95% line coverage; AI layer tested with mocks |
| NFR-10 | Accessibility | WCAG 2.2 AA; keyboard navigable; screen-reader labels for stars/bars |
| NFR-11 | Portability | Provider model IDs and limits in config; swapping provider = new adapter only |
| NFR-12 | Transparency | Every general-knowledge KB item reviewed before production; sources visible on the methodology page |
