# Research Findings

Research date: 2026-10-21. Free-tier limits change often; re-check before building the AI layer (Roadmap phase 5).

---

## 1. Domain knowledge sources
The knowledge base is built from established literature (detailed per-item sources in `KNOWLEDGE_BASE_DRAFT.md` §9):
- **Richards & Ford, *Fundamentals of Software Architecture*, 2nd ed. (2025):** star ratings for 7 styles (layered Fig 10-6, modular monolith 11-7, microkernel 13-9, service-based 14-8, event-driven 15-39, space-based 16-18, microservices 18-16); architectural quanta; partitioning; patterns.
- **Bass, Clements & Kazman, *Software Architecture in Practice*:** quality attribute definitions, QA scenarios, tactics, ATAM.
- **Modern sources** for styles the book doesn't rate: AWS cell-based whitepaper, Fowler/Roberts on serverless, Prime Video case study, edge computing literature, *Team Topologies*.

### Key ideas that shape the app
1. **Start from needs, not fashion.** The form asks about needs; style names never appear in the input.
2. **Translate business drivers into quality attributes** (e.g. "rapid growth" → scalability, elasticity, availability, deployability). This is the "driver floors" mechanism.
3. **Keep the driving list short** (R&F: pick the top 3). The form warns at more than 3 Critical.
4. **Everything is a trade-off; aim for the least-worst architecture.** The output always shows weaknesses.
5. **Operational and team maturity matter** (R&F on microservices; *Team Topologies*). This is a rule, not an attribute.
6. **Styles vs patterns.** Rank styles; show patterns as companions.
7. **One quality-attribute scope → a monolith is viable; several scopes → consider distribution or a hybrid** (R&F architectural quanta).
8. **AI output can be wrong, slow or nondeterministic.** That's why the design is hybrid, with bounded adjustments and validation.

### Book star ratings used (R&F 2nd ed.)
| Characteristic | Layered | Mod. monolith | Microkernel | Service-based | Event-driven | Space-based | Microservices |
|---|---|---|---|---|---|---|---|
| Overall cost | $ | $ | $ | $$ | $$$ | $$$$ | $$$$$ |
| Partitioning | Technical | Domain | Both | Domain | Technical | Technical | Domain |
| Simplicity | 5 | 5 | 4 | 3 | 2 | 1 | 1 |
| Modularity | 1 | 2 | 3 | 3 | 4 | 3 | 5 |
| Maintainability | 1 | 2 | 3 | 4 | 4 | 3 | 5 |
| Testability | 2 | 2 | 3 | 4 | 2 | 1 | 5 |
| Deployability | 1 | 2 | 3 | 4 | 3 | 3 | 5 |
| Evolvability | 1 | 2 | 3 | 4 | 5 | 3 | 5 |
| Responsiveness | 3 | 3 | 3 | 3 | 5 | 5 | 2 |
| Scalability | 1 | 1 | 1 | 3 | 4 | 5 | 5 |
| Elasticity | 1 | 1 | 1 | 2 | 3 | 5 | 4 |
| Fault tolerance | 1 | 1 | 1 | 3 | 5 | 2 | 5 |

Pipeline and orchestration-driven SOA ratings come from the 1st edition. Pipeline values are partly corroborated by secondary book summaries; SOA values could not be confirmed online (both flagged, see `KNOWLEDGE_BASE_DRAFT.md` §8, 2026-10-20 research). Serverless, cell-based, peer-to-peer and edge are our own reviewed estimates.

---

## 2. Architecture decision methods

| Method | What it is (plain words) | What we take from it |
|---|---|---|
| **Richards & Ford characteristic ratings** | Star ratings per style per characteristic (book figures) | The core scoring matrix |
| **Weighted scoring / weighted sum** | Multiply each criterion's score by its importance, add up | The base formula: simple, explainable, testable |
| **AHP** (Analytic Hierarchy Process) | Compare criteria in pairs to derive weights. Used in several academic style-selection papers | Rejected for v1: pairwise comparison of 13 attributes = 78 questions. Too heavy for beginners |
| **ATAM utility tree** (Bass et al.) | Break broad qualities into concrete scenarios, rank by importance and difficulty | Importance levels; future "write a QA scenario" helper |
| **QA scenarios** (Bass et al.) | Six-part testable requirement (source, stimulus, environment, artifact, response, measure) | Future feature; v1 free text can hint at them |
| **ADRs** (Nygard) | Short records of a decision, its drivers, options and consequences | Future: export a result as an ADR draft. Also how we document this app |

### Similar tools
- **Academic prototypes:** recommender tools using quality attributes + AHP, AHP-DEA, and statistical approaches (e.g. TJEECS vol. 33 iss. 3; Gothenburg AHP thesis; IAJIT 2012/2021). Mostly papers, not public, maintained web apps.
- **Pattern knowledge bases:** e.g. a study mapping 29 patterns to 40 quality attributes.
- **General chatbots (ChatGPT, Gemini):** give answers but are not deterministic, can't show traceable scores, and may hallucinate trade-offs.
- **Gap we fill:** a free, public, deterministic, transparent tool with an AI explanation on top, aimed at learners and small teams. Research also notes that quantitative evidence on style vs attribute impact is thin, so we're explicit that scores are expert judgments with sources.

---

## 3. Free LLM providers (as of Oct 2026)

### Google Gemini (AI Studio free tier)
Google **no longer publishes** free-tier numbers. Limits show only in the AI Studio console and in 429 (rate-limited) error responses. A measurement on 2026-09-02 (new project, no billing) found:

| Model | RPM | RPD |
|---|---|---|
| gemini-3.7 / 3.6 / 3.5 Flash, 3-flash-preview | 5 | **20** |
| gemini-3.5-flash-lite, 3.1-flash-lite | 15 | **500** |

(RPM = requests per minute, RPD = requests per day; limits are per Google Cloud project, and the daily count resets at midnight Pacific time.)

Other findings:
- Gemini 2.5 models return 404 for new API keys.
- gemini-3.7-flash queued heavily on free tier: 27–148 s per request, up to ~350 s under concurrency. That confirms the "overloaded" problem.
- **Free-tier prompts may be used by Google to improve products.** Users must be told not to paste confidential info.

**Decision (owner, 2026-10-21):** use the latest Flash-Lite, currently **`gemini-3.5-flash-lite`** (GA 21 Jul 2026, 1M-token context), as primary.

### Fallback candidates
| Provider | Free limits | Notes | Verdict |
|---|---|---|---|
| **Groq** | 30 RPM, 1,000 RPD, 8K tokens/min, 200K tokens/day per model (gpt-oss-120b, gpt-oss-20b, qwen3.8-27b) | Very fast. OpenAI-compatible API. Supports structured outputs. Retired Llama 3.x on 2026-08-16, so model IDs must be config, not code | **Fallback #1** |
| Cloudflare Workers AI | ~10,000 "Neurons"/day, 300 RPM text | Standing free tier, smaller models | Not used (decided 2026-10-21: two providers are enough) |
| OpenRouter `:free` models | 20 RPM, **50 RPD** (1,000 after a one-time $10 credit purchase) | Free models change daily | Not used; kept as a known option |
| **Cerebras** | $5 trial credit, expires in 30 days; no permanent free tier | — | ✗ Not free long-term |
| **Mistral** | Free plan limits only visible in console; terms unclear | — | ✗ Unclear, skip for now |
| **Cohere** | 1,000 calls/month, evaluation only | Trial keys not for production | ✗ |
| **SambaNova** | 20 RPD | Too low | ✗ |
| **GitHub Models** | Retired 2026-07-30 | — | ✗ |

**Daily AI capacity with the recommended chain:** about 500 (Gemini Flash-Lite) + about 1,000 (Groq) ≈ 1,500 AI explanations/day before rules-only mode. Plenty for a portfolio/student tool, especially with caching.

---

## 4. Hosting and storage (free tiers)

| Service | Free limits | Use |
|---|---|---|
| **Vercel Hobby** | Functions up to 300 s max duration; monthly allotments of invocations/CPU; runtime logs kept 1 h; **personal, non-commercial use only**; account may be paused if limits are exceeded (never billed) | Host the Next.js app |
| **Upstash Redis** | 256 MB, 500K commands/month | AI response cache + per-IP rate limiting (v1, recommended) |
| **Supabase** | 500 MB Postgres, 50K monthly active users, built-in auth; **pauses after 1 week of inactivity** | Future login + saved history |
| **Neon Postgres** | Free tier with small storage per project (exact 2026 limits not confirmed) | Alternative for future history |

Non-commercial clause: fine for a free portfolio tool. If you ever add ads or paid features, Vercel Hobby no longer fits (OPEN_QUESTIONS Q9).

---

## Sources
- M. Richards & N. Ford, *Fundamentals of Software Architecture*, 2nd ed., O'Reilly, 2025
- L. Bass, P. Clements, R. Kazman, *Software Architecture in Practice*
- [AWS: Reducing the Scope of Impact with Cell-Based Architecture](https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/reducing-scope-of-impact-with-cell-based-architecture.html)
- [Serverless computing trade-offs guide (Netguru)](https://www.netguru.com/blog/serverless-computing-architecture-guide)
- [Serverless in 2026: cold starts (tianpan.co)](https://tianpan.co/forum/t/serverless-in-2026-why-are-we-still-talking-about-cold-starts/1124)
- [Micro-frontend architecture (Nx docs)](https://nx.dev/docs/kb/micro-frontend-architecture)
- [Edge computing (Thoughtworks Decoder)](https://www.thoughtworks.com/insights/decoder/e/edge-computing)
- [Gemini 3.5 Flash-Lite release (releases.sh)](https://releases.sh/release/rel_ZedNRgNe6f8ePBXzzhJXT)
- [Gemini API rate limits (official, last updated 2026-10-15)](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Gemini free tier measured: 20 requests/day (aiplug.work)](https://aiplug.work/en/blog/gemini-free-tier-limits)
- [Free LLM API tiers, verified daily (gravity.fast)](https://gravity.fast/data/free-llm-api-tiers/)
- [Groq rate limits (official)](https://console.groq.com/docs/rate-limits)
- [Free LLM APIs compared (OpenRouter blog)](https://openrouter.ai/blog/tutorials/free-llm-apis-compared/)
- [Free LLM API tiers 2026 (ianlpaterson.com)](https://ianlpaterson.com/blog/free-llm-api-2026/)
- [Vercel limits (official, last updated 2026-09-16)](https://vercel.com/docs/limits)
- [Supadrop: Vercel free tier limits](https://www.supadrop.host/blog/vercel-pricing-free-tier-limits/)
- [Upstash free tier (agentdeals.dev)](https://agentdeals.dev/vendor/upstash)
- [Supabase free tier limits 2026 (automationatlas.io)](https://automationatlas.io/answers/supabase-free-tier-limits-2026/)
- [Database free tier comparison 2026 (agentdeals.dev)](https://agentdeals.dev/database-free-tier-comparison-2026)
- [Style recommender tool paper (DOI 10.1145/2695664.2695928)](https://unpaywall.org/10.1145%2F2695664.2695928)
- [AHP-DEA style selection (TJEECS vol 33 iss 3)](https://journals.tubitak.gov.tr/elektrik/vol33/iss3/2/)
- [AHP style selection thesis (Gothenburg)](https://gupea.ub.gu.se/items/3ffb8290-9ce5-4384-8990-c82099a209d5)
- [Architecture style selection using statistics (IAJIT)](https://ccis2k.org/iajit/index.php/archive/volume-9-2012/may-2012-no-3/item/1157-architecture-style-selection-using-statistics-of-quality-attributes-to-reduce-production-costs)
- [Pattern knowledge base study (Utrecht)](https://utrecht-main-test.atmire.com/items/b73b99e7-87c5-4c5f-bcae-4da595ff5781)
